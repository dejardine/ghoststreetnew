/**
 * WordPress → Prismic migration for Ghost Street.
 *
 *   npx tsx scripts/migrate.ts --dry       build everything, write audit files, touch nothing
 *   npx tsx scripts/migrate.ts             upload assets + write documents to the migration release (drafts)
 *   npx tsx scripts/migrate.ts --publish   same, then publish the migration release
 *
 * Output (scripts/output/): documents.json, migration-log.json, url-map.md.
 * State (scripts/migration-state.json, committed): Prismic IDs for every document and asset,
 * so reruns update in place instead of duplicating singletons or re-uploading files.
 *
 * POST-LAUNCH SAFETY: once a document has been published by this script, a rerun compares its
 * current last_publication_date with the one recorded in the state file. If an editor has
 * republished it since, the document is skipped (logged) unless --overwrite-edits is passed.
 * Do not rerun the full WordPress migration for routine edits.
 */
import 'dotenv/config'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import * as prismic from '@prismicio/client'
import { htmlAsRichText } from '@prismicio/migrate'
import { parse } from 'node-html-parser'
import { site } from '../site.config'
import { asset, decode, loadSource, type SourceLink } from './wp-source'

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')
const PUBLISH = args.has('--publish')
const OVERWRITE_EDITS = args.has('--overwrite-edits')

const OUT = join(import.meta.dirname, 'output')
const STATE_FILE = join(import.meta.dirname, 'migration-state.json')

type State = {
  documents: Record<string, { id: string; type: string; uid?: string; lastPublicationDate?: string }>
  assets: Record<string, { id: string; url: string; sha256: string; originalPath: string }>
}
const state: State = JSON.parse(await readFile(STATE_FILE, 'utf8').catch(() => '{"documents":{},"assets":{}}'))

const log: { level: 'info' | 'fix' | 'drop' | 'warn'; doc?: string; field?: string; message: string; source?: string }[] = []
const note = (level: (typeof log)[number]['level'], message: string, extra: Omit<(typeof log)[number], 'level' | 'message'> = {}) => {
  log.push({ level, message, ...extra })
  if (level !== 'info') console.log(`  [${level}] ${extra.doc ? extra.doc + ': ' : ''}${message}`)
}

const token = process.env.PRISMIC_WRITE_TOKEN
if (!DRY && !token) throw new Error('PRISMIC_WRITE_TOKEN is missing from .env')
const client = prismic.createWriteClient(site.prismicRepo, { writeToken: token ?? 'dry-run' })
const migration = prismic.createMigration()

// ───────────────────────────────────────────────────────────── assets ──
const MIME: Record<string, string> = {
  jpg: 'image/jpeg', svg: 'image/svg+xml', mp4: 'video/mp4', pdf: 'application/pdf',
}
const assetManifest: { key: string; originalPath: string; sha256: string; bytes: number }[] = []
const registered = new Map<string, prismic.PrismicMigrationAsset | string>()

/**
 * Register a live file as a Prismic asset, once per source path. Files uploaded on a previous
 * run (same path, same SHA-256) are referenced by their asset ID instead of being re-uploaded.
 */
async function upload(urlOrPath: string, alt = ''): Promise<prismic.PrismicMigrationAsset | string> {
  const a = await asset(urlOrPath)
  const key = a.originalPath
  const seen = registered.get(key)
  if (seen) return seen
  assetManifest.push({ key, originalPath: a.originalPath, sha256: a.sha256, bytes: a.buf.length })
  const known = state.assets[key]
  let value: prismic.PrismicMigrationAsset | string
  if (known && known.sha256 === a.sha256) {
    value = known.id
  } else {
    const ext = basename(key).split('.').pop()!
    const file = new File([a.buf], basename(key), { type: MIME[ext] ?? 'application/octet-stream' })
    value = migration.createAsset(file, basename(key), { alt, notes: `Migrated from WordPress ${key}` })
  }
  registered.set(key, value)
  return value
}

/** Image field value. */
const image = async (urlOrPath: string, alt = '') => {
  const v = await upload(urlOrPath, alt)
  return typeof v === 'string' ? { id: v, alt: alt || null } : v
}

/** Link-to-media field value. */
const file = async (urlOrPath: string, text?: string) => ({
  link_type: 'Media' as const,
  id: await upload(urlOrPath),
  ...(text ? { text } : {}),
})

