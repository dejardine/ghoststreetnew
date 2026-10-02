<script setup lang="ts">
import { waitForPreviewCookie } from '~/utils/previewSession'

/*
 * Prismic preview entry point. Resolves the previewed document's URL, waits for the toolbar to
 * set the preview cookie, then does a full page load so the module installs its draft hooks.
 */
definePageMeta({ pageTransition: false })
useHead({ title: 'Loading preview…', meta: [{ name: 'robots', content: 'noindex' }] })

const failed = ref(false)
const { client } = usePrismic()

onMounted(async () => {
  try {
    const url = await client.resolvePreviewURL({ defaultURL: '/' })
    await waitForPreviewCookie(() => document.cookie)
    window.location.replace(url)
  } catch (error) {
    console.error('[preview]', error)
    failed.value = true
  }
})
</script>

<template>
  <section class="preview-page wrap">
    <p v-if="!failed">Loading preview…</p>
    <p v-else>
      We couldn’t start the preview. Please close this tab and click “Preview” in Prismic again.
      <br><NuxtLink to="/">Go to the homepage</NuxtLink>
    </p>
  </section>
</template>

<style lang="scss">
.preview-page {
  padding: 16rem 0;
  min-height: 60vh;

  p {
    color: var(--taupe);
    @include smallType;
  }
}
</style>
