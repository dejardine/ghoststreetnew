<script setup lang="ts">
import { components } from "~/slices";

const prismic = usePrismic();
const { data: page } = await useAsyncData("food_menu", () =>
	prismic.client.getSingle("food_menu"),
);
</script>

<template>
	<main>
		<SliceZone :slices="page?.data.slices ?? []" :components="components" />
	</main>
</template>