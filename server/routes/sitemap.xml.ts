export default defineEventHandler(async (event) => {
  const entries = await siteEntries()
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  const urls = entries
    .map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
