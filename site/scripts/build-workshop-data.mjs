#!/usr/bin/env node
/**
 * Regenerates the two derived datasets from the source repo's catalogue.
 *
 *   public/data/workshop.json    technologies + upgrade modules for the two workshop benches
 *   public/data/substances.json  the 72 substances the periodic table lays out
 *
 * `data/catalogue.json` in the no-man repo is 2.7 MB of Assistant NMS data — far too much to ship
 * to the browser — so this projects out only the entries the site actually renders. Everything the
 * files contain (names, groups, descriptions, prices, currencies, icons) is copied verbatim from
 * the catalogue; nothing here writes item content of its own.
 *
 *   node scripts/build-workshop-data.mjs [path-to-catalogue.json]
 *
 * With no argument it downloads the catalogue from the source repo.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(HERE, '..', 'public', 'data')
const CATALOGUE_URL =
  'https://raw.githubusercontent.com/Micka420-collab/no-man/main/data/catalogue.json'
const SOURCE = 'https://github.com/Micka420-collab/no-man/blob/main/data/catalogue.json'

/** Longest description we keep; the bench shows two or three lines of it. */
const DESC_MAX = 240

// ── starship families ──────────────────────────────────────────────────────────────────────────
// multitool.json declares the multi-tool families itself (labels, colour and member ids), so those
// are read straight from it. ships.json carries no equivalent block, so the starship grouping is
// declared here — ids only; the labels and colours live in src/data/catalogue.ts.
const SHIP_FAMILIES = [
  { key: 'pulse', core: ['tech23', 'tech24', 'tech144', 'tech145', 'tech188'], mods: ['upgrade59', 'upgrade60', 'upgrade61', 'upgrade62', 'upgrade160'] },
  { key: 'launch', core: ['tech25', 'tech26', 'tech27', 'tech187', 'tech231', 'tech270'], mods: ['upgrade168', 'upgrade169', 'upgrade170', 'upgrade171', 'upgrade172'] },
  { key: 'hyper', core: ['tech29', 'tech30', 'tech31', 'tech32', 'tech146', 'tech286'], mods: ['upgrade63', 'upgrade64', 'upgrade65', 'upgrade66', 'upgrade161'] },
  { key: 'shield', core: ['tech33', 'tech34'], mods: ['upgrade67', 'upgrade68', 'upgrade69', 'upgrade70', 'upgrade162'] },
  { key: 'photon', core: ['tech37'], mods: ['upgrade71', 'upgrade72', 'upgrade73', 'upgrade74', 'upgrade163'] },
  { key: 'phase', core: ['tech41', 'tech42'], mods: ['upgrade75', 'upgrade76', 'upgrade77', 'upgrade78', 'upgrade164'] },
  { key: 'positron', core: ['tech43', 'tech44'], mods: ['upgrade79', 'upgrade80', 'upgrade81', 'upgrade82', 'upgrade165'] },
  { key: 'infra', core: ['tech45', 'tech46', 'tech147'], mods: ['upgrade83', 'upgrade84', 'upgrade85', 'upgrade86', 'upgrade166'] },
  { key: 'cyclotron', core: ['tech47', 'tech48'], mods: ['upgrade87', 'upgrade88', 'upgrade89', 'upgrade90', 'upgrade167'] },
  // the catalogue carries no rocket-launcher upgrade modules — the game has none
  { key: 'rockets', core: ['tech35', 'tech36'], mods: [] },
  { key: 'sutility', core: ['tech28', 'tech39', 'tech40', 'tech190', 'tech216', 'tech220', 'tech230', 'tech217', 'tech219', 'tech294'], mods: [] },
]

// ── helpers ────────────────────────────────────────────────────────────────────────────────────

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

async function loadCatalogue(arg) {
  if (arg) return readJSON(arg)
  const res = await fetch(CATALOGUE_URL)
  if (!res.ok) throw new Error(`catalogue download failed: ${res.status} ${res.statusText}`)
  return res.json()
}

/** Cut a description at a word boundary so the card never shows half a word. */
function clip(s) {
  const t = String(s || '').trim()
  if (t.length <= DESC_MAX) return t
  const cut = t.slice(0, DESC_MAX)
  const sp = cut.lastIndexOf(' ')
  return (sp > DESC_MAX - 40 ? cut.slice(0, sp) : cut).trimEnd() + '…'
}

function project(it) {
  const o = { fr: it.name_fr || it.name_en || '', en: it.name_en || it.name_fr || '' }
  if (it.group_fr) o.gFr = it.group_fr
  if (it.group_en) o.gEn = it.group_en
  const dFr = clip(it.desc_fr), dEn = clip(it.desc_en)
  if (dFr) o.dFr = dFr
  if (dEn) o.dEn = dEn
  if (it.value != null) o.v = it.value
  if (it.currency) o.cur = it.currency
  if (it.icon) o.icon = it.icon
  return o
}

/**
 * The class of an upgrade module, taken from the data rather than from its position in the list.
 *
 * Two independent signals, in order of authority:
 *  1. the `modules` category spells the class out ("C-Class Pulse Engine Upgrade"); those entries
 *     share an icon with the `upgrades` entry they describe, which is what links the two;
 *  2. otherwise the price ladder — 60 / 140 / 300 / 480 for C / B / A / S, in whichever currency —
 *     with the odd-priced "Suspicious"/"Banned" variant falling out as X.
 * Position is only the last resort, and the build fails loudly if it is ever needed.
 */
