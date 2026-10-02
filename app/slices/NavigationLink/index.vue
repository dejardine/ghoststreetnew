<script setup lang="ts">
import type { Content } from '@prismicio/client'

defineProps(getSliceComponentProps<Content.NavigationLinkSlice>(['slice', 'index', 'slices', 'context']))
</script>

<template>
  <li class="menu-item">
    <PrismicLink :field="slice.primary.link">{{ slice.primary.label }}</PrismicLink>
  </li>
</template>
