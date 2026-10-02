<script setup lang="ts">
import { site } from '~~/site.config'

/**
 * Eveve (ResHub) booking widget, exactly as the theme embedded it: same script, restaurant and
 * colour parameters. The script loads once, when the widget nears the viewport; later mounts
 * (client-side navigation back to the page) re-initialise through window.EveveWidget.
 */
const el = ref<HTMLElement>()
const { script, attrs, minHeight, fallbackUrl } = site.booking

type EveveWindow = Window & { EveveWidget?: { init: (container: HTMLElement) => void } }

function load() {
  const w = window as EveveWindow
  if (!el.value) return
  if (w.EveveWidget) return w.EveveWidget.init(el.value)
  if (document.querySelector(`script[src="${script}"]`)) return // loading; it initialises every widget on load
  const tag = document.createElement('script')
  tag.src = script
  tag.async = true
  document.body.appendChild(tag)
}

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      load()
    },
    { rootMargin: '400px 0px' },
  )
  if (el.value) observer.observe(el.value)
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <div class="booking-widget" :style="{ minHeight: `${minHeight}px` }">
    <div ref="el" class="eveve-widget" v-bind="attrs" />
    <noscript>
      <p><a :href="fallbackUrl" target="_blank" rel="noopener">Book a table online</a></p>
    </noscript>
  </div>
</template>

<style lang="scss">
/* Space is reserved only until the iframe arrives; it then sizes itself to its content. */
.booking-widget:has(iframe) {
  min-height: 0 !important;
}

.eveve-widget iframe {
  border-radius: 10px;
}
</style>
