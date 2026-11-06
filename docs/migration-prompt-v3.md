# WORDPRESS → NUXT 4 + PRISMIC + NETLIFY — MASTER MIGRATION PROMPT (v3)

Version 3. Revised after the Ghost Street migration (Oct 2026). Fill in every `{{PLACEHOLDER}}` before use,
and check each value is internally consistent (link text and URL must agree; see §0).

---

## 0. PROJECT VALUES

| Placeholder | Value |
| --- | --- |
| `{{SITE_NAME}}` | |
| `{{PROD_URL}}` | (https, no trailing slash) |
| `{{WP_REST_URL}}` | `{{PROD_URL}}/wp-json` |
| `{{WP_ARCHIVE}}` | path to a Local site / SQL dump + uploads, or `none` |
| `{{PRISMIC_REPO}}` | repository domain only, e.g. `ghoststreet` |
| `{{NETLIFY_SITE}}` | Netlify site name (staging URL = `https://{{NETLIFY_SITE}}.netlify.app`) |
| `{{GITHUB_REPO}}` | `owner/name` |
| `{{GA4_ID}}` | `G-…`, or `find it` |
| `{{REFERENCE_REPO}}` | default `dejardine/ghoststreetnew` (local: `/Users/Grafik/Dropbox/__www/ghoststreetnew`) |
| `{{FORMS}}` | forms the site has (newsletter, contact, booking…) or `find them` |

Before starting, verify the values: the Prismic repo must match the write token in `.env`
(`PRISMIC_WRITE_TOKEN`), the Netlify site must be linked to `{{GITHUB_REPO}}`, and no value may belong to
another client. Stop and ask if two values disagree.

## 1. MISSION

Migrate the production website for {{SITE_NAME}} from WordPress/PHP to Nuxt 4 + Prismic, hosted on Netlify,
through to a verified staging site. This is end-to-end and autonomous:

AUDIT → REUSE ASSESSMENT → FIELD INVENTORY & CLEANUP → CONTENT MODEL → PRISMIC MODELS → MIGRATION TOOLING →
CONTENT + ASSET MIGRATION → FRONTEND → SEO/ROUTING/PERFORMANCE → STAGING DEPLOY → PARITY VALIDATION → FIXES →
FINAL VERIFICATION → HANDOFF

Make routine engineering decisions yourself. Stop only for a genuine blocker: missing credentials, an
inaccessible source, human-only authentication, or a destructive action outside the permissions below.
Publishing the migrated content, pushing Prismic models and deploying to staging are pre-approved for this job.
DNS, the production domain and the cutover are not.

**Commit and push to `main` at every checkpoint** (scaffold, models, migration, frontend, each fix round, docs),
not only at the end. Each push deploys staging.

## 2. START FROM THE REFERENCE IMPLEMENTATION

Study `{{REFERENCE_REPO}}` before writing code: README.md, MIGRATION.md, docs/, `app/`, `customtypes/`,
`app/slices/`, `scripts/`, `site.config.ts`, `nuxt.config.ts`, `netlify.toml`, `public/_redirects`, and its git
history (every post-launch fix is a commit). Reuse, adjusting names and values:

- `site.config.ts`: every site-specific constant in one file (URL, name, Prismic repo, GA4, embeds, share defaults).
- `scripts/wp-source.ts`, `scripts/migrate.ts` (dry / draft / publish modes, state file, rerun guard, logs).
- `scripts/verify-assets.ts`, `scripts/audit-models.ts`, `scripts/parity.ts`, `scripts/interactions.ts`,
  `scripts/stage-schemas.ts`, `tests/previewSession.test.ts`.
- Composables: `usePrismicContent` (404/502 policy), `useSeo` (`usePageSeo`, `useJsonLd`, share-image fallback),
  `useLayoutContent`, the `v-reveal` plugin, `previewSession`, `preload` / `retina` utils.