// ──────────────────────────────────────────────────────── rich text ──
const INTERNAL = /^https?:\/\/(www\.)?ghoststreetakl\.nz/i

/**
 * HTML → Prismic rich text, preserving what production rendered:
 *  - Word-paste spans that visibly restyle text become labels (red-serif, gold-small)
 *  - <p style="margin-bottom: 0cm"> (Word "MsoNormal" tight paragraphs) get the `tight` label
 *  - empty spacer paragraphs keep a non-breaking space so they keep their height
 *  - Tailwind/ChatGPT paste attributes are dropped (they resolve to nothing on the live site)
 */
function richText(html: string, ctx: { doc: string; field: string }): prismic.RichTextField {
  const root = parse(html)
  root.querySelectorAll('img[src^="data:"]').forEach((img) => {
    note('drop', 'removed base64 Word-paste spacer image', ctx)
    img.remove()
  })
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')!
    if (INTERNAL.test(href)) {
      const path = href.replace(INTERNAL, '') || '/'
      note('fix', `internal link ${href} kept as absolute production URL (${path})`, ctx)
    }
  })
  const paragraphs = root.querySelectorAll('p').map((p) => ({
    tight: /margin-bottom:\s*0(cm|px)?\b/.test(p.getAttribute('style') ?? ''),
    empty: decode(p.textContent).trim() === '',
  }))
  const { result, warnings } = htmlAsRichText(root.toString(), {
    serializer: {
      'span[style*="Georgia"]': { label: 'red-serif' },
      'span[style*="#b6b266"]': { label: 'gold-small' },
      'span[style*="font-weight: bold"]': 'strong',
      'span[style*="font-weight: 700"]': 'strong',
    },
  })
  warnings.forEach((w) => note('warn', `htmlAsRichText: ${w}`, ctx))
  const blocks = result as prismic.RTNode[]
  const textBlocks = blocks.filter((b) => b.type === 'paragraph')
  if (textBlocks.length !== paragraphs.length) {
    note('warn', `paragraph count changed (${paragraphs.length} → ${textBlocks.length}); spacing labels skipped`, ctx)
    return blocks as prismic.RichTextField
  }
  textBlocks.forEach((block, i) => {
    const b = block as prismic.RTParagraphNode
    const meta = paragraphs[i]!
    if (meta.empty) {
      ;(b as { text: string }).text = ' '
      b.spans = []
      note('fix', `spacer paragraph #${i + 1} kept as a non-breaking space`, ctx)
    }
    if (meta.tight) {
      b.spans = [...b.spans, { type: 'label', data: { label: 'tight' }, start: 0, end: b.text.length }]
    }
  })
  return blocks as prismic.RichTextField
}

const plainRichText = (text: string): prismic.RichTextField =>
  text ? [{ type: 'paragraph', text, spans: [], direction: 'ltr' } as prismic.RTParagraphNode] : []

// ─────────────────────────────────────────────────────────── links ──
/** Migration documents, or the published document itself when a rerun skips it. */
const docs: Record<string, prismic.PrismicMigrationDocument | prismic.PrismicDocument> = {}

/** Internal URL → document link; anything else → web link (keeps new-tab behaviour). */
function linkField(l: SourceLink | null, ctx: { doc: string; field: string }, withText = false) {
  if (!l || !l.href) return undefined
  const text = withText && l.text ? { text: l.text } : {}
  if (INTERNAL.test(l.href)) {
    const path = new URL(l.href.replace(/^http:/, 'https:')).pathname
    const key = path === '/' ? 'home' : path === '/menu/' ? 'food_menu' : `page:${path.replaceAll('/', '')}`
    const target = docs[key]
    if (!target) {
      note('warn', `internal link ${l.href} has no migrated document; kept as web link`, ctx)
    } else {
      return { link_type: 'Document', id: target, ...text } as const
    }
  }
  return { link_type: 'Web', url: l.href, ...(l.blank ? { target: '_blank' } : {}), ...text } as const
}

