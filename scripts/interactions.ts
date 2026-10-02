/**
 * Behavioural checks against a built site (default: local static build).
 *
 *   npx tsx scripts/interactions.ts [--base http://localhost:3457]
 *
 * Menu open/close (transitions really run), submenu, Escape, social overlay, client-side
 * navigation with the crossfade, booking widget after navigating away and back, no console
 * errors, no horizontal overflow on phones, reduced motion, 404 page.
 */
import puppeteer, { type Page } from 'puppeteer-core'

const i = process.argv.indexOf('--base')
const BASE = i > -1 ? process.argv[i + 1]! : 'http://localhost:3457'
const results: [string, boolean, string?][] = []
const check = (name: string, ok: boolean, detail?: string) => results.push([name, ok, detail])
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

async function open(path: string, width = 1440, height = 900) {
  const page = await browser.newPage()
  await page.evaluateOnNewDocument('window.__name = (fn) => fn')
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`))
  await page.setViewport({ width, height })
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2' })
  await wait(900)
  return { page, errors }
}

const running = (page: Page, selector: string) =>
  page.$$eval(selector, (els) => els.reduce((n, el) => n + el.getAnimations().length, 0))

// ── Menu ──────────────────────────────────────────────────────────────────────
{
  const { page, errors } = await open('/')
  await page.click('.hamburger')
  await wait(60)
  const anims = await running(page, '.main-menu, .main-menu .top-level > li, .menu-bg')
  check('menu: open transitions run (getAnimations)', anims >= 3, `${anims} running`)
  await wait(1400)
  const openState = await page.evaluate(() => {
    const menu = document.querySelector('.main-menu')!
    const r = menu.getBoundingClientRect()
    const li = [...document.querySelectorAll('.main-menu .top-level > li')].map((el) => getComputedStyle(el).opacity)
    return { x: Math.round(r.x), w: Math.round(r.width), visible: getComputedStyle(menu).visibility, li, expanded: document.querySelector('.hamburger')!.getAttribute('aria-expanded') }
  })
  check('menu: panel slides in to the right edge', openState.x === 1440 - openState.w && openState.visible === 'visible', JSON.stringify(openState))
  check('menu: items faded in', openState.li.every((o) => o === '1'))
  check('menu: aria-expanded', openState.expanded === 'true')

  await page.click('.main-menu .sub-toggle')
  await wait(400)
  const sub = await page.$eval('.sub-menu-wrap', (el) => ({ h: el.getBoundingClientRect().height, o: getComputedStyle(el).opacity }))
  check('submenu: expands', sub.h > 40 && sub.o === '1', JSON.stringify(sub))

  await page.keyboard.press('Escape')
  await wait(60)
  const closing = await running(page, '.main-menu, .menu-bg')
  check('menu: Escape closes with transitions', closing >= 1, `${closing} running`)
  await wait(1200)
  const closed = await page.$eval('.main-menu', (el) => getComputedStyle(el).visibility)
  check('menu: hidden after close', closed === 'hidden')

  // Close on route change.
  await page.click('.hamburger')
  await wait(1200)
  await page.click('.main-menu a[href="/bookings/"]').catch(async () => {
    await page.click('.main-menu .sub-toggle')
    await wait(300)
    await page.click('.main-menu a[href="/bookings/"]')
  })
  await page.waitForFunction(() => location.pathname === '/bookings/', { timeout: 5000 })
  await wait(1500)
  const afterNav = await page.evaluate(() => ({
    menu: getComputedStyle(document.querySelector('.main-menu')!).visibility,
    h1: document.querySelector('h1')?.textContent?.trim(),
    title: document.title,
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
  }))
  check('client nav: menu closes on route change', afterNav.menu === 'hidden')
  check('client nav: page rendered', afterNav.h1 === 'Make a booking', JSON.stringify(afterNav))
  check('client nav: title + canonical updated', afterNav.title === 'Bookings | Ghost Street' && afterNav.canonical === 'https://ghoststreetakl.nz/bookings/', JSON.stringify(afterNav))

  await page.evaluate(() => window.scrollTo(0, document.querySelector('.eveve-widget')!.getBoundingClientRect().top - 200))
  await page.waitForSelector('.eveve-widget iframe', { timeout: 15000 }).catch(() => null)
  const iframe1 = await page.$eval('.eveve-widget', (el) => el.querySelector('iframe')?.src ?? null)
  check('booking widget: loads on scroll', !!iframe1 && iframe1.includes('est=ghoststreet'), iframe1 ?? 'no iframe')

  // Away and back (client-side): the widget must initialise again.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.click('.hamburger')
  await wait(1200)
  await page.click('.main-menu a[href="/menu/"]')
  await page.waitForFunction(() => location.pathname === '/menu/')
  await wait(800)
  await page.goBack()
  await page.waitForFunction(() => location.pathname === '/bookings/')
  await wait(1200)
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.eveve-widget')!.getBoundingClientRect().top))
  await page.waitForSelector('.eveve-widget iframe', { timeout: 15000 }).catch(() => null)
  const iframe2 = await page.$$eval('.eveve-widget iframe', (els) => els.length)
  check('booking widget: re-initialises after navigating away and back', iframe2 === 1, `${iframe2} iframe(s)`)

  check('no console errors (home → bookings → menu → bookings)', errors.length === 0, errors.join(' | '))
  await page.close()
}

// ── Social overlay & footer ──────────────────────────────────────────────────
{
  const { page, errors } = await open('/private-events/')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await wait(800)
  await page.click('.social-trigger a')
  await wait(1200)
  const shown = await page.$eval('.social-overlay', (el) => ({ o: getComputedStyle(el).opacity, v: getComputedStyle(el).visibility, links: el.querySelectorAll('a').length }))
  check('social overlay: opens from footer', shown.o === '1' && shown.v === 'visible' && shown.links === 2, JSON.stringify(shown))
  await page.mouse.click(100, 100)
  await wait(1200)
  const hidden = await page.$eval('.social-overlay', (el) => getComputedStyle(el).visibility)
  check('social overlay: closes on backdrop click', hidden === 'hidden')

  // Rich-text link inside CMS copy (external) must not be hijacked.
  const href = await page.$eval('.booking-content .right a', (a) => a.getAttribute('href'))
  check('rich text: external link kept', href === 'http://theparlour.nz', href ?? '')
  check('no console errors (private events)', errors.length === 0, errors.join(' | '))
  await page.close()
}

// ── Phones: overflow + reveals skipped on touch ──────────────────────────────
for (const path of ['/', '/bookings/', '/menu/', '/pickup-delivery/']) {
  const { page } = await open(path, 375, 812)
  await page.click('.hamburger')
  await wait(1200)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(`no horizontal overflow at 375px with menu open (${path})`, overflow <= 0, `${overflow}px`)
  await page.close()
}

// ── Reduced motion ────────────────────────────────────────────────────────────
{
  const page = await browser.newPage()
  await page.evaluateOnNewDocument('window.__name = (fn) => fn')
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
  const state = await page.evaluate(() => ({
    preloader: getComputedStyle(document.querySelector('.preloader')!).display,
    teaser: getComputedStyle(document.querySelector('.home-fade')!).transitionDuration,
  }))
  check('reduced motion: preloader skipped', state.preloader === 'none')
  check('reduced motion: transitions neutralised', /^0\.001s|^1ms|^0s/.test(state.teaser), state.teaser)
  await page.close()
}

// ── 404 ──────────────────────────────────────────────────────────────────────
{
  const page = await browser.newPage()
  const res = await page.goto(`${BASE}/definitely-not-a-page/`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(() => /Page not found/.test(document.body.innerText), { timeout: 5000 }).catch(() => null)
  const text = await page.evaluate(() => document.body.innerText)
  check('404: status 404 with friendly not-found message', res?.status() === 404 && /Page not found/.test(text), `status ${res?.status()}`)
  await page.close()
}

await browser.close()
let failed = 0
for (const [name, ok, detail] of results) {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  — ${detail}` : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
