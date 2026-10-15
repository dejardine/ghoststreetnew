import * as prismic from '@prismicio/client'
import { site } from '~~/site.config'

type SeoFields = {
  meta_title?: prismic.KeyTextField
  meta_description?: prismic.KeyTextField
  meta_image?: prismic.ImageField
  json_ld?: prismic.RichTextField
}

/** Absolute production URL for a path, always with a trailing slash. */
export function canonicalUrl(siteUrl: string, path: string) {
  const clean = path.split(/[?#]/)[0]!
  return `${siteUrl}${clean.endsWith('/') ? clean : `${clean}/`}`
}

/**
 * The site-wide share image: the homepage's Social share image, else its hero (cover image),
 * read from Prismic so it follows editor changes. If Prismic can't be reached, the copy of the
 * hero in site.config.ts is used, so a page always has an og:image.
 */
export function useShareImage() {
  const { client } = usePrismic()
  const { data } = useAsyncData(
    'seo:share-image',
    () => client.getSingle('home').then((home) => home.data, () => null),
    { transform: (home) => (home ? [home.meta_image, home.cover_image].find((f) => prismic.isFilled.image(f)) ?? null : null) },
  )
  return computed(() =>
    data.value
      ? { url: prismic.asImageSrc(data.value, { width: 1200, height: 630, fit: 'crop' })!, alt: data.value.alt || site.share.imageAlt }
      : { url: site.share.image, alt: site.share.imageAlt },
  )
}

/**
 * Owns a page's <title>, description, canonical and social tags.
 * Title: "<Meta title or page name> | Ghost Street"; the homepage is just "Ghost Street".
 * Share image: the page's Social share image → the homepage image (useShareImage).
 * Description: Meta description → site default.
 */
export function usePageSeo(input: MaybeRefOrGetter<{ data: SeoFields; pageName?: string | null; path: string }>) {
  const { siteName, siteUrl } = useRuntimeConfig().public
  const fallbackImage = useShareImage()
  const seo = computed(() => {
    const { data, pageName, path } = toValue(input)
    const name = data.meta_title?.trim() || pageName?.trim() || ''
    const title = !name ? siteName : name.includes(siteName) ? name : `${name} | ${siteName}`
    const own = prismic.isFilled.image(data.meta_image) ? data.meta_image : null
    return {
      title,
      description: data.meta_description?.trim() || site.share.description,
      url: canonicalUrl(siteUrl, path),
      image: own ? prismic.asImageSrc(own, { width: 1200, height: 630, fit: 'crop' })! : fallbackImage.value.url,
      imageAlt: own ? own.alt || undefined : fallbackImage.value.alt,
    }
  })

  useHead({
    title: () => seo.value.title,
    link: [{ rel: 'canonical', href: () => seo.value.url }],
  })
  useSeoMeta({
    description: () => seo.value.description,
    ogTitle: () => seo.value.title,
    ogDescription: () => seo.value.description,
    ogUrl: () => seo.value.url,
    ogImage: () => seo.value.image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => seo.value.imageAlt,
    twitterTitle: () => seo.value.title,
    twitterDescription: () => seo.value.description,
    twitterImage: () => seo.value.image,
    twitterImageAlt: () => seo.value.imageAlt,
  })
  useJsonLd(() => toValue(input).data.json_ld)
}

/** JSON-LD script tag content, with "</" escaped so it can't close the script element. */
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/<\//g, '<\\/')

/**
 * Emits editor-supplied JSON-LD (a preformatted rich text field holding raw JSON).
 * Invalid JSON is skipped rather than shipped.
 */
export function useJsonLd(field: MaybeRefOrGetter<prismic.RichTextField | null | undefined>) {
  const json = computed(() => {
    const raw = prismic.asText(toValue(field) ?? []).trim()
    if (!raw) return null
    try {
      return serializeJsonLd(JSON.parse(raw))
    } catch {
      if (import.meta.dev) console.warn('[useJsonLd] structured data field is not valid JSON; skipped')
      return null
    }
  })
  useHead({
    script: () => (json.value ? [{ type: 'application/ld+json', innerHTML: json.value, key: 'editor-jsonld' }] : []),
  })
}
