import * as prismic from '@prismicio/client'
import type { AllDocumentTypes } from '~~/prismicio-types'

type DocumentOf<T extends AllDocumentTypes['type']> = Extract<AllDocumentTypes, { type: T }>

/**
 * Loads a Prismic document and applies the content-loading policy:
 *  - missing document (NotFoundError) → 404
 *  - any other failure (API outage, network) → 502 "Unable to load this page"
 * Singletons never 404: a missing singleton is a content failure, not a missing page.
 */
async function loadDocument<T>(key: string, fetcher: (client: prismic.Client) => Promise<T>, allowNotFound: boolean) {
  const { client } = usePrismic()
  const { data, error } = await useAsyncData(key, async () => {
    try {
      return await fetcher(client)
    } catch (cause) {
      if (allowNotFound && cause instanceof prismic.NotFoundError) return null
      throw cause
    }
  })
  if (error.value) {
    throw createError({ statusCode: 502, statusMessage: 'Unable to load this page', fatal: true })
  }
  if (!data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }
  return data as Ref<T>
}

export const useSingleDocument = <T extends AllDocumentTypes['type']>(type: T) =>
  loadDocument(`single:${type}`, (client) => client.getSingle(type) as Promise<DocumentOf<T>>, false)

export const useDocumentByUID = <T extends AllDocumentTypes['type']>(type: T, uid: string) =>
  loadDocument(`uid:${type}:${uid}`, (client) => client.getByUID(type, uid) as Promise<DocumentOf<T>>, true)
