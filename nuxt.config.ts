import * as prismic from '@prismicio/client'
import prismicConfig from './prismic.config.json'
import { site } from './site.config'

/** Every routable Prismic document, so pages the crawler can't reach are still prerendered. */
async function prismicRoutes(): Promise<string[]> {
  const client = prismic.createClient(site.prismicRepo, { routes: prismicConfig.routes })
  const docs = await client.dangerouslyGetAll({ filters: [prismic.filter.any('document.type', ['home', 'food_menu', 'page'])] })
  return docs.map((doc) => doc.url).filter((url): url is string => !!url)
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/prismic'],

  prismic: {
    endpoint: site.prismicRepo,
    preview: '/preview',
    toolbar: true,
    clientConfig: { routes: prismicConfig.routes },
  },

  css: ['~~/assets/scss/fonts.scss', '~~/assets/scss/reset.scss', '~~/assets/scss/typography.scss', '~~/assets/scss/global.scss', '~~/assets/scss/content-page.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: { additionalData: '@use "~~/assets/scss/tools" as *;' },
      },
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: (title) => (title ? title : site.name),
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'theme-color', content: '#1e1619' },
        { property: 'og:site_name', content: site.name },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_NZ' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'preload', href: '/fonts/financier-text-web-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'preload', href: '/fonts/financier-display-web-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'preconnect', href: 'https://images.prismic.io' },
      ],
      script: [
        /* Marks JS-capable visits before first paint so reveal styles never flash on no-JS visits. */
        { innerHTML: "document.documentElement.classList.add('js')", tagPosition: 'head' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: site.url,
      siteName: site.name,
      ga4Id: site.ga4Id,
    },
  },

  experimental: { payloadExtraction: true },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/preview', '/sitemap.xml', '/robots.txt'],
    },
  },

  hooks: {
    async 'nitro:config'(nitroConfig) {
      if (nitroConfig.dev) return
      nitroConfig.prerender ??= {}
      nitroConfig.prerender.routes = [...(nitroConfig.prerender.routes ?? []), ...(await prismicRoutes())]
    },
  },

  typescript: { strict: true },
})
