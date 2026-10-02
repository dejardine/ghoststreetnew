/**
 * Every site-specific constant lives here. The Nuxt app (via nuxt.config.ts
 * runtimeConfig/app config) and the migration scripts both import this file.
 */
export const site = {
  name: 'Ghost Street',
  /** Production origin, no trailing slash. Canonicals and the sitemap use it. */
  url: 'https://ghoststreetakl.nz',
  /** Prismic repository domain. */
  prismicRepo: 'ghoststreet',
  /** GitHub repository (owner/name). */
  githubRepo: 'dejardine/ghoststreetnew',
  /** GA4 measurement ID, taken from the live site's gtag snippet. */
  ga4Id: 'G-9FWGK4DYZE',
  /** Eveve / ResHub booking widget, copied exactly from the live embed. */
  booking: {
    script: 'https://book.reshub.co.nz/embed-iframe.js',
    attrs: {
      'data-restaurant': 'ghoststreet',
      'data-base100': 'D53932',
      'data-base300': '000000',
      'data-primary': '000000',
      'data-primary-content': 'FFFFFF',
      'data-success': 'B6B266',
      'data-font': 'Playfair Display',
    },
    /** Rendered height of the live widget, reserved to avoid layout shift. */
    minHeight: 603,
    /** No-JS fallback: the switchboard URL embed-iframe.js builds for this restaurant. */
    fallbackUrl: 'https://book.reshub.co.nz/?est=ghoststreet',
  },
  /** Mailchimp list shared with Cafe Hanoi (same form as the live footer). */
  mailchimp: {
    action: 'https://cafehanoi.us2.list-manage.com/subscribe/post',
    u: 'd6d53c3845507419fbe48c5a8',
    id: 'a6c78e2427',
  },
} as const

export type SiteConfig = typeof site
