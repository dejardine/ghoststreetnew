import { site } from '~~/site.config'

/* Production rules. Staging is kept out of search by the X-Robots-Tag header in netlify.toml. */
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nDisallow: /preview/\n\nSitemap: ${site.url}/sitemap.xml\n`
})
