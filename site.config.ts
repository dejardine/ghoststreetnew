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
  /** GA4 measurement ID, supplied by the client (Oct 2026). The live site used G-9FWGK4DYZE. */
  ga4Id: 'G-MHHLP9KN7J',
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
  /**
   * Social share fallbacks, used when a page has no Social share image / Meta description.
   * Pages take the homepage image live from Prismic (useShareImage); `image` is a copy of the
   * homepage hero (incense smoke), cropped to 1200×630, for when Prismic can't be reached.
   * `imageAlt` is used when the homepage image has no alt text.
   */
  share: {
    image: 'https://images.prismic.io/ghoststreet/OORmTlB4GopglBmU_homepage-hero-1-scaled.jpg?auto=format,compress&w=1200&h=630&fit=crop',
    imageAlt: 'A stick of incense smoking against a black background',
    description: "A reimagining of the heady hole-in-the-wall eateries along Beijing's famous food street. Britomart, Auckland.",
  },
} as const

export type SiteConfig = typeof site
