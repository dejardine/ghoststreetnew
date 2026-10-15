import type { cropSet } from './retina'

/** <link rel="preload"> for a responsive background crop (with its 2x); nothing when the image is missing. */
export const preloadImage = (crop: ReturnType<typeof cropSet>, media: string) =>
  crop
    ? [{ rel: 'preload' as const, as: 'image' as const, href: crop.x1, imagesrcset: crop.srcset, media, fetchpriority: 'high' as const }]
    : []
