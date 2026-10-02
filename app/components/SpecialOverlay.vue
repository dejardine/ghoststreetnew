<script setup lang="ts">
import * as prismic from '@prismicio/client'

/*
 * Seasonal notice (theme specialMenu()), e.g. holiday hours. Rendered only when Settings has
 * both a footer link label and notice text; opened from that footer link.
 */
const open = useSpecialOpen()
const { data: settings } = await useSettings()
const notice = computed(() => settings.value?.data.special_notice)
const enabled = computed(() => !!settings.value?.data.special_link_label && prismic.isFilled.richText(notice.value))
const close = () => (open.value = false)
const onKeydown = (event: KeyboardEvent) => event.key === 'Escape' && close()
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="enabled" class="special-overlay overlay" :class="{ open }" role="dialog" aria-label="Notice" :aria-hidden="!open" :inert="!open">
    <div class="special-wrap wrap">
      <div class="special-wrap-inner">
        <button type="button" class="special-close open" aria-label="Close" @click="close"><span /><span /><span /><span /></button>
        <PrismicRichText :field="notice" />
      </div>
    </div>
    <div class="special-click" aria-hidden="true" @click="close" />
  </div>
</template>

<style lang="scss">
.special-overlay {
  .special-wrap {
    position: relative;
    z-index: 1020;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    max-width: none;
    height: 100vh;
  }

  .special-close {
    right: 18px;
  }

  :is(p, h4) {
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    font-size: 1.833rem;
    line-height: 2.333rem;
  }

  h4 {
    margin: 0 auto 2rem;
    color: var(--red);
  }

  .special-click {
    position: fixed;
    inset: 0;
    z-index: 1001;
  }
}
</style>
