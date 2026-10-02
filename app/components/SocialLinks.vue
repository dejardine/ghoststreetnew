<script setup lang="ts">
import type { SettingsDocumentDataSocialLinksItem } from '~~/prismicio-types'

defineProps<{ links: SettingsDocumentDataSocialLinksItem[] }>()
</script>

<template>
  <ul>
    <li v-for="(item, i) in links" :key="i" :class="item.platform">
      <PrismicLink :field="item.url">{{ item.platform ? item.platform[0]!.toUpperCase() + item.platform.slice(1) : 'Social' }}</PrismicLink>
    </li>
  </ul>
</template>

<style lang="scss">
/* Icon links (Social menu). Shared by the menu panel and the social overlay. */
ul.social {
  display: flex;
  list-style: none;

  li {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
    margin: 0 2rem 1rem 0;
  }

  a {
    display: block;
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: center top;
    font-size: 0;

    &::before {
      content: none;
    }
  }

  .instagram a {
    background-image: url('/images/instagram.svg');
  }
  .facebook a {
    background-image: url('/images/facebook.svg');
  }
  .twitter a {
    background-image: url('/images/twitter.svg');
  }
}
</style>