- Navigation as slices, Settings singleton, SEO tab first, error.vue, preview page, sitemap/robots routes.

Never copy its content, brand values, IDs, tokens, Prismic repo, analytics IDs, migration state or outputs.
The reference repo is read-only for this job. Grep the new build for the reference site's name and domain
before every push.

## 3. FUNDAMENTAL RULE: NOT A REDESIGN

The live site is the visual and behavioural specification. An unintended visual difference is a bug.
Modernise the implementation, not the design.

Pre-approved differences (apply by default, list them in MIGRATION.md):
- Client-side routing with a ~350ms crossfade (`mode: "out-in"`).
- `<title>`: `Page name | {{SITE_NAME}}`; homepage `{{SITE_NAME}}`.
- Pure-CSS first-load preloader (≈100ms delay, 600ms fade), skipped under reduced motion.
- Accessibility fixes with no visual change: real buttons for toggles, `aria-expanded`, Escape closes (never
  opens), visually-hidden labels instead of `display:none`, one H1 per page (visually hidden if the design has none).
- A favicon and share image when the live ones are missing or broken, made only from the client's own logo/imagery.

## 4. SOURCES (ALL READ-ONLY)

Live site, REST API, local archive (if any). Cross-reference them; never omit content because one source lacked it.

### REST audit (first, fast)
Fetch `{{WP_REST_URL}}`: namespaces (plugins), site settings, `/wp/v2/types`, `/wp/v2/taxonomies`, counts via
`X-WP-Total`, menus, media (alt text, MIME), Yoast/AIOSEO data (`yoast_head_json`: titles, descriptions,
canonicals, robots, schema), `meta`/`acf`.

Known traps:
- **`content.rendered` can be empty** even on pages with content: custom themes print postmeta. Then the
  rendered HTML (or the DB) is the source.
- **Custom post types missing from REST** still show up in `wp-sitemap.xml` / Yoast sitemaps
  (`*-sitemap.xml`). Check every sub-sitemap, and every single page of each type: some render broken legacy
  templates and should be redirected, not migrated.
- **Orphaned data**: post types no longer registered by the theme, or only read by templates no page uses.
  Check `register_post_type` and which templates are assigned before migrating anything.
- Page Links To / Redirection / Yoast Premium redirects: capture every external or redirected page.

### With a local archive (`{{WP_ARCHIVE}}`, e.g. a LocalWP site)
Parse the SQL dump directly (no need to run MySQL): posts by type and status, postmeta keys per type with
fill counts, `_wp_page_template`, taxonomies, `active_plugins`, theme options. Read the theme's
`functions.php`, `meta.php` and templates to see which fields render. Uploads are often gigabytes: migrate only
originals the site references, never WordPress's resized copies.

### Without an archive
REST + live HTML are primary. Extract theme-rendered fields from the HTML; download only referenced assets;
record every value recovered from HTML.

### Ground truth (learned the hard way)
- The **served, compiled CSS** is the spec, not SCSS sources. Download and prettify it.
- **Capture JS-mutated runtime state** from the live DOM after interacting (e.g. velocity left sub-menu items at
  `translateX(10%)` permanently; match it).
- **Cascade accidents render**: e.g. a later `.wysiwyg { padding-bottom: 0 }` cancelled `.columns` padding at
  every breakpoint. Match what renders.
- **Word-paste inline styles render** (`MsoNormal` margins, Georgia/colour spans, 12pt text). Preserve them
  with rich-text labels (see §7), and record them.
- **Fonts**: check which file the browser actually uses. Ghost Street's `@font-face` listed the `.woff` file
  in the `woff2` slot, so the shipped `.woff2` (a different version) never rendered; convert the served file
  with fontTools instead. Commercial fonts: keep full files, don't subset, keep the licence terms in mind.
