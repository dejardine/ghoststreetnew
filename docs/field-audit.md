# WordPress field inventory and cleanup

There was no database archive for Ghost Street, so every field below was identified by tracing
the **rendered** output of each template on the live site (and the theme's served CSS/JS), not by
admin labels or meta keys. The REST API exposed page identity only (`content` was empty for every
page; `meta` held only `footnotes` and Page Links To keys). Meta keys are therefore unknown and
fields are named by template + rendered role.

Published content: 6 pages (Home, Bookings, Private Events, Pickup, Food Menu, Vouchers), 4 posts of
an unexposed `menu` post type, 0 blog posts, 82 media items.

## Inventory

| WP source (template → role) | Templates that read it | Published pages using it | Filled | Where it renders | Decision → Prismic |
| --- | --- | --- | --- | --- | --- |
| Home cover image (cover-image-large / -mobile / -mobile-alt crops) | index.php | Home | 1/1 | Phone hero only (video on ≥768px) | **Keep** → `home.cover_image` (landscape) |
| Home mobile cover image | index.php | Home | 1/1 | Phone portrait hero | **Keep** → `home.cover_image_mobile` |
| Homepage video (`r/video/home.mp4`) | index.php (hardcoded) | Home | — | Desktop/tablet hero | **Keep, made editable** → `home.hero_video` |
| Hero top link (text + URL) | index.php | Home | URL only, text empty | Nothing visible (empty anchor) | **Keep** (real feature: announcement link) → `home.hero_link`; renders only when text is filled |
| Teaser 1 image / text / link | index.php | Home | image only | Top-left block | **Keep** → `teaser_1_*` |
| Teaser 2 image / text / link + menu icon | index.php (icon hardcoded) | Home | image + text | Top-right block | **Keep** → `teaser_2_*`; icon stays a theme asset |
| Teaser 3 reviews repeater (quote, cite) | index.php | Home | 3 rows | Bottom-left slider | **Keep** → `home.reviews[]` |
| Teaser 3 illustration (`Booking-illustration-Block-3-home.svg`) | index.php | Home | 1/1 | Bottom-left background | **Keep** → `home.reviews_image` |
| Teaser 4 image / text / link | index.php | Home | image + link | Bottom-right block (Gift vouchers) | **Keep** → `teaser_4_*` |
| Preloader "menu images" (`data-menu-image` ×4) | header.php | all | 0/4 | Nothing (empty preload manifest) | **Drop** — empty, no visible feature |
| Food Menu cover image | tmpl.menu.php | Food Menu | 1/1 | Full-screen background | **Keep** → `food_menu.cover_image` |
| `menu` post type: title + PDF file | tmpl.menu.php (loop) | Food Menu | 4/4 | Outlined buttons | **Merge** into one group → `food_menu.menus[]` (`label`, `file`) |
| `menu` post type: hover image | tmpl.menu.php | Food Menu | 0/4 | Hover layer (never visible) | **Drop** — empty on every post |
| `menu` post singles (`/menu/to-eat/` …) | single.php → old *story* template | — | — | Broken page ("BACK TO STORIES", no content) | **Drop**; URLs 301 → `/menu/` |
| Page H1 (separate from title, e.g. "Make a booking") | tmpl.booking.php, page.php | Bookings, Private Events, Pickup | 3/3 | Left-column heading | **Keep** → `page.title` "Heading (H1)" |
| Page title | (WordPress core) | same | 3/3 | `<title>` | **Keep** → `page.meta_title` (page name) |
| Page content (WYSIWYG) | tmpl.booking.php, page.php | same | 3/3 | Right column | **Keep** → `page.body` (labels for Word-paste styling) |
| Left image (`r/img/booking.jpg`) | both templates (hardcoded) | same | — | Left column | **Keep, made editable** → `page.side_image` |
| Eveve booking widget | tmpl.booking.php (hardcoded) | Bookings | — | Under copy | **Keep, made a toggle** → `page.show_booking_widget` |
| Footer newsletter heading ("Sign up") | footer.php (hardcoded) | all | — | Footer | **Made editable** → `settings.newsletter_heading` |
| Footer "Social" link text | footer.php (hardcoded) | all | — | Footer | **Made editable** → `settings.social_link_label` |
| Footer text WYSIWYG ("Open 7 days a week") | footer.php (option) | all | 1/1 | Footer | **Keep** → `settings.footer_note` (ChatGPT/Tailwind paste markup stripped; resolved to plain text) |
| Venue name, phone, email | footer.php (options) | all | 1/1 | Footer | **Keep** → `venue_name`, `phone`, `email` |
| Opening hours, address/directions | footer.php (options) | all | 1/1 | Footer | **Keep** → `opening_hours`, `address` |
| Google Maps link, map image link | footer.php (options) | all | 1/1 | Footer links | **Keep** → `map_link` (web), `map_file` (media; file uploaded) |
| Copyright text | footer.php | all | 1/1 | Footer bar | **Keep** → `settings.copyright` (year automatic) |
| Special overlay content + footer link | footer.php / header.php (option) | all | contains only the word "nothing"; no link rendered | Unreachable overlay | **Keep empty** (seasonal/holiday hours feature) → `special_link_label`, `special_notice` |
| Main menu (WP nav menu) | header.php | all | 5 items, 2 dropdowns | Off-canvas menu | **Keep** → `navigation` slices |
| Social menu (WP nav menu) | header.php, footer overlay | all | Instagram, Facebook | Menu icons + overlay | **Keep** → `settings.social_links[]` |
| Mailchimp list (form action, u, id) | footer.php (hardcoded embed) | all | — | Footer form | **Not CMS** — integration constant in `site.config.ts` |
| GA (`G-9FWGK4DYZE`) | footer.php (hardcoded) | all | — | — | **Not CMS** — `site.config.ts` |
| Vouchers page (Page Links To → appropo.io) | — | Vouchers | 1/1 | Redirect only | **Drop page**; `/vouchers/` 301 → external URL in `_redirects` |

## Dead theme code (not migrated)

Present in `master.css` / `script.js` but not used by any published page: about/stories/careers/
contact templates (`.about-page`, `.stories-grid`, `#load-more`, `.contact-grid`, `.cover-address`,
`.heading-wrap`, `.single-gallery`, `#Gallery`/`#imageSlider` carousels, parallax headings),
`.voucher`, `.christmas-trigger`, `.nav-title`, arrow-down. Elementor 4 is installed and loads its
CSS/Roboto fonts on Bookings, but no page contains Elementor markup and none of its styles apply.

## Diverged copies

None found: each rendered field has a single source on the live site. (Without a database, any
unrendered stale copies in postmeta could not be inspected; this is listed as a follow-up.)

## Final Prismic inventory

Generated by `npm run audit:models` (every field is read by the frontend; labels are unique).
See MIGRATION.md → *Content model* for the table and fill counts.