// ───────────────────────────────────────────────────── documents ──
/** Create or update a document, honouring the post-launch safety rule. */
async function upsert<T extends prismic.PrismicDocument>(
  key: string,
  doc: { type: T['type']; uid?: string; data: Record<string, unknown> },
  title: string,
) {
  const known = state.documents[key]
  if (known && !DRY) {
    const current = await client.getByID(known.id).catch(() => null)
    if (current && known.lastPublicationDate && current.last_publication_date !== known.lastPublicationDate && !OVERWRITE_EDITS) {
      note('warn', `published version changed since the migration (${known.lastPublicationDate} → ${current.last_publication_date}); skipped to protect editor changes`, { doc: key })
      // Links from other documents still resolve to it; its content is left untouched.
      docs[key] = current
      return
    }
    if (current) {
      docs[key] = migration.updateDocument({ ...current, uid: doc.uid ?? current.uid, data: doc.data } as never, title)
      return
    }
  }
  docs[key] = migration.createDocument({ type: doc.type, uid: doc.uid, lang: masterLocale, data: doc.data } as never, title)
}

const masterLocale = DRY ? 'en-us' : (await client.getRepository()).languages[0]!.id
const src = await loadSource()
const documentsOut: Record<string, unknown> = {}
const fieldSources: Record<string, Record<string, string>> = {}
const from = (doc: string, field: string, s: { source: string; from: string }) => {
  ;(fieldSources[doc] ??= {})[field] = `${s.source}: ${s.from}`
}

console.log(`Ghost Street migration — ${DRY ? 'DRY RUN' : PUBLISH ? 'migrate + publish' : 'migrate (drafts)'}`)

// Register page documents first so navigation links can point at them.
for (const page of src.contentPages) {
  const key = `page:${page.slug}`
  const ctx = { doc: key, field: 'body' }
  for (const f of ['title', 'h1', 'sideImage', 'bodyHtml', 'bookingWidget'] as const) from(key, f, page[f])
  if (page.slug === 'pickup-delivery') note('info', 'WordPress slug "pickup-delivery" kept so the existing URL keeps working', { doc: key })
  const data = {
    meta_title: page.title.value,
    meta_description: '',
    title: [{ type: 'heading1', text: page.h1.value, spans: [], direction: 'ltr' }],
    side_image: await image(page.sideImage.value!),
    body: richText(page.bodyHtml.value, ctx),
    show_booking_widget: page.bookingWidget.value,
  }
  documentsOut[key] = data
  await upsert(key, { type: 'page', uid: page.slug, data }, page.title.value)
}

// Home
{
  const key = 'home'
  const h = src.home
  for (const [f, v] of Object.entries(h)) from(key, f, v)
  // WordPress printed the 2560×1440 / 767×999 crops; upload the originals and let imgix crop.
  const heroOriginal = '/wp-content/uploads/2021/04/homepage-hero-1-scaled.jpg'
  const mobileOriginal = '/wp-content/uploads/2021/04/GS_Mobile-Home.jpg'
  note('info', `cover images: uploaded originals ${heroOriginal}, ${mobileOriginal}; frontend reproduces WordPress crops with imgix`, { doc: key })
  if (!h.heroLink.value?.text) note('info', 'hero announcement link has no text on the live site (renders nothing); migrated as-is', { doc: key, field: 'hero_link' })
  const teaserText = (htmlStr: string) => plainRichText(decode(parse(htmlStr).textContent.trim()))
  const data = {
    meta_title: '',
    meta_description: '',
    hero_video: await file(h.heroVideo.value),
    cover_image: await image(heroOriginal),
    cover_image_mobile: await image(mobileOriginal),
    hero_link: linkField(h.heroLink.value, { doc: key, field: 'hero_link' }, true),
    teaser_1_image: await image(h.teaser1.value.image),
    teaser_1_text: teaserText(h.teaser1.value.textHtml),
    teaser_1_link: linkField(h.teaser1.value.link, { doc: key, field: 'teaser_1_link' }),
    teaser_2_image: await image(h.teaser2.value.image),
    teaser_2_text: teaserText(h.teaser2.value.textHtml),
    teaser_2_link: linkField(h.teaser2.value.link, { doc: key, field: 'teaser_2_link' }),
    reviews_image: await image(h.reviewsImage.value),
    reviews: h.reviews.value,
    teaser_4_image: await image(h.teaser4.value.image),
    teaser_4_text: teaserText(h.teaser4.value.textHtml),
    teaser_4_link: linkField(h.teaser4.value.link, { doc: key, field: 'teaser_4_link' }),
  }
  for (const k of Object.keys(data) as (keyof typeof data)[]) if (data[k] === undefined) delete data[k]
  documentsOut[key] = data
  await upsert(key, { type: 'home', data }, 'Home')
}

