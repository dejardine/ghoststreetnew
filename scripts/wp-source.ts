/**
 * Read-only extraction of the live WordPress site.
 *
 * There is no database archive for Ghost Street, so the sources are:
 *  - the WordPress REST API (page identity: id, slug, title, template, dates)
 *  - the rendered HTML of each live page (theme templates read postmeta that
 *    REST does not expose, so every custom field is recovered from the markup)
 *  - theme files referenced by the pages (fonts, icons, video)
 *
 * Everything is cached in scripts/.cache so a run is deterministic and the
 * live site is only hit once. Delete the cache to re-fetch.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { parse, type HTMLElement } from 'node-html-parser'
import { site } from '../site.config'

export const CACHE = join(import.meta.dirname, '.cache')
const UA = 'Mozilla/5.0 (GhostStreet migration; read-only)'

/** Where a migrated value came from. Written to migration-log.json. */
export type Source = 'rest' | 'html' | 'theme' | 'derived'
export type Sourced<T> = { value: T; source: Source; from: string }
const s = <T>(value: T, source: Source, from: string): Sourced<T> => ({ value, source, from })

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** Fetch a URL once and cache it under scripts/.cache/<key>. */
export async function cached(key: string, url: string): Promise<Buffer> {
  const path = join(CACHE, key)
  if (await exists(path)) return readFile(path)
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, buf)
  return buf
}

export const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

/** Download a live asset (byte-for-byte) into the cache; returns its local path. */
export async function asset(urlOrPath: string) {
  const path = urlOrPath.replace(/^https?:\/\/ghoststreetakl\.nz/, '')
  const rel = path.startsWith('/wp-content/uploads/')
    ? join('assets/uploads', path.replace('/wp-content/uploads/', ''))
    : join('assets/theme', path.replace('/wp-content/themes/ghoststreet/r/', ''))
  const buf = await cached(rel, `${site.url}${path}`)
  return { path: join(CACHE, rel), buf, sha256: sha256(buf), originalPath: path }
}

const html = async (path: string, key: string) =>
  parse((await cached(`html/${key}.html`, `${site.url}${path}`)).toString('utf8'))

type RestPage = {
  id: number
  slug: string
  link: string
  template: string
  status: string
  modified_gmt: string
  title: { rendered: string }
  meta: Record<string, unknown>
}

export type MediaItem = { id: number; source_url: string; alt_text: string; mime_type: string }

/** Decode the handful of entities WordPress emits in titles and attributes. */
export const decode = (str: string) =>
  str
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")

const text = (el: HTMLElement | null | undefined) => decode(el?.textContent.trim() ?? '')

