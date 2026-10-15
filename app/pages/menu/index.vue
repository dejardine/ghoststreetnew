<script setup lang="ts">
import * as prismic from '@prismicio/client'

const page = await useSingleDocument('food_menu')
const d = computed(() => page.value.data)

usePageSeo(() => ({ data: d.value, pageName: d.value.title, path: '/menu/' }))

/* The theme printed WordPress's 2560×1440 and 767×431 crops; imgix reproduces them. */
const crop = (width: number, height: number) =>
  prismic.isFilled.image(d.value.cover_image) ? prismic.asImageSrc(d.value.cover_image, { w: width, h: height, fit: 'crop' }) : null
const cover = computed(() => ({ large: crop(2560, 1440), mobile: crop(767, 431) }))
const coverStyle = computed(() => ({
  '--cover-large': cover.value.large ? `url("${cover.value.large}")` : undefined,
  '--cover-mobile': cover.value.mobile ? `url("${cover.value.mobile}")` : undefined,
}))

useHead({
  link: () => [...preloadImage(cover.value.large, '(min-width: 768px)'), ...preloadImage(cover.value.mobile, '(max-width: 767px)')],
})
</script>

<template>
  <section class="menu-page">
    <h1 class="visually-hidden">{{ d.title }}</h1>
    <article class="menu-cover">
      <div class="cover-image" :style="coverStyle" />
      <ul class="menu-grid">
        <li v-for="(menu, i) in d.menus" :key="i">
          <PrismicLink v-if="prismic.isFilled.linkToMedia(menu.file)" :field="menu.file" target="_blank">
            <b>{{ menu.label }}</b>
          </PrismicLink>
        </li>
      </ul>
    </article>
  </section>
</template>

<style lang="scss">
/* tmpl.menu.php: full-viewport background with the PDF menus as outlined buttons. */
.menu-page {
  position: relative;
  /* The background and buttons are absolutely positioned; the theme pushed the footer down 100vh. */
  height: 100vh;

  .cover-image {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100vh;
    background: var(--cover-large) no-repeat center top / cover;

    @include breakpoint(mobile) {
      background-image: var(--cover-mobile);
    }
  }

  .menu-grid {
    position: absolute;
    top: 50vh;
    left: 50%;
    z-index: 5;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 95rem;
    margin: 0;
    padding: 0;
    list-style: none;
    transform: translate3d(-50%, -50%, 0);

    li {
      position: relative;
      flex: 1;
      margin: 0 0 2rem;
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1.5rem;
    }

    a {
      z-index: 5;
      display: block;
      width: 20rem;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      border: 1px solid var(--red-menu);
      color: var(--red-menu);
      @include displayFont;
      font-size: 2.5rem;
      line-height: 2.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 650ms var(--ease);

      @include breakpoint(mobile) {
        font-size: 2rem;
        line-height: 2rem;
      }

      &:hover {
        color: var(--white);
        border-color: var(--white);

        b {
          color: var(--white);
        }
      }
    }

    b {
      position: relative;
      z-index: 10;
      color: var(--red-menu);
      font-weight: normal;
      transition: all 650ms var(--ease);
    }
  }
}
</style>