- **Plugin assets that load but do nothing** (Elementor CSS, Roboto) are dropped after confirming no rule applies.
- **Placeholders in content** (`http://hello.com` links, a theme option saying "nothing"): flag them, don't migrate them as real.

Never modify WordPress, its database, DNS, the domain or the live site. Never log in.

## 5. TOOLING AND ENVIRONMENT

- Node 22+ (`nvm use 22`; Nuxt fails on Node 20). Install with `npx -y npm@11 install` (npm 10.8 crashes).
  npm 11 asks to approve install scripts: `npx -y npm@11 install-scripts approve esbuild @parcel/watcher`.
- Pin `typescript@^5.9` (vue-tsc doesn't support TS 7).
- Scaffold in a temp dir (`npx nuxi@latest init <dir> --template v4 --packageManager npm`) and copy into the repo,
  then `npx prismic init --repo {{PRISMIC_REPO}}`. Add `prismic` as a devDependency: the global `prismic`
  binary may be the obsolete v4 CLI.
- **Prismic CLI** (v1.2x): every command needs `--task-id` (from `prismic task-id`) and `--user-intent`; wrap it
  in a small script. Gotchas:
  - `type create --format page` puts a `Main` tab with a slice zone BEFORE the SEO tab. Remove `Main`
    (`type remove-tab Main --from <type>`), rename `SEO & Metadata` to `SEO`
    (`type edit-tab … --from-type <type> --name SEO`), then add content tabs, which land after it.
  - Removing `Main` removes the **UID** of repeatable types: re-add it (`field add uid --to-type … --tab Content`).
  - Fields inside a group need `--tab` too.
  - `push` needs a clean git tree: commit models first, then `npx prismic push`, then `npx prismic gen types`.
  - Fix `prismic.config.json` routes by hand, with trailing slashes.
  - Re-login if you see "session invalid".
- No Slice Machine and no slice simulator page.
- **Prismic MCP** to inspect documents and releases; the CDN serves stale refs for a while after publishing,
  so re-query before concluding a write failed.
- **Asset API** (`https://asset-api.prismic.io/assets`, headers `repository` + `Authorization: Bearer
  <write token>`) to list, verify and delete assets.
- **Verification**: built-in browser screenshots are unreliable while hidden. Use `puppeteer-core` with the
  system Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) for probes; with tsx, add
  `page.evaluateOnNewDocument('window.__name = (fn) => fn')` or evaluated functions crash.
- Serve the static build for checks (`python3 -m http.server --directory .output/public`); it doesn't serve
  `404.html`, so test 404s on staging.

## 6. PRISMIC CONTENT MODEL

Design for editors. Proven patterns (copy from the reference):
- `home` (single page): hero + teaser fields; text hardcoded in PHP made editable.
- `page` (repeatable, `/:uid/`): H1, image(s), body, feature toggles (e.g. a booking widget).
- Listing types per real content type (events, courses, case studies, articles…) only if the live site has them.
- `navigation` (single, slice-only): `navigation_link` + `navigation_dropdown`.
- `settings` (single): footer copy, contact details, social links, seasonal-notice fields.
- FAQ (single, grouped Q&A) and gallery only if the site has that content.

**Every page type's first tab is SEO**: `meta_title` (the page name; " | {{SITE_NAME}}" is appended
automatically), `meta_description`, `meta_image`, `json_ld` (preformatted, "paste raw JSON"). The frontend
consumes all of them.

Rich text: allow only what the content uses; add labels for formatting production renders (e.g. `tight`,
`gold-small`, `red-serif`, `underline`). Link fields must match what is migrated into them (no web URLs in
media-only links).

