# Ghost Street

Website for Ghost Street (Britomart, Auckland). Nuxt 4 + Prismic, prerendered and hosted on Netlify.
Migration notes, URL map, content model and cutover checklist: [MIGRATION.md](MIGRATION.md).

## Requirements

- Node 22+ (`nvm use`). Nuxt's build fails on Node 20.
- npm 11 (`npx -y npm@11 install`); npm 10.8 crashes on this lockfile.

## Commands

```bash
npm run dev                 # http://localhost:3000 (Prismic preview: /preview)
npm run generate            # static build → dist/
npm run typecheck           # app + scripts
npm test                    # unit tests (node:test)
npm run audit:models        # every Prismic field read by the frontend? fill counts
npm run parity              # production vs local static build (serve dist on :3457 first)
npm run test:interactions -- --base https://ghoststreet.netlify.app
npm run verify:assets       # SHA-256 of migrated assets vs WordPress originals
```

`.claude/launch.json` defines `static` (serves `.output/public` on :3457) and `dev`.

## Structure

```text
app/
  app.vue                 shell: preloader, header, menu, overlays, footer, GA4, rich-text link upgrade
  pages/                  index (home), [uid] (content pages), menu/, preview
  components/             SiteHeader, SiteMenu, SiteFooter, NewsletterForm, BookingWidget, ReviewSlider…
  composables/            usePrismicContent (404/502 policy), useSeo (usePageSeo, useJsonLd), layout data, UI state
  slices/                 NavigationLink, NavigationDropdown (navigation document)
  plugins/reveal.ts       v-reveal scroll fade (fine-pointer devices only)
assets/scss/              tools (breakpoints, mixins, type mixins), fonts, reset, typography, global, content-page
customtypes/              Prismic models (manage with `npx prismic type|field|slice …`, then `npx prismic push`)
server/routes/            sitemap.xml, robots.txt
public/                   fonts, theme images, legacy /wp-content/uploads copies, _redirects
scripts/                  WordPress migration + verification tooling
site.config.ts            site URL, name, GA4, Eveve, Mailchimp — every site-specific constant
```

## Content editing

Editors work in Prismic (`ghoststreet`). Publishing triggers a Netlify rebuild via webhook; changes
are live in about a minute. Model changes: edit with the Prismic CLI, commit, `npx prismic push`,
`npx prismic gen types`.

## Environment

- `PRISMIC_WRITE_TOKEN` — local `.env` only, used by `scripts/`. Never commit it or expose it to the app.
