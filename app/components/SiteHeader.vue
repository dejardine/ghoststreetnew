<script setup lang="ts">
const route = useRoute()
const menuOpen = useMenuOpen()
const firstView = useFirstView()
/* On the homepage's first load the header slides in once the preloader has faded. */
const intro = computed(() => firstView.value && route.path === '/')
</script>

<template>
  <header id="start" class="main-header" :class="{ 'is-intro': intro }">
    <div class="wrap">
      <button
        type="button"
        class="hamburger"
        :class="{ open: menuOpen }"
        aria-controls="main-menu"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        @click="menuOpen = !menuOpen"
      >
        <span /><span /><span /><span />
      </button>
    </div>
  </header>
</template>

<style lang="scss">
.main-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  display: block;
  width: 100%;
  height: 70px;
  pointer-events: none;

  .wrap {
    max-width: 100%;
    width: 96%;

    @include breakpoint(tablet) {
      width: 94%;
    }
    @include breakpoint(mobile) {
      width: 90%;
    }
  }

  &.is-intro {
    animation: header-intro 400ms linear 700ms both;
  }
}

@keyframes header-intro {
  from {
    transform: translateY(-100%);
  }
}

/* Hamburger and the overlays' close buttons share one drawing. */
.hamburger,
.social-close,
.special-close {
  position: absolute;
  top: 26px;
  right: 0;
  display: block;
  width: 40px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: all;
  transition: 0.5s ease-in-out;

  span {
    position: absolute;
    left: 0;
    display: block;
    width: 100%;
    height: 2px;
    background: var(--red-dark);
    opacity: 1;
    transform: rotate(0deg);
    transition: 0.15s ease-in-out;

    &:nth-child(1) {
      top: 0;
    }
    &:nth-child(2),
    &:nth-child(3) {
      top: 14px;
    }
    &:nth-child(4) {
      top: 28px;
    }

    @include breakpoint(mobile) {
      &:nth-child(1) {
        top: 3px;
      }
      &:nth-child(4) {
        top: 25px;
      }
    }
  }

  &:hover span {
    &:nth-child(1) {
      top: 3px;
    }
    &:nth-child(4) {
      top: 25px;
    }
  }

  &.open span {
    &:nth-child(1),
    &:nth-child(4) {
      top: 18px;
      left: 50%;
      width: 0%;
    }
    &:nth-child(2) {
      transform: rotate(45deg);
      background: var(--white);
    }
    &:nth-child(3) {
      transform: rotate(-45deg);
      background: var(--white);
    }
  }
}
</style>