### 6b. FIELD INVENTORY AND CLEANUP
Never trust a WP label or meta key. For every field (meta boxes, ACF, theme options, hardcoded template
text): template(s) reading it, pages using those templates, fill count, where it renders, decision. Write
`docs/field-audit.md`.
- **Drop**: never read, read only by unused templates, unregistered post types, empty with no live feature.
- **Merge** duplicates; when copies diverge, migrate what renders and log the other.
- **Keep** empty fields that back a real optional/seasonal feature (special hours overlay, announcement link).
- Name fields by rendered role, plain-English labels in page order, help text where behaviour isn't obvious.
- Before handoff run `scripts/audit-models.ts` (every field read by the frontend, fill counts, duplicate
  labels) and save its output as `docs/model-audit.md`.

## 7. CONTENT MIGRATION

Scripts follow the reference (`wp-source.ts` + `migrate.ts`): deterministic, logged, `--dry` / drafts /
`--publish`, outputs `documents.json`, `migration-log.json` (source of every field), `url-map.md`.

HTML → rich text:
- Map Word spans to `strong` / labels via `htmlAsRichText`'s selector serializer.
- **Paragraph-level formatting** (e.g. `margin-bottom: 0`) can't be expressed by the serializer: record a
  per-`<p>` flag list before conversion, then correlate by index after (assert the counts match) and apply a
  whole-paragraph label (`tight`). Style it with `p:has(.tight)`.
- Spacer paragraphs → ` ` (htmlAsRichText trims them to empty).
- Strip paste junk (Tailwind classes, CSS variables, base64 spacer images); log every removal.
- Internal links → document links; keep file paths; log typo fixes.

Migration API gotchas (all hit on Ghost Street):
- **Register each asset once per source path** (memoise): registering the same file per document uploads it
  N times.
- **On reruns, reference known assets by ID** (`{ id, alt }` for images, `{ link_type: "Media", id }` for
  files) from the state file. `migration.createAsset(existingField)` re-uploads.
- After any rerun, list the media library and delete only orphaned uploads this job created.
- Singletons fail on a second create: keep `scripts/migration-state.json` (document IDs, asset IDs + SHA-256)
  and upsert with `migration.updateDocument`.
- Omit empty links in group items rather than sending null. Use the repo's master locale
  (`client.getRepository()`), not a hardcoded one.
- **Rerun guard**: record each document's `last_publication_date` after publishing, and refuse to overwrite a
  document whose date has changed. After `publishMigrationRelease()`, **poll until every document shows a
  date newer than the publish call** before recording; otherwise you record the stale CDN value and the guard
  trips on the next run.

Post-launch safety:
- Follow-up scripts (schema, SEO, navigation) read the current published document as their baseline, change
  only their own fields, skip edited documents, and stage drafts with a receipt file.
- **Stage follow-up drafts in a named release** (e.g. "Structured data (Nov 2026)"), not the migration release:
  `migrate.ts --publish` publishes the whole migration release, drafts included.
- MIGRATION.md says: "Do not rerun the full WordPress migration for routine edits."

## 8. ASSETS AND MEDIA

- Upload originals (not WP crops) and reproduce crops with imgix (`w`, `h`, `fit=crop`); add 2x via
  `image-set` / `imagesrcset` capped at the original's size.
- Video and PDFs byte-for-byte, as Prismic Media links. Verify SHA-256 of every upload (`verify-assets.ts`)
  and keep static copies at the original `/wp-content/uploads/...` paths.
- Theme assets → `public/images/`. Alt text from the media library; flag when there is none.

## 9. FONTS

Self-host as WOFF2 (converted from what production serves) + WOFF fallback, `font-display: swap`, preloaded.
Google Fonts: Latin subset + licence file. Typekit: check the kit allows the staging domain. Note commercial
licence domains in the cutover checklist.

## 10. NUXT 4 IMPLEMENTATION

Idiomatic Nuxt 4 / Vue 3, `<script setup lang="ts">`, fully prerendered (`npm run generate`). SCSS with
custom-property tokens, flex/grid, no utility framework, no jQuery, no floats or vendor prefixes. Keep the
theme's root font size (often 75%) so values port 1:1. Breakpoint names map to the theme's media queries.

