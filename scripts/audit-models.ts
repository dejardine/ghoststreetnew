/**
 * Prismic model audit (MIGRATION.md §Field inventory). For every field in customtypes/ and slices:
 *  - is it read by the frontend (app/, server/)?
 *  - how many published documents fill it?
 *  - are any labels duplicated or empty?
 *
 *   npx tsx scripts/audit-models.ts         exits 1 on unread fields or label problems
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as prismic from '@prismicio/client'
import { site } from '../site.config'

const root = join(import.meta.dirname, '..')
type Field = { type: string; config?: { label?: string; fields?: Record<string, Field>; choices?: Record<string, unknown> } }
type Row = { model: string; tab: string; path: string; type: string; label: string }

async function files(dir: string, ext: RegExp): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await files(p, ext)))
    else if (ext.test(entry.name)) out.push(p)
  }
  return out
}

const rows: Row[] = []
const walk = (model: string, tab: string, fields: Record<string, Field>, prefix = '') => {
  for (const [id, f] of Object.entries(fields)) {
    if (f.type === 'Slices') continue
    rows.push({ model, tab, path: prefix + id, type: f.type, label: f.config?.label ?? '' })
    if (f.type === 'Group' && f.config?.fields) walk(model, tab, f.config.fields, `${prefix}${id}.`)
  }
}

for (const file of await files(join(root, 'customtypes'), /index\.json$/)) {
  const model = JSON.parse(await readFile(file, 'utf8'))
  for (const [tab, fields] of Object.entries(model.json as Record<string, Record<string, Field>>)) walk(model.id, tab, fields)
}
for (const file of await files(join(root, 'app/slices'), /model\.json$/)) {
  const slice = JSON.parse(await readFile(file, 'utf8'))
  for (const v of slice.variations) walk(`slice:${slice.id}`, v.id, v.primary ?? {})
}

const source = (await Promise.all([...(await files(join(root, 'app'), /\.(vue|ts)$/)), ...(await files(join(root, 'server'), /\.ts$/))].map((f) => readFile(f, 'utf8')))).join('\n')
/* Fields the module/runtime reads implicitly. */
const implicit = new Set(['uid'])
const isRead = (path: string) => {
  const id = path.split('.').pop()!
  return implicit.has(id) || new RegExp(`[.\\[' "]${id}\\b`).test(source)
}

const docs = await prismic.createClient(site.prismicRepo).dangerouslyGetAll()
const filled = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.length > 0 && !(value.length === 1 && (value[0] as { text?: string })?.text === '')
    : typeof value === 'object' && value !== null
      ? 'link_type' in value
        ? (value as { link_type: string }).link_type !== 'Any' && Object.keys(value).length > 1
        : Object.keys(value).length > 0 && !('url' in value && !(value as { url: unknown }).url)
      : value !== null && value !== '' && value !== undefined && value !== false
const countFilled = (row: Row) => {
  const [first, second] = row.path.split('.')
  if (row.model.startsWith('slice:')) {
    const type = row.model.slice(6)
    const slices = docs.flatMap((d) => ((d.data as { slices?: { slice_type: string; primary: Record<string, unknown> }[] }).slices ?? []).filter((s) => s.slice_type === type))
    const values = second ? slices.flatMap((s) => ((s.primary[first!] as Record<string, unknown>[]) ?? []).map((i) => i[second])) : slices.map((s) => s.primary[first!])
    return `${values.filter(filled).length}/${values.length}`
  }
  const ofType = docs.filter((d) => d.type === row.model)
  if (row.path === 'uid') return `${ofType.filter((d) => d.uid).length}/${ofType.length}`
  const values = second ? ofType.flatMap((d) => ((d.data as Record<string, Record<string, unknown>[]>)[first!] ?? []).map((i) => i[second])) : ofType.map((d) => (d.data as Record<string, unknown>)[first!])
  return `${values.filter(filled).length}/${values.length}`
}

let problems = 0
const labelCount = new Map<string, number>()
for (const r of rows) labelCount.set(`${r.model}|${r.label}`, (labelCount.get(`${r.model}|${r.label}`) ?? 0) + 1)

console.log('| Model | Tab | Field | Type | Label | Read by frontend | Filled (published) |')
console.log('| --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows) {
  const read = isRead(r.path)
  const issues = [!read && 'NOT READ', !r.label && 'NO LABEL', (labelCount.get(`${r.model}|${r.label}`) ?? 0) > 1 && 'DUPLICATE LABEL'].filter(Boolean)
  if (issues.length) problems++
  console.log(`| ${r.model} | ${r.tab} | \`${r.path}\` | ${r.type} | ${r.label} | ${read ? 'yes' : '**no**'} | ${countFilled(r)}${issues.length ? ` ⚠ ${issues.join(', ')}` : ''} |`)
}
console.log(`\n${rows.length} fields, ${problems} problem(s)`)
process.exit(problems ? 1 : 0)
