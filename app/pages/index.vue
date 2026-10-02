<script setup lang="ts">
import * as prismic from '@prismicio/client'

const page = await useSingleDocument('home')
const d = computed(() => page.value.data)

usePageSeo(() => ({ data: d.value, pageName: null, path: '/' }))

/* WordPress crops the theme printed for the phone hero, reproduced with imgix. */
const crop = (field: prismic.ImageField, width: number, height: number) =>
  prismic.isFilled.image(field) ? prismic.asImageSrc(field, { w: width, h: height, fit: 'crop' }) : null
const coverPortrait = computed(() => crop(d.value.cover_image_mobile, 767, 999))
const coverLandscape = computed(() => crop(d.value.cover_image, 767, 431))
const coverStyle = computed(() => ({
  '--cover-portrait': coverPortrait.value ? `url("${coverPortrait.value}")` : undefined,
  '--cover-landscape': coverLandscape.value ? `url("${coverLandscape.value}")` : undefined,
}))
const video = computed(() => (prismic.isFilled.linkToMedia(d.value.hero_video) ? d.value.hero_video.url : null))
const heroLink = computed(() => (prismic.isFilled.link(d.value.hero_link) && d.value.hero_link.text ? d.value.hero_link : null))

/* Phones show the cover image instead of the video: preload whichever crop applies. */
useHead({
  link: () => [
    coverPortrait.value && { rel: 'preload', as: 'image', href: coverPortrait.value, media: '(max-width: 767px) and (orientation: portrait)', fetchpriority: 'high' },
    coverLandscape.value && { rel: 'preload', as: 'image', href: coverLandscape.value, media: '(max-width: 767px) and (orientation: landscape)', fetchpriority: 'high' },
  ].filter(Boolean) as Record<string, string>[],
})

const teasers = computed(() => [
  { key: 'teaser-top-left', image: d.value.teaser_1_image, text: d.value.teaser_1_text, link: d.value.teaser_1_link },
  { key: 'teaser-top-right', image: d.value.teaser_2_image, text: d.value.teaser_2_text, link: d.value.teaser_2_link, icon: true },
  { key: 'teaser-bottom-left', reviews: true },
  { key: 'teaser-bottom-right', image: d.value.teaser_4_image, text: d.value.teaser_4_text, link: d.value.teaser_4_link },
])

/* Teasers rise in one after another once the trigger 30rem into the section is reached. */
const trigger = ref<HTMLElement>()
const faded = ref(false)
onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    faded.value = true
    observer.disconnect()
  })
  if (trigger.value) observer.observe(trigger.value)
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <section class="home-page">
    <h1 class="visually-hidden">Ghost Street</h1>
    <div class="homepage-video">
      <video v-if="video" :src="video" autoplay loop muted playsinline />
      <p v-if="heroLink" class="home-top-link"><PrismicLink :field="heroLink">{{ heroLink.text }}</PrismicLink></p>
      <div class="logo" />
    </div>

    <div class="cover-image" :style="coverStyle">
      <div class="logo" />
      <p v-if="heroLink" class="home-top-link"><PrismicLink :field="heroLink">{{ heroLink.text }}</PrismicLink></p>
    </div>

    <article class="homepage-teasers" :class="{ faded }">
      <div class="wrap content-start">
        <span ref="trigger" class="fader-trigger" />

        <div v-for="t in teasers" :key="t.key" class="teaser home-fade" :class="t.key">
          <template v-if="t.reviews">
            <ReviewSlider :reviews="d.reviews" />
            <img
              v-if="prismic.isFilled.image(d.reviews_image)"
              :src="d.reviews_image.url"
              :alt="d.reviews_image.alt ?? ''"
              :width="d.reviews_image.dimensions.width"
              :height="d.reviews_image.dimensions.height"
              loading="lazy"
              decoding="async"
            >
          </template>
          <TeaserLink v-else :link="t.link">
            <p v-if="t.icon || prismic.isFilled.richText(t.text)">
              <img v-if="t.icon" src="/images/menu-icon.svg" alt="" width="294" height="294">{{ prismic.asText(t.text) }}
            </p>
            <PrismicImage
              v-if="prismic.isFilled.image(t.image)"
              :field="t.image"
              :widths="[720, 1080, 1280]"
              sizes="(max-width: 767px) 100vw, 50vw"
              loading="lazy"
              decoding="async"
            />
          </TeaserLink>
        </div>
      </div>
    </article>
  </section>
