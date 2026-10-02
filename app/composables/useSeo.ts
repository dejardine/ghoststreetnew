import * as prismic from '@prismicio/client'

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
 * Owns a page's <title>, description, canonical and social tags.
 * Title: "<Meta title or page name> | Ghost Street"; the homepage is just "Ghost Street".
 */
export function usePageSeo(input: MaybeRefOrGetter<{ data: SeoFields; pageName?: string | null; path: string }>) {
  const { siteName, siteUrl } = useRuntimeConfig().public
  const seo = computed(() => {
    const { data, pageName, path } = toValue(input)
    const name = data.meta_title?.trim() || pageName?.trim() || ''
    const title = !name ? siteName : name.includes(siteName) ? name : `${name} | ${siteName}`
    const image = prismic.isFilled.image(data.meta_image) ? data.meta_image : null
    return {
      title,
      description: data.meta_description?.trim() || undefined,
      url: canonicalUrl(siteUrl, path),
      image: image ? prismic.asImageSrc(image, { width: 1200, height: 630, fit: 'crop' }) : undefined,
      imageAlt: image?.alt ?? undefined,
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
    ogImageAlt: () => seo.value.imageAlt,
    twitterTitle: () => seo.value.title,
    twitterDescription: () => seo.value.description,
    twitterImage: () => seo.value.image,
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
