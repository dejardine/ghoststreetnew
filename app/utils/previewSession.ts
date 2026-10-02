/** Name of the cookie the Prismic toolbar sets when a preview session starts. */
export const PREVIEW_COOKIE = 'io.prismic.preview'

/** True when a cookie string contains a Prismic preview session. */
export function hasPreviewCookie(cookieString: string) {
  return cookieString.split(/;\s*/).some((part) => part.startsWith(`${PREVIEW_COOKIE}=`) && part.length > PREVIEW_COOKIE.length + 1)
}

/**
 * Resolves once the preview cookie exists, or rejects after `timeout` ms. The toolbar script
 * sets the cookie asynchronously after /preview loads, and the draft-refresh hooks only install
 * on a page load that already has it — so /preview must wait before redirecting.
 */
export function waitForPreviewCookie(
  readCookies: () => string,
  { timeout = 8000, interval = 100 }: { timeout?: number; interval?: number } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      if (hasPreviewCookie(readCookies())) return resolve()
      if (Date.now() - started >= timeout) return reject(new Error('Timed out waiting for the Prismic preview session'))
      setTimeout(check, interval)
    }
    check()
  })
}
