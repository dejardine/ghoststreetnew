<script setup lang="ts">
import * as prismic from '@prismicio/client'

/* A teaser's link wrapper; teasers without a link keep the layout but take no clicks. */
defineProps<{ link?: prismic.LinkField }>()
</script>

<template>
  <PrismicLink v-if="prismic.isFilled.link(link)" :field="link" class="teaser-link"><slot /></PrismicLink>
  <div v-else class="teaser-link no-link"><slot /></div>
</template>
