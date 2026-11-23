import { site } from '~~/site.config'

/* Served on every domain, including ghoststreet.netlify.app (canonicals point at the production URL). */
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nDisallow: /preview/\n\nSitemap: ${site.url}/sitemap.xml\n`
})
