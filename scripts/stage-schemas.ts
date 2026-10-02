/**
 * Stages editor-owned JSON-LD drafts (docs/seo-schemas/*.json) into each page's
 * "Structured data" field as UNPUBLISHED drafts in the migration release, for client review.
 *
 *   npx tsx scripts/stage-schemas.ts --dry   print what would change
 *   npx tsx scripts/stage-schemas.ts         stage drafts (never publishes)
 *
 * Safety: reads each document's current published version as the baseline and changes only
 * `json_ld`. A document whose publication date no longer matches migration-state.json (an editor
 * has published since) is skipped. Writes scripts/output/schema-receipt.json.
 */
import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as prismic from '@prismicio/client'
import { site } from '../site.config'

const DRY = process.argv.includes('--dry')
const here = import.meta.dirname
const state = JSON.parse(await readFile(join(here, 'migration-state.json'), 'utf8')) as {
  documents: Record<string, { id: string; lastPublicationDate?: string }>
}
const schemaFor: Record<string, string> = {
  home: 'home.json',
  food_menu: 'menu.json',
  'page:bookings': 'bookings.json',
  'page:private-events': 'private-events.json',
  'page:pickup-delivery': 'pickup-delivery.json',
}

const client = prismic.createWriteClient(site.prismicRepo, { writeToken: process.env.PRISMIC_WRITE_TOKEN ?? 'dry' })
const migration = prismic.createMigration()
const receipt: { key: string; id: string; status: string; file: string }[] = []

for (const [key, file] of Object.entries(schemaFor)) {
  const known = state.documents[key]
  if (!known) throw new Error(`No migrated document for ${key}`)
  const json = JSON.parse(await readFile(join(here, '..', 'docs/seo-schemas', file), 'utf8'))
  const current = await client.getByID(known.id)
  if (known.lastPublicationDate && current.last_publication_date !== known.lastPublicationDate) {
    receipt.push({ key, id: known.id, status: 'skipped: edited since migration', file })
    continue
  }
  const json_ld: prismic.RichTextField = [{ type: 'preformatted', text: JSON.stringify(json, null, 2), spans: [] }]
  if (!DRY) migration.updateDocument({ ...current, data: { ...current.data, json_ld } } as never)
  receipt.push({ key, id: known.id, status: DRY ? 'would stage' : 'staged as draft (unpublished)', file })
}

if (!DRY) await client.migrate(migration)
await writeFile(join(here, 'output', 'schema-receipt.json'), JSON.stringify({ at: new Date().toISOString(), dry: DRY, receipt }, null, 2))
console.table(receipt)
console.log(DRY ? 'Dry run: nothing written.' : 'Drafts are in the Prismic "Migration release". Review, then publish from Prismic.')
