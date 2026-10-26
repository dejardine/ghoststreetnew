# Structured data drafts (JSON-LD)

Editor-owned schema for each page, staged by `scripts/stage-schemas.ts` into the page's
**SEO → Structured data (JSON-LD schema)** field as drafts in Prismic's *Migration release*.
**These have since been published** (the release is empty and all five pages carry this JSON-LD,
checked October 2026) without a client review; the opening hours are still deliberately left out.

| File | Prismic document | Types |
| --- | --- | --- |
| `home.json` | Home | `Restaurant` (`/#venue`) + `WebSite` (`/#website`) + `WebPage` |
| `menu.json` | Food Menu | `WebPage` + `BreadcrumbList` |
| `bookings.json` | Page `bookings` | `WebPage` + `BreadcrumbList` |
| `private-events.json` | Page `private-events` | `WebPage` + `BreadcrumbList` |
| `pickup-delivery.json` | Page `pickup-delivery` | `WebPage` + `BreadcrumbList` |

The site emits the field exactly as entered (escaping `</`), and skips it if it isn't valid JSON.
All `@id`s are stable: `https://ghoststreetakl.nz/#venue`, `/#website`, `<page>#webpage`, `<page>#breadcrumb`.

## Facts used (all from published Prismic content)

Name, phone, email, street address, cuisine ("rustic Chinese", "sublime Chinese food"), menu and
booking pages, Instagram and Facebook profiles, and the homepage tagline.

Added Oct 2026 to match the Cafe Hanoi build (staged in the Prismic release
**"Structured data (Oct 2026)"**, unpublished until reviewed):
- `Restaurant`: `image` (homepage hero), `logo` (`/images/logo.svg`), `geo` (the destination pin of
  the Settings Google Maps link, on Tuawhiti Lane), `hasMap` (that link), `hasMenu` → the `Menu`
  node, and a `ReserveAction` pointing at `/bookings/`.
- Food Menu: a `Menu` (`/menu/#menu`, the page's `mainEntity`) with one `MenuSection` per PDF
  button, named as on the page and linking to the PDF.

## Deliberately left out — please confirm with the client

- **Opening hours.** Confirmed by the client (Oct 2026): Mon–Wed 5.30pm till close · Thu–Sat 5pm till
  close · Sun 5.30pm till close (the kitchen opens and bookings start at those times). Close times must
  stay ambiguous, so `openingHoursSpecification` (which needs a closing time) is still left out; the
  client is claiming the Google Business Profile, which will carry the hours.
- **Ratings.** Not stated in the site's content; never invented.

Confirmed by the client (Oct 2026) and staged in the Prismic release
**"Comensa + price range schema (Oct 2026)"**, unpublished until reviewed:
- `parentOrganization`: Comensa (as on Cafe Hanoi).
- `priceRange`: `$40–100`, matching the Google listing.
- **Private events capacity** (44 seated / 50 standing, The Parlour) is about a separate venue
  (theparlour.nz); not encoded here.

## Content contradictions noticed during migration

- Ghost Street does not do pick-ups (client, Oct 2026). `/pickup-delivery/` now 301s to `/bookings/`;
  the Prismic page should be unpublished.

FAQ rich results were retired by Google in May 2026; there is no FAQ content on this site anyway.
