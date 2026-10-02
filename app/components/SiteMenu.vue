<script setup lang="ts">
import { components } from '~/slices'

const menuOpen = useMenuOpen()
const { data: navigation } = await useNavigation()
const { data: settings } = await useSettings()

function close() {
  menuOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) close()
}

/* The theme scrolled the page to the top (400ms) whenever the menu opened. */
watch(menuOpen, (open) => {
  if (open) window.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <nav id="main-menu" class="main-menu" :class="{ open: menuOpen }" aria-label="Main" :inert="!menuOpen">
    <ul class="top-level">
      <SliceZone :slices="navigation?.data.slices ?? []" :components="components" />
    </ul>
    <SocialLinks class="social" :links="settings?.data.social_links ?? []" />
  </nav>
  <div class="menu-bg" :class="{ open: menuOpen }" aria-hidden="true" @click="close" />
</template>

<style lang="scss">
/*
 * Choreography from the theme's openMenu()/closeMenu() (velocity.js):
 *  open:  panel slides in 450ms; items follow from translateX(10%) at 450/480/510/540/590ms;
 *         social icons rise from translateY(50%) at 620ms; backdrop fades in over 650ms.
 *  close: items and icons fade over 350ms, then snap back; panel slides out after 250ms;
 *         backdrop fades out over 650ms after 250ms.
 */
.main-menu {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 95;
  width: 40vw;
  max-width: 40rem;
  height: 100vh;
  background: var(--red-menu);
  transform: translate3d(100%, 0, 0);
  visibility: hidden;
  transition:
    transform 450ms var(--ease) 250ms,
    visibility 0s linear 700ms;

  &.open {
    transform: translate3d(0, 0, 0);
    visibility: visible;
    transition:
      transform 450ms var(--ease),
      visibility 0s;
  }

  @include breakpoint(tabletPortrait) {
    max-width: 60rem;
    width: 50vw;
  }
  @include breakpoint(mobile) {
    max-width: 75vw;
    width: 75vw;
  }

  ul {
    position: absolute;
    top: 50%;
    left: 0;
    margin: 0;
    padding: 0 6rem 0 8rem;
    list-style: none;
    font-size: 2.5rem;
    line-height: 2.5rem;
    @include displayFont;

    @include breakpoint(tablet) {
      line-height: 2rem;
      padding: 0 2rem 0 4rem;
    }
    @include breakpoint(mobile) {
      padding: 0 2rem;
    }
  }

  .top-level {
    transform: translate(0, -50%);

    > li {
      margin: 0 0 1rem;
      padding: 0;
      opacity: 0;
      transform: translateX(10%);
      transition:
        opacity 350ms var(--ease),
        transform 0s linear 350ms;
    }
  }

  &.open .top-level > li {
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity 450ms var(--ease) var(--delay),
      transform 450ms var(--ease) var(--delay);

    &:nth-child(1) { --delay: 450ms; }
    &:nth-child(2) { --delay: 480ms; }
    &:nth-child(3) { --delay: 510ms; }
    &:nth-child(4) { --delay: 540ms; }
    &:nth-child(5) { --delay: 590ms; }
    &:nth-child(6) { --delay: 620ms; }
    &:nth-child(7) { --delay: 650ms; }
    &:nth-child(n + 8) { --delay: 680ms; }
  }

  a,
  .sub-toggle {
    position: relative;
    color: var(--white);
    transition: opacity 450ms var(--ease);
  }

  .sub-toggle {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    line-height: inherit;
    cursor: pointer;
    text-align: left;
  }

  /* Underline sweep. As in the theme, hovering a parent item sweeps its sub-links too. */
  .top-level :is(a, .sub-toggle)::before {
    content: '';
    position: absolute;
    top: 55%;
    left: 0;
    width: 0%;
    height: 1px;
    background: var(--white);
    transition: width 250ms var(--ease);
  }
  .top-level li:hover :is(a, .sub-toggle)::before {
    width: 100%;
  }

  .sub-menu-wrap {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 200ms ease,
      opacity 200ms ease;

    &.open {
      grid-template-rows: 1fr;
      opacity: 1;
    }
  }

  ul.sub-menu {
    position: static;
    min-height: 0;
    overflow: hidden;
    padding: 0 0 0 2rem;
    font-size: 2rem;
    line-height: 2rem;

    @include breakpoint(mobile) {
      font-size: 2.5rem;
      line-height: 1.5rem;
    }

    li {
      margin: 0 0 0.5rem;
      /* The theme's closeMenu() left every nested item offset by 10%; production shows it. */
      transform: translateX(10%);

      &:first-child {
        margin-top: 2rem;
      }
    }
  }

  ul.social {
    top: auto;
    bottom: 4rem;
    z-index: 5;
    opacity: 0;
    transform: translateY(50%);
    transition:
      opacity 350ms var(--ease),
      transform 0s linear 350ms;

    @include breakpoint(mobile) {
      bottom: 3rem;
    }
    @include breakpoint(mobileLandscape) {
      bottom: 2rem;
    }

    li {
      margin: 0 2rem 1rem 0;
    }
  }

  &.open ul.social {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 450ms var(--ease) 620ms,
      transform 450ms var(--ease) 620ms;
  }
}

.menu-bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 90;
  width: 100%;
  height: 100vh;
  background: var(--overlay);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 650ms var(--ease) 250ms,
    visibility 0s linear 900ms;

  &.open {
    opacity: 1;
    visibility: visible;
    transition:
      opacity 650ms var(--ease),
      visibility 0s;
  }
}
</style>
