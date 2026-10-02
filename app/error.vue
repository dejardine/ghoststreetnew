<script setup lang="ts">
import type { NuxtError } from '#app'

/* A 404 means the page doesn't exist; anything else means content failed to load. */
const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
const { siteName } = useRuntimeConfig().public

useHead({
  title: () => (notFound.value ? `Page not found | ${siteName}` : `Unable to load this page | ${siteName}`),
  meta: [{ name: 'robots', content: 'noindex' }],
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
