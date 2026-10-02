/**
 * v-reveal: the theme's `.fade-in` (waypoints + velocity) as an IntersectionObserver.
 * Adds `is-visible` once the element enters the viewport; CSS does the 1500ms fade, and only on
 * fine-pointer devices (the theme skipped reveals on touch), so content is never hidden without JS.
 */
import type { Directive } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | undefined
  const getObserver = () =>
    (observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer!.unobserve(entry.target)
      }
    }))

  const reveal: Directive<HTMLElement> = {
    getSSRProps: () => ({ class: 'fade-in' }),
    mounted(el) {
      el.classList.add('fade-in')
      getObserver().observe(el)
    },
    unmounted(el) {
      observer?.unobserve(el)
    },
  }
  nuxtApp.vueApp.directive('reveal', reveal)
})
