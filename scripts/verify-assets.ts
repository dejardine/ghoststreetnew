/**
 * Verifies every migrated asset byte-for-byte: downloads the file Prismic serves and compares its
 * SHA-256 with the hash of the WordPress original recorded in migration-state.json. Also checks
 * the static copies kept at the original /wp-content/uploads paths in public/.
 *
 *   npx tsx scripts/verify-assets.ts
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const state = JSON.parse(await readFile(join(import.meta.dirname, 'migration-state.json'), 'utf8')) as {
  assets: Record<string, { id: string; url: string; sha256: string; originalPath: string }>
}
const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

let failures = 0
for (const [key, a] of Object.entries(state.assets)) {
  // Strip imgix parameters so images.prismic.io returns the original bytes.
  const res = await fetch(a.url.split('?')[0]!)
  const remote = sha(Buffer.from(await res.arrayBuffer()))
  let local = '—'
  if (key.startsWith('/wp-content/uploads/')) {
    local = await readFile(join(root, 'public', key)).then(sha, () => 'missing')
  }
  const ok = res.ok && remote === a.sha256 && (local === '—' || local === a.sha256)
  if (!ok) failures++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${key}  prismic:${remote === a.sha256 ? 'match' : remote.slice(0, 12)}  static:${local === '—' ? 'n/a' : local === a.sha256 ? 'match' : local}`)
}
console.log(failures ? `\n${failures} asset(s) failed verification` : '\nAll assets verified')
process.exit(failures ? 1 : 0)
