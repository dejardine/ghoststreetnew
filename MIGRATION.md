# Ghost Street — WordPress → Nuxt 4 + Prismic + Netlify

Production (WordPress, still live): https://ghoststreetakl.nz/
Staging (this build): https://ghoststreet.netlify.app/ (Netlify site `ghoststreet`, deploys from `main`)
Prismic repository: `ghoststreet` · GitHub: `dejardine/ghoststreetnew`

The live WordPress site is the visual specification. This is a re-implementation, not a redesign.

> **Do not rerun the full WordPress migration for routine edits.** Editors work in Prismic.
> `scripts/migrate.ts` refuses to overwrite any document an editor has republished since the
> migration (it compares publication dates in `scripts/migration-state.json`), but it is a one-off
> import tool, not a sync.

---

## 1. Architecture

- **Nuxt 4** (`app/`), fully prerendered (`npm run generate` → `dist/`), served by Netlify.
- **Prismic** via `@nuxtjs/prismic`; route resolver in `prismic.config.json` (all paths end in `/`).
- **Styles**: SCSS with custom-property tokens, no utility framework, no jQuery. `assets/scss/`
  holds the foundation (fonts, reset, typography, global, content-page); components keep their own
  styles. Breakpoint names map to the theme's queries (`laptop` ≤1440, `tablet` ≤1024,
  `tabletPortrait`, `mobile` ≤767, `mobileLandscape`). The root size stays at the theme's 75%
  (1rem = 12px) so values port 1:1.
- **One place for site constants**: `site.config.ts` (URL, name, Prismic repo, GA4, Eveve, Mailchimp).
- **Content loading policy** (`app/composables/usePrismicContent.ts`): missing document → 404;
  any other failure (API down, network) → 502 "Unable to load this page". Singletons never 404.
  `app/error.vue` shows "Page not found…" only for 404s.
- **Publishing**: Prismic webhook (documentsPublished, documentsUnpublished) → Netlify build hook
  "Prismic publish" → rebuild of `main`. One hook, one webhook (verified none pre-existed).
- **Preview**: `/preview` resolves the previewed document, waits for the `io.prismic.preview` cookie
  (`app/utils/previewSession.ts`, unit-tested), then does a full `location.replace` so the module's
  draft hooks install. Preview URLs registered: staging `/preview` and `http://localhost:3000/preview`.

## 2. Content model

| Type | Kind | Route | Purpose |
| --- | --- | --- | --- |
| `home` | single page | `/` | Hero (video, phone images, announcement link) and the four teasers (incl. reviews slider) |
| `page` | repeatable page | `/:uid/` | Heading (H1), left image, body, booking-widget toggle. Used by Bookings, Private Events, Pickup |
| `food_menu` | single page | `/menu/` | Background image + ordered PDF menu buttons (replaces the `menu` post type) |
| `navigation` | single, slice-only | — | `navigation_link` and `navigation_dropdown` slices (reorderable, any number of dropdowns) |
| `settings` | single | — | Footer copy and contact details, social links, seasonal notice overlay |

Every page type's **first tab is SEO**: `meta_title` (page name; " | Ghost Street" is appended),
`meta_description`, `meta_image`, `json_ld` (preformatted, raw JSON). All are consumed by
`usePageSeo()` / `useJsonLd()`.

Rich text labels on `page.body` preserve Word-paste formatting that production renders:
`tight` (MsoNormal paragraph: no gap after), `red-serif` (red Georgia "Opening Hours"),
`gold-small` (12pt gold hours lines).

Field-by-field inventory and decisions: [`docs/field-audit.md`](docs/field-audit.md).
Current audit (every field read by the frontend, fill counts): [`docs/model-audit.md`](docs/model-audit.md).
No temporary migration-backup fields exist.

## 3. Migration process

Sources (all read-only): WordPress REST API (page identity), the **rendered HTML** of every live page
(theme fields live in postmeta that REST does not expose; there was no DB archive), and theme files.
Each migrated value records its source in `scripts/output/migration-log.json`.

```bash
npx tsx scripts/migrate.ts --dry        # build + audit files only
npx tsx scripts/migrate.ts              # assets + documents into the migration release (drafts)
npx tsx scripts/migrate.ts --publish    # …then publish the release
npx tsx scripts/verify-assets.ts        # SHA-256 of every Prismic asset and static copy vs WordPress
npx tsx scripts/stage-schemas.ts        # JSON-LD drafts (never publishes)
```

- Outputs: `scripts/output/documents.json`, `migration-log.json`, `url-map.md`, `schema-receipt.json`.
- State: `scripts/migration-state.json` (committed) maps every document and asset to its Prismic ID,
  hash and publication date. Reruns update in place and reference known assets by ID (no re-upload).
