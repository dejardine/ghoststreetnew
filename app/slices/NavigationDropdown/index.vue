<script setup lang="ts">
import type { Content } from '@prismicio/client'

const props = defineProps(getSliceComponentProps<Content.NavigationDropdownSlice>(['slice', 'index', 'slices', 'context']))
const open = ref(false)
const id = computed(() => `sub-menu-${props.index}`)
</script>

<template>
  <li class="menu-item menu-item-has-children">
    <button type="button" class="sub-toggle" :aria-expanded="open" :aria-controls="id" @click="open = !open">
      {{ slice.primary.label }}
    </button>
    <div :id="id" class="sub-menu-wrap" :class="{ open }" :inert="!open">
      <ul class="sub-menu">
        <li v-for="(item, i) in slice.primary.links" :key="i" class="menu-item">
          <PrismicLink :field="item.link">{{ item.label }}</PrismicLink>
        </li>
      </ul>
    </div>
  </li>
</template>
