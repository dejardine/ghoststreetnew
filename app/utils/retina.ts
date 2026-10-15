import * as prismic from '@prismicio/client'

/**
 * A w×h crop at 1x plus a high-density version for retina screens (same helper as the Cafe Hanoi
 * build). The 2x is capped at what the uploaded file can supply (imgix would otherwise upscale),
 * and dropped when that's barely bigger than 1x.
 */
export function cropSet(field: prismic.ImageField | null | undefined, w: number, h: number) {
  if (!prismic.isFilled.image(field)) return null
  const x1 = prismic.asImageSrc(field, { w, h, fit: 'crop' })!
  const { width, height } = field.dimensions
  const dpr = Math.min(2, width / w, height / h)
  const x2 = dpr > 1.15 ? prismic.asImageSrc(field, { w, h, fit: 'crop', dpr: Math.round(dpr * 100) / 100 })! : null
  return {
    x1,
    /** For a CSS background-image */
    css: x2 ? `image-set(url("${x1}") 1x, url("${x2}") 2x)` : `url("${x1}")`,
    /** For <link rel=preload imagesrcset> */
    srcset: x2 ? `${x1} 1x, ${x2} 2x` : undefined,
  }
}