- HTML → rich text: Word spans → labels/strong, spacer paragraphs kept as non-breaking spaces,
  base64 spacer images removed (none present), Tailwind/ChatGPT paste attributes stripped.
- Asset clean-up during migration: an early rerun duplicated uploads; the 16 unreferenced duplicates
  (all uploaded by this migration minutes earlier) were deleted. The media library holds exactly the
  14 referenced assets.

### Rerun-safety rules

1. Never rerun the full migration after editors start. Use targeted scripts that read the current
   published document as their baseline and change only their own fields (see `stage-schemas.ts`).
2. Targeted scripts stage **drafts** in the migration release and write a receipt; a human publishes.
3. `migrate.ts --publish` publishes the *whole* migration release — including any staged JSON-LD
   drafts. Review the release in Prismic before running it.

## 4. URL map

| Old URL | New URL | Status | Notes |
| --- | --- | --- | --- |
| `/` | `/` | 200 | Prismic `home` |
| `/home/` | `/` | 301 | WordPress front-page slug |
| `/bookings/` | `/bookings/` | 200 | `page` bookings |
| `/private-events/` | `/private-events/` | 200 | `page` private-events |
| `/pickup-delivery/` | `/pickup-delivery/` | 200 | `page` pickup-delivery (not in the menu, as before) |
| `/menu/` | `/menu/` | 200 | `food_menu` |
| `/menu/to-eat/`, `/menu/to-drink/`, `/menu/chefs-menu/`, `/menu/vegan-set-menu/` | `/menu/` | 301 | Broken legacy post pages |
| `/vouchers/` | `https://vouchers.appropo.io/cafe-hanoi-ghost-street/checkout` | 301 | Was a Page Links To redirect |
| `/author/*` | `/` | 301 | Author archives |
| `/feed/`, `/comments/feed/` | `/` | 301 | No posts |
| `/wp-sitemap.xml`, `/wp-sitemap-*` | `/sitemap.xml` | 301 | |
| `/wp-admin/*`, `/wp-login.php` | `/` | 301 | |
| `/wp-content/uploads/…` (menus, map, images the pages used) | same | 200 | Byte-for-byte static copies |
| anything else | — | 404 | `404.html` |

Rules live in `public/_redirects` (not `netlify.toml`). Netlify pretty URLs 301 `/page` → `/page/`.

## 5. Assets, fonts, integrations

- **Prismic media library (14 assets)**: hero video (MP4, byte-for-byte), phone hero originals,
  Menu background original, teaser images, reviews illustration (SVG), left-column image, 4 menu PDFs,
  footer map. WordPress crops (2560×1440, 767×431, 767×999) are reproduced with imgix `fit=crop`.
  Alt text: WordPress had none; all images here are decorative or have adjacent text.
- **Static copies** at original `/wp-content/uploads/...` paths (PDFs, map, images the pages
  referenced). `npm run verify:assets` checks all hashes (last run: all match).
