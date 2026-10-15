/** Shared open/closed state for the off-canvas menu and the special-notice overlay. */
export const useMenuOpen = () => useState('menu-open', () => false)
export const useSpecialOpen = () => useState('special-open', () => false)

/** True on the very first page view only (drives the preloader-era header intro). */
export const useFirstView = () => useState('first-view', () => true)