// Food Menu
{
  const key = 'food_menu'
  const m = src.menu
  from(key, 'coverImage', m.coverImage)
  from(key, 'menus', m.menus)
  const original = '/wp-content/uploads/2021/04/Menu-Background.jpg'
  const menuPage = src.rest.pages.find((p) => p.slug === 'menu')!
  const data = {
    meta_title: '',
    meta_description: '',
    title: decode(menuPage.title.rendered),
    cover_image: await image(original),
    menus: await Promise.all(
      m.menus.value.map(async (item) => ({
        label: item.label,
        file: await file(item.file),
      })),
    ),
  }
  note('info', 'menu CPT singles (/menu/to-eat/ etc.) are broken story-template leftovers; only their title + PDF are migrated, URLs 301 to /menu/', { doc: key })
  note('drop', 'data-menu-image (hover image per menu) is empty on every menu post and the hover layer never shows; not migrated', { doc: key })
  documentsOut[key] = data
  await upsert(key, { type: 'food_menu', data }, 'Food Menu')
}

// Navigation
{
  const key = 'navigation'
  from(key, 'slices', src.navigation)
  const slices = src.navigation.value.map((item, i) => {
    const ctx = { doc: key, field: `slices[${i}]` }
    if (item.kind === 'link') {
      return {
        slice_type: 'navigation_link', variation: 'default', version: 'initial', items: [],
        primary: { label: item.label, link: linkField(item.link, ctx) },
      }
    }
    return {
      slice_type: 'navigation_dropdown', variation: 'default', version: 'initial', items: [],
      primary: {
        label: item.label,
        links: item.links.map((l) => ({ label: l.text, link: linkField(l, ctx) })),
      },
    }
  })
  const data = { slices }
  documentsOut[key] = data
  await upsert(key, { type: 'navigation', data }, 'Navigation')
}

// Settings
{
  const key = 'settings'
  const st = src.settings
  for (const [f, v] of Object.entries(st)) from(key, f, v)
  const footerNote = decode(parse(st.footerNoteHtml.value).textContent.trim())
  note('fix', 'footer note: stripped Tailwind/ChatGPT paste classes and inline CSS variables (they resolve to plain text on the live site)', { doc: key, field: 'footer_note' })
  if (st.specialNoticeHtml.value.trim().toLowerCase() === 'nothing') {
    note('drop', 'special overlay contains the placeholder word "nothing" and has no trigger link on the live site; field kept empty (feature kept for seasonal notices)', { doc: key, field: 'special_notice' })
  }
  const mapUrl = st.mapFile.value.href.replace(/^http:/, 'https:')
  note('fix', `footer map link ${st.mapFile.value.href} → uploaded to Prismic as a Media link (static copy kept at the original path)`, { doc: key, field: 'map_file' })
  const data = {
    newsletter_heading: st.newsletterHeading.value,
    social_link_label: st.socialLinkLabel.value,
    footer_note: plainRichText(footerNote),
    venue_name: st.venueName.value,
    phone: st.phone.value,
    email: st.email.value,
    opening_hours: plainRichText(st.openingHours.value),
    address: plainRichText(st.address.value),
    map_link: { link_type: 'Web', url: st.mapLink.value.href, target: '_blank', text: st.mapLink.value.text },
    map_file: await file(mapUrl, st.mapFile.value.text),
    copyright: st.copyright.value,
    social_links: st.social.value.map((s) => ({
      platform: s.platform,
      url: { link_type: 'Web', url: s.href, ...(s.blank ? { target: '_blank' } : {}) },
    })),
    special_link_label: '',
    special_notice: [],
  }
  documentsOut[key] = data
  await upsert(key, { type: 'settings', data }, 'Settings')
}