- **Theme assets** in `public/images/` (logo, menu icon, social icons, arrow).
- **Fonts**: Klim Financier Text + Financier Display (licensed web fonts supplied with the theme).
  WOFF2 converted from the WOFF v1.2 that production actually served (the theme's `.woff2` files
  were a different build that never rendered), WOFF kept as fallback, `font-display: swap`,
  preloaded. No Typekit or Google Fonts (Elementor's Roboto was loaded but never applied).
  Check the Klim licence covers the production domain at cutover.
- **Eveve/ResHub booking widget**: same script and parameters (`ghoststreet`, colours, Playfair
  Display). Lazy-loaded near the viewport, space reserved, `<noscript>` link to
  `https://book.reshub.co.nz/?est=ghoststreet`; re-initialises after client-side navigation.
- **Mailchimp** (list shared with Cafe Hanoi): same list and behaviour (Enter submits, inline
  message) via JSONP, no jQuery; without JS it posts to Mailchimp in a new tab as before.
  *Please confirm the client still wants this signup; it posts to the Cafe Hanoi account.*
- **Social overlay**: footer "Social" opens the full-screen icons overlay (Instagram, Facebook).
- **Seasonal notice overlay**: kept but empty (the live option contained just "nothing" and had no
  trigger link). Fill both Settings → *Special notice* fields to show a footer link + overlay.
- **GA4** `G-9FWGK4DYZE` (found on the live site). Loads only on `ghoststreetakl.nz`, so staging
  and previews don't pollute analytics. Enhanced measurement covers SPA page views.
- **Click & Collect** (mobi2go), **The Parlour**, **Cafe Hanoi**, **vouchers** (appropo.io): plain
  links, unchanged.

## 6. Intentional differences

| Area | Production | New | Why |
| --- | --- | --- | --- |
| Navigation | Full page reloads | Client-side routing with 350ms crossfade | Pre-approved |
| `<title>` | `Bookings — Ghost Street —` | `Bookings \| Ghost Street` (home: `Ghost Street`) | Pre-approved |
| Preloader | Black curtain, 1500ms fade after JS preloading | Pure-CSS curtain, 100ms delay + 600ms fade, first load only, skipped with reduced motion | Pre-approved; never blocks on JS/fonts |
| Menu items on first open | Slide only (opacity already 1) | Slide + fade, identical to every later open | Consistency |
| Escape key | Toggled the menu (could open it) | Closes menu/overlays only | Accessibility |
| H1 | None on Home and Food Menu | Visually hidden H1 ("Ghost Street", "Food Menu") | One H1 per page; no visual change |
| Canonical / OG | Missing / homepage URL on every page | Canonical + `og:url` per page, trailing slash | SEO |
| Empty anchors | Empty teaser/hero `<a>` elements rendered | Not rendered unless they have text/link | No visual change |
| Newsletter label | `display: none` | Visually hidden (screen-reader text) | Accessibility |
| Menu toggles | `<a href="#">` | `<button>` with `aria-expanded` | Accessibility; same look |
| Favicon | `favicon.ico` link 404s | No favicon link | Not invented — see follow-ups |

Matched on purpose (cascade accidents that render on production): sub-menu items permanently offset
10% (left by velocity's close animation); `.wysiwyg` cancelling `.columns` bottom padding on content
pages; the black "_" after "Social" in the footer; Word-paste Georgia/gold styling on Bookings.

## 7. SEO

- `usePageSeo()` on every page: title, description, canonical (`https://ghoststreetakl.nz/<path>/`),
  `og:url` = canonical, OG/Twitter image from *Social share image*.
- `useJsonLd()` emits the editor's JSON-LD (validated, `</` escaped). Drafts for all five pages are
  staged (unpublished) — see [`docs/seo-schemas/README.md`](docs/seo-schemas/README.md), which also
  lists contradictions in the client's content (opening hours) that are deliberately not encoded.
- `/sitemap.xml` (from Prismic, absolute, trailing slashes), `/robots.txt` (points at it).
- SEO fields after migration: `meta_title` = WordPress page titles on the three pages; everything else
  empty (production had no descriptions). No stray values.

## 8. Verification (latest run)

- `npm run parity` (production vs new, 5 pages × 1440/1280/1024/768/375): every probed element's
  geometry and computed type/colour matches; remaining differences are the intentional ones above.
- `npm run test:interactions -- --base https://ghoststreet.netlify.app`: menu open/close transitions
  (verified with `getAnimations()`), submenu, Escape, route-change close, booking widget lazy-load and
  re-init after navigating away and back, social overlay, no console errors, no horizontal overflow at
  375px, reduced motion, 404.
- `npm test` (preview cookie wait), `npm run typecheck`, `npm run audit:models`, `npm run verify:assets`.

## 9. Follow-ups for the client

1. Confirm opening hours (three versions on the current site) — then add them to the Home JSON-LD.
2. Review and publish the staged JSON-LD drafts (Prismic → Migration release).
3. Confirm the Mailchimp signup (Cafe Hanoi list) should stay.
4. Supply a favicon / social share image if wanted (none exists today).
5. Write meta descriptions (none exist today).
6. A real end-to-end preview from the Prismic editor (Preview button on a draft) should be clicked
   through once; the flow is tested on staging with a simulated session.
7. Optional: an SEO landing-page type (kicker, H1, facts, slideshow, FAQs, enquiry CTA) is available
   from previous projects if the client wants campaign pages.
8. The old Prismic slice-simulator URL (`localhost:3000/slice-simulator`) is still registered by the
   CLI default; it is unused and can be ignored or removed in Prismic settings.

## 10. Cutover checklist

1. Freeze content in WordPress.
2. Remove the **STAGING ONLY — REMOVE AT CUTOVER** `X-Robots-Tag` block from `netlify.toml`; push.
3. Netlify → `ghoststreet` → Domain management: add `ghoststreetakl.nz` (+ `www`), then update DNS.
4. Verify on the production domain: every page 200, PDFs, booking widget, fonts (Klim licence
   domain), `/sitemap.xml`, `/robots.txt`, redirects (`/home/`, `/vouchers/`, `/menu/to-eat/`,
   `/wp-sitemap.xml`), GA4 receiving hits.
5. Submit `https://ghoststreetakl.nz/sitemap.xml` in Google Search Console.
6. Keep WordPress running (unchanged) until DNS has fully propagated.

## Environment variables (names only)

- `PRISMIC_WRITE_TOKEN` — local `.env` only, for migration scripts. Never in Netlify or the client bundle.