Pitfalls:
- **E1001**: no Nuxt composables (`usePrismic`, `useRuntimeConfig`) inside `useAsyncData` handlers or
  `computed`. Read them at setup, pass values in.
- Global CSS paths use `~~/assets/...`; `nuxt build` also prerenders; `titleTemplate` can't be a function in
  `nuxt.config`; use `sass:map` (no deprecated globals).
- `.site-shell { display: flow-root; overflow-x: clip }`: child margins otherwise collapse through it and drag
  absolutely positioned headers down on mobile.
- Styles shared with `error.vue` must be global, not page-scoped.
- **Hydration**: render `<noscript>` content as an HTML string (`v-html`); mark SSR-only classes with
  `data-allow-mismatch`.
- Layout singletons via shared `useAsyncData` keys (fetched once).

Error handling: `NotFoundError` → 404; anything else → 502 "Unable to load this page"; singletons never 404.
`error.vue` shows "Page not found…" only for 404.

Preview: copy the reference `preview.vue` + `previewSession.ts` (wait for the `io.prismic.preview` cookie, then
`location.replace`), add `/preview` to prerender routes, register the staging preview URL with
`prismic preview add`. Test both the success and the timeout path on staging.

## 11. ANIMATION AND INTERACTION

Never toggle `display:none` with a transition in the same frame; hide with visibility/opacity/transform and delay
visibility on close. Reproduce velocity/GSAP timings in CSS (per-item `--delay`), verify with `getAnimations()`.
IntersectionObserver reveals, skipped on touch if the original did (`(hover: hover) and (pointer: fine)`), with
an `html.js` class set before paint so no-JS visits never hide content. Respect reduced motion.

## 12. MOBILE AND RESPONSIVE

`overflow-x: clip` shell, `width: 100%` not `100vw`. Match 375 / 768 / 1024 / 1280 / 1440 (both orientations
where the original differed). Pin long-page cover backgrounds to the viewport.

## 13. NAVIGATION AND TRANSITIONS

NuxtLink internally; a delegated shell click handler upgrades CMS `<a href="/…">` (skipping files, external,
`_blank`, modifier clicks). `pageTransition` crossfade, `<NuxtPage :page-key="route => route.fullPath">`.
Close the menu on route change and Escape.

## 14. SEO

One `usePageSeo()` per page: title, description, canonical `{{PROD_URL}}/<path>/`, `og:url` = canonical.
Share image fallback chain: page's Social share image → page image → homepage share image / hero (read live from
Prismic) → `site.share` default in `site.config.ts`. Emit `og:image:width/height/alt`; an image without alt gets an
empty `og:image:alt`, not the default's. Put the same defaults in `nuxt.config` head so the static 404/200
shells have share tags for scrapers.

`useJsonLd()` emits editor JSON-LD (validated, `</` escaped). Generate FAQPage/ImageGallery from content when they
exist. Stage editor schema drafts (venue/business + WebSite + WebPage on home; WebPage + breadcrumbs elsewhere;
Menu/Event/Course types where real) in a named release, with `docs/seo-schemas/README.md`. Never invent facts;
list contradictions (e.g. three different opening hours) for the client instead of choosing one.

Migrate SEO plugin data (titles, descriptions, robots) but fix template mistakes (doubled site names). Sitemap
route from Prismic (absolute, trailing slashes), robots.txt, `wp-sitemap.xml` and sub-sitemaps → 301.

## 15. ANALYTICS

Find the IDs on the live site. Universal Analytics (`UA-`) stopped in 2023/24: flag it in the handoff, and use GA4
`{{GA4_ID}}` (ask if none exists). Load GA4 only when `location.hostname` is the production host, so staging and
previews aren't counted.

## 16. PERFORMANCE

Preload LCP images per breakpoint (`media` + `imagesrcset`, `fetchpriority="high"`). Lazy, sized images below
the fold. Reserve space for embeds and release it once they load (`:has(iframe) { min-height: 0 }`). Long-term
caching headers for `_nuxt`, fonts, legacy uploads; a week + revalidate for images and icons.

