/**
 * Visual/behavioural parity probe: production WordPress vs the new build.
 *
 *   npx tsx scripts/parity.ts [--new http://localhost:3457] [--prod https://ghoststreetakl.nz]
 *                             [--pages /,/bookings/] [--widths 1440,375] [--json out.json]
 *
 * For each page and viewport it loads both sites in headless Chrome, lets scroll reveals run,
 * then measures the same elements (selector pairs below): bounding box, key computed styles and
 * text. It also compares <title>, H1s, link/PDF counts and document height. Differences beyond
 * 1px (geometry) or any computed-style mismatch are reported.
 */
import { writeFile } from 'node:fs/promises'
import puppeteer, { type Page } from 'puppeteer-core'

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1]! : fallback
}
const NEW = arg('new', 'http://localhost:3457')
const PROD = arg('prod', 'https://ghoststreetakl.nz')
const PAGES = arg('pages', '/,/bookings/,/private-events/,/pickup-delivery/,/menu/').split(',')
const VIEWPORTS: Record<string, [number, number]> = {
  1440: [1440, 900], 1280: [1280, 800], 1024: [1024, 768], 768: [768, 1024], 375: [375, 812],
}
const WIDTHS = arg('widths', Object.keys(VIEWPORTS).join(',')).split(',')
const JSON_OUT = process.argv.includes('--json') ? arg('json', 'parity.json') : null

/** [label, production selector, new selector]. Elements are matched by index. */
type Probe = [string, string, string]
const common: Probe[] = [
  ['header', '.main-header', '.main-header'],
  ['hamburger', '.hamburger', '.hamburger'],
  ['footer', '.main-footer', '.main-footer'],
  ['footer wrap', '.main-footer .wrap', '.main-footer .wrap'],
  ['footer col', '.main-footer .col', '.main-footer .col'],
  ['signup', '#mc_embed_signup', '#mc_embed_signup'],
  ['signup h3', '#mc_embed_signup h3', '#mc_embed_signup h3'],
  ['signup input', '#mce-EMAIL', '#mce-EMAIL'],
  ['footer nav li', '.main-footer nav:not(.terms) li', '.main-footer nav:not(.terms) li'],
  ['footer note p', '.footer-text p', '.footer-text p'],
  ['footer h4', '.main-footer .col h4', '.main-footer .col h4'],
  ['contact p', '.main-footer .col > p', '.main-footer .col > p'],
  ['terms li', '.main-footer nav.terms li', '.main-footer nav.terms li'],
  ['arrow up', '.arrow-up', '.arrow-up'],
]
const perPage: Record<string, Probe[]> = {
  '/': [
    ['video', '.homepage-video video', '.homepage-video video'],
    ['logo (desktop)', '.home-page > .logo', '.homepage-video .logo'],
    ['cover (phone)', '.home-page .cover-image', '.home-page .cover-image'],
    ['cover logo', '.cover-image .logo', '.cover-image .logo'],
    ['teaser', '.teaser', '.teaser'],
    ['teaser text', '.teaser a p', '.teaser-link p'],
    ['menu icon', '.teaser-top-right p img', '.teaser-top-right p img'],
    ['teaser image', '.teaser > a > img', '.teaser-link > img'],
    ['review quote', '.teaser-bottom-left .glide__slide p', '.teaser-bottom-left .glide__slide p'],
    ['review cite', '.teaser-bottom-left cite', '.teaser-bottom-left cite'],
    ['reviews image', '.teaser-bottom-left > img', '.teaser-bottom-left > img'],
  ],
  '/menu/': [
    ['menu section', '.menu-page', '.menu-page'],
    ['menu cover', '.menu-page .cover-image', '.menu-page .cover-image'],
    ['menu grid', '.menu-grid', '.menu-grid'],
    ['menu button', '.menu-grid li a', '.menu-grid li a'],
  ],
}
const contentPage: Probe[] = [
  ['columns', '.booking-content', '.booking-content'],
  ['left', '.booking-content .left', '.booking-content .left'],
  ['right', '.booking-content .right', '.booking-content .right'],
  ['h1', '.booking-content h1', '.booking-content h1'],
  ['side image', '.booking-content .left img', '.booking-content .left img'],
  ['body p', '.booking-content .right p', '.booking-content .right p'],
  ['body strong', '.booking-content .right strong', '.booking-content .right strong'],
  ['booking widget', '.eveve-widget', '.eveve-widget'],
]

const STYLE_PROPS = ['fontFamily', 'fontSize', 'lineHeight', 'color', 'backgroundColor', 'letterSpacing', 'textAlign', 'textTransform', 'display'] as const

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    document.querySelector('.preloader')?.remove()
    const step = Math.max(200, innerHeight / 2)
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    scrollTo(0, 0)
  })
  await new Promise((r) => setTimeout(r, 2500))
}