// ───────────────────────────────────────────────────── audit output ──
await mkdir(OUT, { recursive: true })
const urlMap = [
  '| Old URL | New URL | Status | Notes |',
  '| --- | --- | --- | --- |',
  '| / | / | 200 | Home (Prismic `home`) |',
  '| /home/ | / | 301 | WordPress front-page slug |',
  '| /bookings/ | /bookings/ | 200 | Prismic `page` (bookings) |',
  '| /private-events/ | /private-events/ | 200 | Prismic `page` (private-events) |',
  '| /pickup-delivery/ | /pickup-delivery/ | 200 | Prismic `page` (pickup-delivery); not linked in the menu on the live site either |',
  '| /menu/ | /menu/ | 200 | Prismic `food_menu` |',
  '| /menu/to-eat/ | /menu/ | 301 | Legacy `menu` post (broken story template); PDF now on /menu/ |',
  '| /menu/to-drink/ | /menu/ | 301 | as above |',
  '| /menu/chefs-menu/ | /menu/ | 301 | as above |',
  '| /menu/vegan-set-menu/ | /menu/ | 301 | as above |',
  '| /vouchers/ | https://vouchers.appropo.io/cafe-hanoi-ghost-street/checkout | 301 | WordPress "Page Links To" redirect |',
  '| /author/comensa/, /author/ghoststreet/ | / | 301 | Author archives (no content) |',
  '| /wp-sitemap.xml (+ sub-sitemaps) | /sitemap.xml | 301 | |',
  '| /wp-content/uploads/... (PDFs, map, images) | same path | 200 | Byte-for-byte static copies |',
  '| /feed/, /comments/feed/ | / | 301 | No posts |',
].join('\n')
await writeFile(join(OUT, 'url-map.md'), `# URL map\n\n${urlMap}\n`)
await writeFile(join(OUT, 'documents.json'), JSON.stringify(documentsOut, (k, v) => (v instanceof prismic.PrismicMigrationAsset ? `asset:${v.config.filename}` : v instanceof prismic.PrismicMigrationDocument ? `doc:${v.title}` : v), 2))

if (!DRY) {
  await client.migrate(migration, {
    reporter: (e) => {
      if (e.type === 'assets:creating') console.log(`  asset ${e.data.current}/${e.data.total} ${e.data.asset.config.filename}`)
      if (e.type === 'documents:creating' || e.type === 'documents:updating') console.log(`  ${e.type.split(':')[1]} ${e.data.current}/${e.data.total} ${e.data.document.title}`)
      if (e.type === 'end') console.log(`  done: ${JSON.stringify(e.data.migrated)}`)
    },
  })
  for (const [key, a] of registered) {
    if (typeof a === 'string' || !a.asset) continue
    const sha = assetManifest.find((m) => m.key === key)!.sha256
    state.assets[key] = { id: a.asset.id, url: a.asset.url, sha256: sha, originalPath: key }
  }
  for (const [key, d] of Object.entries(docs)) {
    if (!(d instanceof prismic.PrismicMigrationDocument) || !d.document.id) continue
    state.documents[key] = { ...state.documents[key], id: d.document.id, type: d.document.type, uid: d.document.uid ?? undefined }
  }
  if (PUBLISH) {
    const publishedAt = Date.now() - 5000
    const res = await client.publishMigrationRelease()
    console.log(`  published migration release: ${JSON.stringify(res)}`)
    // Record each document's new publication date: the post-launch safety baseline. The CDN can
    // serve a stale ref for a while, so poll until every touched document shows a fresh date.
    const touched = Object.entries(docs).filter(([, d]) => d instanceof prismic.PrismicMigrationDocument).map(([k]) => k)
    for (let attempt = 0; attempt < 40 && touched.length; attempt++) {
      await new Promise((r) => setTimeout(r, 3000))
      const published = await prismic.createClient(site.prismicRepo).dangerouslyGetAll().catch(() => [])
      for (const key of [...touched]) {
        const p = published.find((x) => x.id === state.documents[key]?.id)
        if (p && Date.parse(p.last_publication_date) >= publishedAt) {
          state.documents[key]!.lastPublicationDate = p.last_publication_date
          touched.splice(touched.indexOf(key), 1)
        }
      }
      if (touched.length) console.log(`  waiting for ${touched.length} document(s) to refresh on the CDN…`)
    }
    if (touched.length) note('warn', `publication dates not confirmed for: ${touched.join(', ')}; rerun --publish later to record them`)
  }
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n')
}

await writeFile(
  join(OUT, 'migration-log.json'),
  JSON.stringify({ mode: DRY ? 'dry' : PUBLISH ? 'publish' : 'draft', at: new Date().toISOString(), fieldSources, assets: assetManifest, log }, null, 2),
)
console.log(`Wrote ${OUT}/documents.json, migration-log.json, url-map.md`)
