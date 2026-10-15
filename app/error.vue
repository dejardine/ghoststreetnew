<script setup lang="ts">
import type { NuxtError } from '#app'
import { site } from '~~/site.config'

/* A 404 means the page doesn't exist; anything else means content failed to load. */
const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
const { siteName } = useRuntimeConfig().public

useHead({
  title: () => (notFound.value ? `Page not found | ${siteName}` : `Unable to load this page | ${siteName}`),
  meta: [{ name: 'robots', content: 'noindex' }],
})

/* Social tags for anyone sharing a broken link: site name, default description, homepage image. */
const shareImage = useShareImage()
useSeoMeta({
  ogTitle: siteName,
  ogDescription: site.share.description,
  ogImage: () => shareImage.value.url,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => shareImage.value.alt,
  twitterTitle: siteName,
  twitterDescription: site.share.description,
  twitterImage: () => shareImage.value.url,
  twitterImageAlt: () => shareImage.value.alt,
})
</script>

<template>
  <div class="site-shell error-shell">
    <header class="main-header"><div class="wrap" /></header>
    <main class="content-wrap">
      <section class="columns wysiwyg wrap booking-content error-page">
        <div class="left">
          <h1>{{ notFound ? 'Page not found' : 'Something went wrong' }}</h1>
        </div>
        <div class="right">
          <p v-if="notFound">Page not found. The page you were looking for has moved or no longer exists.</p>
          <p v-else>We couldn’t load this page. Please refresh, or try again in a moment.</p>
          <p><a href="/">Go to the homepage</a></p>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss">
.error-page {
  min-height: 80vh;
}
</style>