const PRICE_CLASS = { 60: 'C', 140: 'B', 300: 'A', 480: 'S' }

function moduleClass(item, classByIcon, fallback) {
  const labelled = item?.icon ? classByIcon[item.icon] : null
  if (labelled) return { cl: labelled, how: 'label' }
  const g = (item?.group_en || '') + ' ' + (item?.name_en || '')
  if (/suspicious|banned|illegal/i.test(g)) return { cl: 'X', how: 'label' }
  const byPrice = PRICE_CLASS[Math.round(item?.value ?? -1)]
  if (byPrice) return { cl: byPrice, how: 'price' }
  return { cl: fallback, how: 'position' }
}

// ── build ──────────────────────────────────────────────────────────────────────────────────────

const catalogue = await loadCatalogue(process.argv[2])
const cats = catalogue.categories || {}
const index = {}
for (const cat of Object.values(cats)) {
  for (const it of cat.items || []) index[it.id] = it
}

// icon → explicit class, harvested from the `modules` category
const classByIcon = {}
for (const it of cats.modules?.items || []) {
  const g = it.group_en || ''
  const m = /^([CBAS])-Class\b/.exec(g)
  if (m && it.icon) classByIcon[it.icon] = m[1]
  else if (/^(Illegal|Banned)\b/.test(g) && it.icon) classByIcon[it.icon] = 'X'
}

const multitool = readJSON(path.join(DATA, 'multitool.json'))
const toolFamilies = (multitool.families || []).map((f) => ({
  key: f.key, fr: f.fr, en: f.en, color: f.color, core: f.core || [], mods: f.mods || [],
}))

const items = {}
const missing = []
const positional = []

function resolveFamily(f) {
  const out = { key: f.key, coreIds: [], modIds: [], modClasses: [] }
  if (f.fr) out.fr = f.fr
  if (f.en) out.en = f.en
  if (f.color) out.color = f.color

  for (const id of f.core) {
    const it = index[id]
    if (!it) { missing.push(id); continue }
    items[id] = project(it)
    out.coreIds.push(id)
  }
  f.mods.forEach((id, i) => {
    const it = index[id]
    if (!it) { missing.push(id); return }
    items[id] = project(it)
    const { cl, how } = moduleClass(it, classByIcon, ['C', 'B', 'A', 'S', 'X'][i] || 'X')
    if (how === 'position') positional.push(`${f.key}/${id}`)
    out.modIds.push(id)
    out.modClasses.push(cl)
  })
  return out
}

const families = {
  tool: toolFamilies.map(resolveFamily),
  ship: SHIP_FAMILIES.map(resolveFamily),
}

if (missing.length) {
  console.error('catalogue is missing referenced ids: ' + missing.join(', '))
  process.exit(1)
}
if (positional.length) {
  console.error('could not read a class from the data for: ' + positional.join(', '))
  process.exit(1)
}

fs.writeFileSync(path.join(DATA, 'workshop.json'), JSON.stringify({
  note: "Technologies et modules d'amélioration réels de No Man's Sky, extraits de data/catalogue.json "
    + 'du dépôt (source : Assistant NMS). Ids, noms, descriptions, valeurs, devises et icônes '
    + 'proviennent du jeu ; les classes des modules sont lues dans les données, pas déduites de leur ordre.',
  source: SOURCE,
  updated_at: catalogue.updated_at,
  families,
  items,
}, null, 1) + '\n')

// ── substances ─────────────────────────────────────────────────────────────────────────────────

const elements = readJSON(path.join(DATA, 'elements.json'))
const subIds = []
for (const col of elements.columns || []) for (const c of col.cells || []) subIds.push(c.raw)
for (const c of elements.flora?.cells || []) subIds.push(c.raw)
for (const row of elements.extra_rows || []) for (const c of row.cells || []) subIds.push(c.raw)

const subItems = {}
const subMissing = []
for (const id of subIds) {
  if (subItems[id]) continue
  const it = index[id]
  if (!it) { subMissing.push(id); continue }
  subItems[id] = project(it)
}
if (subMissing.length) {
  console.error('elements.json references ids absent from the catalogue: ' + subMissing.join(', '))
  process.exit(1)
}

fs.writeFileSync(path.join(DATA, 'substances.json'), JSON.stringify({
  note: 'Substances du tableau périodique, extraites de data/catalogue.json du dépôt '
    + '(source : Assistant NMS). Noms, groupes, descriptions, valeurs et icônes proviennent du jeu.',
  source: SOURCE,
  updated_at: catalogue.updated_at,
  items: subItems,
}, null, 1) + '\n')

const modCount = Object.values(families).flat().reduce((n, f) => n + f.modIds.length, 0)
console.log(
  `workshop.json    ${Object.keys(items).length} items · ${families.tool.length} tool + `
  + `${families.ship.length} ship families · ${modCount} modules, all classes read from the data\n`
  + `substances.json  ${Object.keys(subItems).length} substances`,
)
