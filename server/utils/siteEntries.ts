import * as prismic from '@prismicio/client'
import prismicConfig from '~~/prismic.config.json'
import { site } from '~~/site.config'

/** Every public, routable page (shared by sitemap.xml). Absolute URLs with trailing slashes. */
export async function siteEntries() {
  const client = prismic.createClient(site.prismicRepo, { routes: prismicConfig.routes })
  const docs = await client.dangerouslyGetAll({
    filters: [prismic.filter.any('document.type', ['home', 'food_menu', 'page'])],
  })
  return docs
    .filter((doc) => doc.url)
    .map((doc) => {
      const path = doc.url!.endsWith('/') ? doc.url! : `${doc.url}/`
      return { loc: `${site.url}${path}`, lastmod: doc.last_publication_date }
    })
    .sort((a, b) => a.loc.localeCompare(b.loc))
}
