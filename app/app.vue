<script setup lang="ts">
const { ga4Id, siteUrl } = useRuntimeConfig().public
const router = useRouter()
const menuOpen = useMenuOpen()
const firstView = useFirstView()

const [{ data: settings }, { data: navigation }] = await Promise.all([useSettings(), useNavigation()])
if (!settings.value || !navigation.value) {
  throw createError({ statusCode: 502, statusMessage: 'Unable to load this page', fatal: true })
}

router.afterEach((to, from) => {
  menuOpen.value = false
  if (to.fullPath !== from.fullPath) firstView.value = false
})

/**
 * Rich text from the CMS renders plain <a href="/…"> elements. Upgrade internal ones to
 * client-side navigation; leave files, other origins, new-tab links and modifier clicks alone.
 */
function onShellClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = (event.target as HTMLElement | null)?.closest('a')
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
  const url = new URL(href, window.location.href)
  const sameSite = url.origin === window.location.origin || url.origin === siteUrl
  if (!sameSite || /\.[a-z0-9]{2,5}$/i.test(url.pathname) || url.pathname.startsWith('/wp-content/')) return
  if (anchor.dataset.nuxtLink !== undefined || anchor.classList.contains('router-link-active')) return
  event.preventDefault()
  navigateTo(url.pathname + url.search + url.hash)
}

/* GA4 loads only on the production host, so staging and previews don't pollute analytics. */
useHead({
  script: [
    {
      key: 'ga4',
      innerHTML: `if (location.hostname === ${JSON.stringify(new URL(siteUrl).hostname)}) {
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=${ga4Id}'; document.head.appendChild(s);
  window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments) };
  gtag('js', new Date()); gtag('config', '${ga4Id}');
}`,
      tagPosition: 'bodyClose',
    },
  ],
})
</script>

<template>
  <div class="site-shell" @click="onShellClick">
    <div class="preloader" aria-hidden="true" />
    <SocialOverlay />
    <SpecialOverlay />
    <SiteHeader />
    <SiteMenu />
    <main class="content-wrap">
      <NuxtPage :page-key="(route) => route.fullPath" />
    </main>
    <SiteFooter />
  </div>
</template>

<style lang="scss">
/*
 * First-load curtain: pure CSS, independent of JS, fonts and third parties.
 * Rendered once in the static HTML; client-side navigation never shows it again.
 */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--black);
  pointer-events: none;
  animation: preloader-out 600ms ease 100ms both;

  @include reducedMotion {
    display: none;
  }
}

@keyframes preloader-out {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