async function measure(page: Page, probes: Probe[], which: 1 | 2) {
  return page.evaluate(
    (probes, which, props) => {
      const familyName = (f: string) =>
        /light|Financier Text/i.test(f) ? 'text' : /display|Financier Display/i.test(f) ? 'display' : f
      const out: Record<string, unknown[]> = {}
      for (const probe of probes) {
        const els = [...document.querySelectorAll<HTMLElement>(probe[which])].slice(0, 12)
        out[probe[0]] = els.map((el) => {
          const r = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          const style: Record<string, string> = {}
          for (const p of props) style[p] = p === 'fontFamily' ? familyName(cs.fontFamily) : (cs as unknown as Record<string, string>)[p]!
          return {
            rect: [r.x, r.y + scrollY, r.width, r.height].map((n) => Math.round(n * 10) / 10),
            style,
            text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          }
        })
      }
      const links = [...document.querySelectorAll<HTMLAnchorElement>('main a[href], footer a[href]')]
      return {
        probes: out,
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map((h) => (h as HTMLElement).innerText.trim()),
        links: links.length,
        pdfs: links.filter((a) => /\.pdf(\?|$)/i.test(a.href)).length,
        docHeight: document.documentElement.scrollHeight,
        overflowX: document.documentElement.scrollWidth > innerWidth,
      }
    },
    probes,
    which,
    STYLE_PROPS as unknown as string[],
  )
}

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
})
const report: unknown[] = []
let diffs = 0

for (const path of PAGES) {
  const probes = [...common, ...(perPage[path] ?? (path === '/' || path === '/menu/' ? [] : contentPage))]
  for (const w of WIDTHS) {
    const [width, height] = VIEWPORTS[w]!
    const results = []
    for (const [site, base, which] of [['prod', PROD, 1], ['new', NEW, 2]] as const) {
      const page = await browser.newPage()
      // tsx compiles functions with a __name() helper that doesn't exist in the page.
      await page.evaluateOnNewDocument('window.__name = (fn) => fn')
      await page.setViewport({ width, height })
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle2', timeout: 60000 })
      await settle(page)
      results.push({ site, ...(await measure(page, probes, which)) })
      await page.close()
    }
    const [prod, next] = results as [Awaited<ReturnType<typeof measure>>, Awaited<ReturnType<typeof measure>>]
    const lines: string[] = []
    for (const [label] of probes) {
      const a = prod.probes[label] as { rect: number[]; style: Record<string, string>; text: string }[]
      const b = next.probes[label] as typeof a
      if (a.length !== b.length) lines.push(`  ${label}: count ${a.length} → ${b.length}`)
      a.forEach((pa, i) => {
        const pb = b[i]
        if (!pb) return
        const d = pa.rect.map((v, k) => Math.abs(v - pb.rect[k]!))
        if (d.some((v) => v > 1)) lines.push(`  ${label}[${i}] rect ${pa.rect.join(',')} → ${pb.rect.join(',')}`)
        for (const p of STYLE_PROPS) if (pa.style[p] !== pb.style[p]) lines.push(`  ${label}[${i}] ${p}: ${pa.style[p]} → ${pb.style[p]}`)
        if (pa.text !== pb.text) lines.push(`  ${label}[${i}] text: "${pa.text}" → "${pb.text}"`)
      })
    }
    if (prod.title !== next.title) lines.push(`  title: "${prod.title}" → "${next.title}"`)
    if (JSON.stringify(prod.h1) !== JSON.stringify(next.h1)) lines.push(`  h1: ${JSON.stringify(prod.h1)} → ${JSON.stringify(next.h1)}`)
    if (prod.links !== next.links) lines.push(`  links: ${prod.links} → ${next.links}`)
    if (prod.pdfs !== next.pdfs) lines.push(`  pdfs: ${prod.pdfs} → ${next.pdfs}`)
    if (Math.abs(prod.docHeight - next.docHeight) > 1) lines.push(`  docHeight: ${prod.docHeight} → ${next.docHeight}`)
    if (next.overflowX) lines.push('  NEW HAS HORIZONTAL OVERFLOW')
    diffs += lines.length
    console.log(`\n${path} @ ${width}×${height}: ${lines.length ? `${lines.length} difference(s)` : 'match'}`)
    lines.forEach((l) => console.log(l))
    report.push({ path, width, prod, new: next, differences: lines })
  }
}

await browser.close()
if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(report, null, 2))
console.log(`\n${diffs} difference(s) in total`)
