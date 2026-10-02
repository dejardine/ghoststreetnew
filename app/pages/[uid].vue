<script setup lang="ts">
import * as prismic from '@prismicio/client'

const route = useRoute()
const uid = route.params.uid as string
const page = await useDocumentByUID('page', uid)
const d = computed(() => page.value.data)

usePageSeo(() => ({ data: d.value, pageName: prismic.asText(d.value.title), path: `/${uid}/` }))
</script>

<template>
  <section class="content-page">
    <div class="columns wysiwyg wrap booking-content">
      <div class="left">
        <h1 v-reveal>{{ prismic.asText(d.title) }}</h1>
        <PrismicImage
          v-if="prismic.isFilled.image(d.side_image)"
          :field="d.side_image"
          :widths="[324, 648]"
          sizes="(max-width: 767px) 45vw, 23vw"
          fetchpriority="high"
        />
      </div>

      <div class="right">
        <div v-reveal>
          <PrismicRichText :field="d.body" />
        </div>
        <BookingWidget v-if="d.show_booking_widget" />
      </div>
    </div>
  </section>
</template>