</template>

<style lang="scss">
.home-top-link {
  position: absolute;
  top: 24px;
  left: 24px;
  margin: 0;
  font-size: 2.5rem;
  line-height: 2.5rem;
  text-align: left;
  color: var(--red-bright);

  a {
    color: var(--red-bright);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 1px;

    &:hover {
      text-decoration: none;
    }
  }

  @include breakpoint(tabletPortrait) {
    max-width: 300px;
    font-size: 2rem;
    line-height: 2rem;
  }
  @include breakpoint(mobile) {
    max-width: 220px;
    font-size: 1.5rem;
    line-height: 1.5rem;
  }
}

.home-page {
  .homepage-video {
    position: relative;

    video {
      position: relative;
      display: block;
      width: 100%;
      height: 100vh;
      object-fit: cover;
    }

    @include breakpoint(mobile) {
      display: none;
    }
  }

  .cover-image {
    position: relative;
    z-index: 1;
    display: none;
    width: 100%;
    height: 80vh;
    overflow: hidden;
    background: var(--cover-portrait) no-repeat bottom right / cover;

    @include breakpoint(mobile) {
      display: block;
    }
    @include breakpoint(mobileLandscape) {
      height: 100vh;
      background-image: var(--cover-landscape);
    }
  }
}

.homepage-teasers {
  width: 100%;
  background: var(--bg);

  .wrap {
    display: flex;
    flex-flow: row wrap;
    width: 100%;
    max-width: 100%;

    @include breakpoint(mobile) {
      flex-direction: column;
    }
  }

  .fader-trigger {
    position: absolute;
    top: 30rem;
    display: block;
    width: 100%;
  }

  .teaser {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 50%;
    @include displayFont;

    @include breakpoint(mobile) {
      width: 100%;
      min-height: 20rem;
      height: auto;
      padding: 0;
    }
    @include breakpoint(mobileLandscape) {
      min-height: 32rem;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;

      @include breakpoint(mobile) {
        height: 22rem;
      }
      @include breakpoint(mobileLandscape) {
        height: auto;
      }
    }
  }

  .teaser-link {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    color: var(--white);
    pointer-events: all;
    transition: all 650ms var(--ease);

    &.no-link {
      pointer-events: none;
    }

    p {
      @include absoluteCentre;
      z-index: 10;
      margin: 0;
      font-size: 2.5rem;
      line-height: 2.5rem;
      text-align: center;

      @include breakpoint(tabletPortrait) {
        max-width: 300px;
        font-size: 2rem;
        line-height: 2rem;
      }
      @include breakpoint(mobile) {
        width: 100%;
        text-align: center;
      }
    }
  }

  .teaser-top-right {
    .teaser-link {
      color: var(--red-bright);
    }

    p img {
      width: 10vw;
      height: 10vw;
      margin: 0 auto 1rem;

      @include breakpoint(mobile) {
        width: 25vw;
        height: 25vw;
      }
    }
  }

  .teaser-bottom-left {
    position: relative;
    background: var(--red-menu);

    .glide {
      position: absolute;
      top: 0;
      left: 0;
    }

    p {
      max-width: 66.667%;
      font-size: 2.5rem;
      line-height: 2.5rem;
      text-align: center;

      @include breakpoint(tablet) {
        font-size: 2rem;
        line-height: 2rem;
      }
    }

    cite {
      margin: 0;
      font-style: normal;
      @include smallType;
    }
  }
}

/* Theme homeFade(): skipped on touch devices; 850ms, staggered 300ms. */
@include finePointer {
  .js .home-fade {
    opacity: 0;
    transform: translateY(50%);
    transition:
      opacity 850ms var(--ease) var(--delay, 0ms),
      transform 850ms var(--ease) var(--delay, 0ms);

    &:nth-of-type(2) { --delay: 300ms; }
    &:nth-of-type(3) { --delay: 600ms; }
    &:nth-of-type(4) { --delay: 900ms; }
  }

  .js .faded .home-fade {
    opacity: 1;
    transform: none;
  }
}
</style>
