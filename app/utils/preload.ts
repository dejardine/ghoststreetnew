/** <link rel="preload"> for a responsive background crop; nothing when the image is missing. */
export const preloadImage = (href: string | null | undefined, media: string) =>
  href ? [{ rel: 'preload' as const, as: 'image' as const, href, media, fetchpriority: 'high' as const }] : []
