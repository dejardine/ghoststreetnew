<script setup lang="ts">
import * as prismic from '@prismicio/client'

const { data: settings } = await useSettings()
const s = computed(() => settings.value!.data)
const socialOpen = useSocialOpen()
const specialOpen = useSpecialOpen()
const year = new Date().getFullYear()

const hours = computed(() => lines(s.value.opening_hours).filter(Boolean))
const address = computed(() => lines(s.value.address).filter(Boolean))
const hasSpecial = computed(() => !!s.value.special_link_label && prismic.isFilled.richText(s.value.special_notice))

/* Back-to-top arrow: rises into place when the footer arrives, resets when it leaves. */
const arrow = ref<HTMLElement>()
const arrowVisible = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => (arrowVisible.value = !!entry?.isIntersecting))
  if (arrow.value) observer.observe(arrow.value)
})
onBeforeUnmount(() => observer?.disconnect())

function toTop(event: MouseEvent) {
  event.preventDefault()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="main-footer">
    <div class="wrap">
      <a ref="arrow" href="#start" class="arrow-up" :class="{ 'is-visible': arrowVisible }" aria-label="Back to top" @click="toTop" />

      <div v-reveal class="col">
        <NewsletterForm :heading="s.newsletter_heading" />
        <nav v-reveal aria-label="Footer">
          <ul>
            <li v-if="hasSpecial">
              <a href="#" class="special-hours-link" role="button" @click.prevent="specialOpen = true">{{ s.special_link_label }}</a>
            </li>
            <li class="social-trigger">
              <a href="#" role="button" @click.prevent="socialOpen = true">{{ s.social_link_label || 'Social' }}</a>
            </li>
            <li aria-hidden="true">_</li>
          </ul>
        </nav>
      </div>

      <div v-reveal class="col">
        <div v-if="prismic.isFilled.richText(s.footer_note)" class="footer-text">
          <PrismicRichText :field="s.footer_note" />
        </div>
        <h4>{{ s.venue_name }}</h4>
        <p>
          <template v-if="s.phone">Ph: {{ s.phone }} <br></template>
          <template v-if="s.email">Email: <a :href="`mailto:${s.email}`">{{ s.email }}</a> <br></template>
          <br>
          <template v-if="hours.length">
            <template v-for="line in hours" :key="line">{{ line }}<br></template>
            <br>
          </template>
          <template v-if="address.length">
            <template v-for="line in address" :key="line">{{ line }}<br></template>
            <br>
          </template>
          <template v-if="prismic.isFilled.link(s.map_link)">
            <PrismicLink :field="s.map_link" class="underline">{{ s.map_link.text || 'View in Google Maps' }}</PrismicLink><br>
          </template>
          <PrismicLink v-if="prismic.isFilled.link(s.map_file)" :field="s.map_file" class="underline" target="_blank">
            {{ s.map_file.text || 'View Map' }}
          </PrismicLink>
        </p>
      </div>

      <nav v-reveal class="terms" aria-label="Legal">
        <ul>
          <li>&copy; {{ year }} {{ s.copyright }} </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<style lang="scss">
.main-footer {
  position: relative;
  z-index: 10;
  padding: 5rem 0 1.5rem;
  background: var(--bg);

  @include breakpoint(mobile) {
    padding: 4rem 0 0;
  }

  .wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;

    @include breakpoint(mobile) {
      grid-template-columns: 1fr;
    }
  }

  p {
    margin: 0;
    color: var(--taupe);
    @include smallType;
  }

  nav ul {
    @include smallType;
    color: var(--black);

    a,
    a:hover {
      color: var(--red);
    }
  }

  .col {
    margin-bottom: 8rem;

    @include breakpoint(mobile) {
      margin-bottom: 2rem;
    }

    p {
      max-width: 46rem;

      @include breakpoint(mobile) {
        margin: 0 0 2rem;
      }
    }

    h4 {
      margin: 2.5rem 0 0;
      color: var(--taupe);
      font-size: 1.833rem;
      line-height: 2.333rem;

      @include breakpoint(tablet) {
        font-size: 1.5rem;
      }
      @include breakpoint(mobile) {
        margin: 0;
      }
    }

    a {
      color: var(--taupe);

      &:hover {
        color: var(--red);
      }

      &.underline {
        text-decoration: underline;
      }

      &.special-hours-link {
        color: var(--red);
        cursor: pointer;
      }
    }

    &:last-of-type {
      padding-right: 4rem;

      @include breakpoint(mobile) {
        padding-right: 0;
      }
    }
  }

  /* The note above the venue name kept its pasted 0.5rem bottom margin on the live site. */
  .footer-text p,
  .col .footer-text p {
    margin: 0 0 0.5rem;
  }

  nav.terms {
    grid-column: 1 / -1;
    width: 100%;
    text-align: center;
    @include lightFont;

    @include breakpoint(mobile) {
      display: none;
    }

    ul {
      width: 100%;
      margin: 0 auto;
      font-size: 1rem;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-align: center;
      color: var(--taupe);
    }

    li {
      display: inline-block;
      padding: 0 1.5rem;
    }
  }
}

.arrow-up {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  display: block;
  width: 28px;
  height: 52px;
  background: url('/images/arrow-up.svg') no-repeat center 10px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(50%);
  transition: background-position 450ms var(--ease);

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
    transition:
      background-position 450ms var(--ease),
      opacity 450ms var(--ease) 600ms,
      transform 450ms var(--ease) 600ms;
  }

  &:hover {
    background-position: center top;
  }

  @include breakpoint(mobile) {
    display: none;
  }
}
</style>
