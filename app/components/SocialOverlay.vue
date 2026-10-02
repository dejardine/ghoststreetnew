<script setup lang="ts">
/* Full-screen social links, opened from the footer's "Social" link (theme socialMenu()). */
const open = useSocialOpen()
const { data: settings } = await useSettings()
const close = () => (open.value = false)
const onKeydown = (event: KeyboardEvent) => event.key === 'Escape' && close()
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="social-overlay overlay" :class="{ open }" role="dialog" aria-label="Social links" :aria-hidden="!open" :inert="!open">
    <div class="social-close-wrap wrap">
      <button type="button" class="social-close open" aria-label="Close" @click="close"><span /><span /><span /><span /></button>
    </div>
    <SocialLinks class="social" :links="settings?.data.social_links ?? []" />
    <div class="social-click" aria-hidden="true" @click="close" />
  </div>
</template>

<style lang="scss">
/* Overlays fade over 1000ms; their close cross over 450ms (theme velocity timings). */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--overlay);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 1000ms ease,
    visibility 0s linear 1000ms;

  &.open {
    opacity: 1;
    visibility: visible;
    transition:
      opacity 1000ms ease,
      visibility 0s;
  }

  .social-close,
  .special-close {
    opacity: 0;
    transition: opacity 450ms ease;
  }

  &.open :is(.social-close, .special-close) {
    opacity: 1;
  }
}

.social-overlay {
  .social-close-wrap {
    position: relative;
    z-index: 1020;
    display: block;
    max-width: 100%;
    width: 96%;

    @include breakpoint(tablet) {
      width: 94%;
    }
    @include breakpoint(mobile) {
      width: 90%;
    }
  }

  ul.social {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1010;
    justify-content: space-around;
    width: 100%;
    max-width: 50rem;
    margin: 0;
    padding: 0;
    transform: translate(-50%, -50%);

    li {
      width: 4.5rem;
      height: 4.5rem;

      @include breakpoint(mobile) {
        width: 2.5rem;
        height: 2.5rem;
      }

      &:hover a {
        opacity: 0.7;
      }
    }

    a {
      transition: opacity 450ms var(--ease);
    }
  }

  .social-click {
    position: fixed;
    inset: 0;
    z-index: 1001;
  }
}
</style>
