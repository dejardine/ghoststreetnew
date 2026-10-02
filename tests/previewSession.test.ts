import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasPreviewCookie, waitForPreviewCookie } from '../app/utils/previewSession.ts'

test('detects the preview cookie among others', () => {
  assert.equal(hasPreviewCookie('a=1; io.prismic.preview=%7B%7D; b=2'), true)
  assert.equal(hasPreviewCookie('a=1; b=2'), false)
  assert.equal(hasPreviewCookie('io.prismic.preview='), false)
})

test('resolves once the cookie appears', async () => {
  let cookies = 'a=1'
  setTimeout(() => (cookies = 'a=1; io.prismic.preview=%7B%22ghoststreet%22%3A%7B%7D%7D'), 50)
  await waitForPreviewCookie(() => cookies, { timeout: 1000, interval: 10 })
})

test('rejects after the timeout', async () => {
  await assert.rejects(waitForPreviewCookie(() => '', { timeout: 50, interval: 10 }), /Timed out/)
})
