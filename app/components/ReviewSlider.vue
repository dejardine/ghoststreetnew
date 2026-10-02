<script setup lang="ts">
import type { HomeDocumentDataReviewsItem } from '~~/prismicio-types'

/**
 * Press quotes. Replaces the theme's Glide.js "slider": autoplay every 6s, 650ms slide with
 * cubic-bezier(1, 0, 0, 1), rewinding to the first quote after the last; pauses on hover;
 * swipeable on touch.
 */
const props = defineProps<{ reviews: HomeDocumentDataReviewsItem[] }>()
const index = ref(0)
const paused = ref(false)
const count = computed(() => props.reviews.length)
let timer: ReturnType<typeof setInterval> | undefined

const go = (to: number) => (index.value = (to + count.value) % count.value)

onMounted(() => {
  if (count.value < 2) return
  timer = setInterval(() => !paused.value && !document.hidden && go(index.value + 1), 6000)
})
onBeforeUnmount(() => clearInterval(timer))

let startX: number | null = null
const onTouchStart = (event: TouchEvent) => (startX = event.touches[0]?.clientX ?? null)
function onTouchEnd(event: TouchEvent) {
  if (startX === null) return
  const dx = (event.changedTouches[0]?.clientX ?? startX) - startX
  if (Math.abs(dx) > 60) go(index.value + (dx < 0 ? 1 : -1))
  startX = null
}
</script>

<template>
  <div
    class="glide"
    role="region"
    aria-roledescription="carousel"
    aria-label="Reviews"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="glide__wrapper">
      <div class="glide__track" :style="{ '--count': count, '--index': index }">
        <blockquote
          v-for="(review, i) in reviews"
          :key="i"
          class="glide__slide"
          :aria-hidden="i !== index"
          aria-roledescription="slide"
        >
          <p>{{ review.quote }}</p>
          <cite>{{ review.citation }}</cite>
        </blockquote>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.glide {
  position: relative;
  width: 100%;
  height: 100%;

  .glide__wrapper {
    height: 100%;
    overflow: hidden;
  }

  .glide__track {
    position: relative;
    display: flex;
    width: calc(var(--count) * 100%);
    height: 100%;
    touch-action: pan-y;
    transform: translate3d(calc(var(--index) / var(--count) * -100%), 0, 0);
    transition: transform 650ms cubic-bezier(1, 0, 0, 1);
  }

  .glide__slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 0 0 calc(100% / var(--count));
    height: 100%;
    margin: 0;
    user-select: none;
  }
}
</style>