/** A link as WordPress rendered it: href plus whether it opened in a new tab. */
export type SourceLink = { href: string; blank: boolean; text: string }
const link = (a: HTMLElement): SourceLink => {
  const raw = a.getAttribute('href') ?? ''
  // Page Links To marks "open in new tab" with a #new_tab suffix.
  const blank = a.getAttribute('target') === '_blank' || raw.endsWith('#new_tab')
  return { href: raw.replace(/#new_tab$/, ''), blank, text: text(a) }
}

/** The page body that a theme template renders in its right-hand column. */
function pageContent(doc: HTMLElement) {
  const section = doc.querySelector('main .booking-content')!
  return {
    h1: text(section.querySelector('h1')),
    sideImage: section.querySelector('.left img')?.getAttribute('src') ?? null,
    bodyHtml: section.querySelector('.right > div')!.innerHTML.trim(),
    bookingWidget: !!section.querySelector('.eveve-widget'),
  }
}

export async function loadSource() {
  const pages = JSON.parse(
    (await cached('pages.json', `${site.url}/wp-json/wp/v2/pages?per_page=100`)).toString(),
  ) as RestPage[]
  const media = JSON.parse(
    (await cached('media.json', `${site.url}/wp-json/wp/v2/media?per_page=100`)).toString(),
  ) as MediaItem[]
  const altFor = (url: string) =>
    media.find((m) => m.source_url.replace(/^http:/, 'https:') === url.replace(/^http:/, 'https:'))?.alt_text ?? ''

  const home = await html('/', 'index')
  const menu = await html('/menu/', 'menu')
  const footer = home.querySelector('footer.main-footer')!

  // ── Navigation (WordPress "Main" menu, rendered in nav.main-menu) ───────────
  const navigation = home.querySelectorAll('nav.main-menu ul.top-level > li').map((li) => {
    const a = li.querySelector('> a')!
    const children = li.querySelectorAll('ul.sub-menu > li > a').map(link)
    return children.length
      ? { kind: 'dropdown' as const, label: text(a), links: children }
      : { kind: 'link' as const, label: text(a), link: link(a) }
  })

  // ── Social menu (WordPress "Social" menu) ───────────────────────────────────
  const social = home.querySelectorAll('nav.main-menu ul.social li').map((li) => ({
    platform: (li.classList.value.find((c) => ['instagram', 'facebook', 'twitter'].includes(c)) ?? 'instagram') as
      | 'instagram'
      | 'facebook'
      | 'twitter',
    ...link(li.querySelector('a')!),
  }))

  // ── Footer (theme customizer / options, rendered by footer.php) ──────────────
  const contactP = footer.querySelectorAll('.col')[1]!.querySelector('> p')!
  const contactHtml = contactP.innerHTML
  // The theme concatenates: phone, email, hours, address, directions, links.
  const parts = contactHtml.split(/<br\s*\/?>/i).map((p) => decode(parse(p).textContent.replace(/\s+/g, ' ').trim()))
  const phone = parts.find((p) => p.startsWith('Ph:'))!.replace(/^Ph:\s*/, '')
  const email = contactP.querySelector('a[href^="mailto:"]')!.textContent.trim()
  const hoursStart = parts.findIndex((p) => /^Monday/.test(p))
  const hours: string[] = []
  for (let i = hoursStart; i < parts.length && parts[i]; i++) hours.push(parts[i]!)
  const addressStart = parts.findIndex((p, i) => i > hoursStart + hours.length && p)
  const address: string[] = []
  for (let i = addressStart; i < parts.length && parts[i] && !/^View /.test(parts[i]!); i++) address.push(parts[i]!)
  const anchors = contactP.querySelectorAll('a').filter((a) => !a.getAttribute('href')?.startsWith('mailto:'))
  const mapLink = anchors.find((a) => a.getAttribute('href')!.includes('google.com/maps'))!
  const mapFile = anchors.find((a) => a.getAttribute('href')!.includes('/wp-content/uploads/'))!

  const settings = {
    newsletterHeading: s(text(footer.querySelector('#mc_embed_signup h3')), 'html', 'footer #mc_embed_signup h3'),
    socialLinkLabel: s(text(footer.querySelector('.social-trigger a')), 'html', 'footer .social-trigger'),
    footerNoteHtml: s(footer.querySelector('.footer-text')!.innerHTML.trim(), 'html', 'footer .footer-text'),
    venueName: s(text(footer.querySelector('.col h4')), 'html', 'footer .col h4'),
    phone: s(phone, 'html', 'footer contact paragraph'),
    email: s(email, 'html', 'footer contact paragraph mailto'),
    openingHours: s(hours.join('\n'), 'html', 'footer contact paragraph (hours lines)'),
    address: s(address.join('\n'), 'html', 'footer contact paragraph (address lines)'),
    mapLink: s(link(mapLink), 'html', 'footer "View in Google Maps"'),
    mapFile: s(link(mapFile), 'html', 'footer "View Map"'),
    copyright: s(
      text(footer.querySelector('nav.terms li')).replace(/^©\s*\d{4}\s*/, ''),
      'html',
      'footer nav.terms (year stripped; frontend adds the current year)',
    ),
    social: s(social, 'html', 'nav.main-menu ul.social (WordPress Social menu)'),
    specialNoticeHtml: s(
      home.querySelector('.special-overlay .special-wrap-inner')!.innerHTML.replace(/<a[^>]*special-close[^>]*>.*?<\/a>/s, '').trim(),
      'html',
      '.special-overlay (theme option)',
    ),
  }

  // ── Home (page-template index.php) ────────────────────────────────────────
  const coverCss = home.querySelector('.home-page style')!.textContent
  const coverUrls = [...coverCss.matchAll(/url\((https?:[^)]+)\)/g)].map((m) => m[1]!)
  const teaser = (cls: string) => home.querySelector(`.homepage-teasers .${cls}`)!
  const teaserData = (cls: string) => {
    const el = teaser(cls)
    const a = el.querySelector('> a')
    const p = a?.querySelector('p')
    p?.querySelectorAll('img').forEach((img) => img.remove())
    const img = el.querySelectorAll('img').at(-1)!.getAttribute('src')!
    return {
      image: img,
      textHtml: p ? p.innerHTML.trim() : '',
      link: a && a.getAttribute('href') ? link(a) : null,
    }
  }
  const topLink = home.querySelector('.homepage-video .home-top-link a')
  const homeData = {
    heroVideo: s(home.querySelector('.homepage-video source')!.getAttribute('src')!, 'theme', '.homepage-video source'),
    // index.php prints the cover image's WordPress crops into a <style> block.
    coverImage: s(coverUrls[0]!, 'html', '.home-page <style> (desktop crop of the cover image)'),
    coverImageMobile: s(coverUrls[2]!, 'html', '.home-page <style> (max-width: 767px crop)'),
    heroLink: s(topLink ? link(topLink) : null, 'html', '.home-top-link'),
    teaser1: s(teaserData('teaser-top-left'), 'html', '.teaser-top-left'),
    teaser2: s(teaserData('teaser-top-right'), 'html', '.teaser-top-right'),
    teaser4: s(teaserData('teaser-bottom-right'), 'html', '.teaser-bottom-right'),
    reviewsImage: s(
      teaser('teaser-bottom-left').querySelector('> img')!.getAttribute('src')!,
      'html',
      '.teaser-bottom-left > img',
    ),
    reviews: s(
      teaser('teaser-bottom-left')
        .querySelectorAll('.glide__slide')
        .map((slide) => ({ quote: text(slide.querySelector('p')), citation: text(slide.querySelector('cite')) })),
      'html',
      '.teaser-bottom-left .glide__slide',
    ),
  }

  // ── Food Menu (tmpl.menu.php + the unexposed "menu" post type) ───────────────
  const menuCss = menu.querySelector('.menu-page style')!.textContent
  const menuData = {
    coverImage: s([...menuCss.matchAll(/url\((https?:[^)]+)\)/g)][0]![1]!, 'html', '.menu-page <style>'),
    menus: s(
      menu.querySelectorAll('.menu-grid li a').map((a) => ({ label: text(a), file: a.getAttribute('href')! })),
      'html',
      '.menu-grid li (menu CPT posts: title + PDF meta)',
    ),
  }

  // ── Pages with their own document (tmpl.booking.php / page.php) ─────────────
  const contentPages = await Promise.all(
    ['bookings', 'private-events', 'pickup-delivery'].map(async (slug) => {
      const rest = pages.find((p) => p.slug === slug)!
      const content = pageContent(await html(`/${slug}/`, slug))
      return {
        slug,
        wpId: rest.id,
        title: s(decode(rest.title.rendered), 'rest' as const, `pages/${rest.id} title`),
        template: rest.template || 'page.php (default)',
        modified: rest.modified_gmt,
        h1: s(content.h1, 'html' as const, '.booking-content h1 (template prints a page meta field)'),
        sideImage: s(content.sideImage, 'theme' as const, '.booking-content .left img (hardcoded in template)'),
        bodyHtml: s(content.bodyHtml, 'html' as const, '.booking-content .right > div (post content via meta)'),
        bookingWidget: s(content.bookingWidget, 'html' as const, '.eveve-widget present in template'),
      }
    }),
  )

  return {
    rest: { pages, media },
    altFor,
    settings,
    navigation: s(navigation, 'html', 'nav.main-menu ul.top-level (WordPress Main menu)'),
    home: homeData,
    menu: menuData,
    contentPages,
  }
}

export type WpSource = Awaited<ReturnType<typeof loadSource>>