## 17. INTEGRATIONS AND FORMS

For each integration, find it in the template and the live DOM, check it's actually used, and document it.
- **Third-party embeds** (booking widgets etc.): read the provider's embed script to learn its re-init API and
  the real no-JS fallback URL. Never invent a URL. Load lazily; re-initialise after client-side navigation.
- **Outbound services** (ticketing such as Eventfinda, vouchers, ordering): keep the links; they're out of scope.
- **Forms**: PHP `mail()` forms (contact, bookings) can't run on a static site. Replace them with Netlify Forms or
  a form service, with spam protection, and confirm where submissions go. Flag plugins that store submissions or
  emails (e.g. WP Mail Logging) as a data-handling issue for the client.
- Newsletters (Mailchimp JSONP, Campaign Monitor): same list, same behaviour, no jQuery; no-JS posts natively.

## 18. URLS AND REDIRECTS

Full route inventory; preserve every URL with trailing slashes. Redirects in `public/_redirects` only:
`/home/`, broken CPT singles, Page Links To pages, author archives, feeds, `wp-sitemap*`, `wp-admin/*`,
`wp-login.php`. Netlify `_redirects` can't match query strings. Prerender routes the crawler can't reach (pull
every routable document from Prismic in the `nitro:config` hook). URL map in MIGRATION.md.

## 19. NETLIFY STAGING AND PUBLISHING

`netlify.toml`: `npm run generate`, publish `dist`, `NODE_VERSION = "22"`, `NPM_VERSION = "11"` (the toml
overrides stale UI build settings). Staging `X-Robots-Tag: noindex` block marked **REMOVE AT CUTOVER**. Ignore
`.netlify/`. List existing build hooks and Prismic webhooks, then create exactly one of each. Wait for deploys with
a background loop that checks the deploy's commit ref.

## 20. PARITY AND BEHAVIOUR

Run `scripts/parity.ts` (production vs build, every page × 5 widths: geometry, computed styles, text per block,
title/H1, link and PDF counts, document height) and fix until only documented intentional differences remain.
Run `scripts/interactions.ts` against staging (menu, submenus, overlays, forms, embeds after navigating away and
back, console errors, overflow at 375px, reduced motion, 404).

## 21. GIT AND SECURITY

Commit and push at each checkpoint. Never commit `.env`, tokens, archives or dumps (`.gitignore`: `.env`,
`wordpress/`, `*.sql`, `scripts/.cache/`, `.netlify`). Write tokens stay local. Remember the repo may be public.

## 22. FINAL VERIFICATION

Every page 200 with title, canonical = og:url, one H1 · trailing slashes on internal links · redirects 301 ·
sitemap complete · robots.txt · staging noindex header · JSON-LD parses · fonts load on staging · assets verified
by hash · Prismic SEO fields hold no stray values · model audit passes · preview works (success + timeout) · one
webhook, one build hook · no console errors across client navigation · 404 and 502 states · no mobile overflow ·
reduced motion · share tags on every page including 404 · favicon present.

## 23. HANDOFF

README.md (development) and MIGRATION.md (architecture, content model, migration and rerun rules, URL map,
assets, integrations, intentional differences, SEO, verification, client follow-ups, cutover checklist),
`docs/field-audit.md`, `docs/model-audit.md`, `docs/seo-schemas/README.md`. Environment variables by name only.

Client follow-ups: open content contradictions, placeholder content, forms and data handling, analytics,
missing favicon/share images/meta descriptions, licences.

Cutover: freeze content → remove the noindex block → add the domain in Netlify and update DNS → verify pages,
files, embeds, forms, fonts, sitemap, robots, redirects, GA4 → submit the sitemap in Search Console → keep
WordPress running until DNS has propagated.
