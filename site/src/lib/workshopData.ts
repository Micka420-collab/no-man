import type { Lang } from '../types'
import {
  AVAILABILITY, PART_OVERRIDE, TIER_BONUS, TIER_ORDER, familyMeta,
  type ClassKey, type FamilyMeta, type PartKey, type Range, type StatKey,
} from '../data/catalogue'

/**
 * Joins the curated family metadata with the game's own item data.
 *
 * `public/data/workshop.json` is generated from `data/catalogue.json` in the source repo — the
 * Assistant NMS dataset — so technology names, descriptions, prices, currencies and item icons are
 * the game's, not hand-written. Family membership, labels and colours come from `multitool.json`
 * for the multi-tool; ships have no equivalent block in the data, so those fall back to SHIP_META.
 *
 * The data always wins over `src/data/catalogue.ts`, which only fills the gaps.
 */

export interface WorkshopItem {
  fr: string
  en: string
  gFr?: string
  gEn?: string
  dFr?: string
  dEn?: string
  v?: number | null
  cur?: string | null
  icon?: string
}

export interface WorkshopFamily {
  key: string
  coreIds: string[]
  modIds: string[]
  /** class of each module, read from the game data at generation time */
  modClasses?: string[]
  /** label and colour, where the dataset declares them (multi-tool families do) */
  fr?: string
  en?: string
  color?: string
}

export interface WorkshopData {
  families?: { tool?: WorkshopFamily[]; ship?: WorkshopFamily[] }
  items?: Record<string, WorkshopItem>
  updated_at?: string
}

export interface ResolvedTech {
  id: string
  name: string
  desc: string
  group: string
  icon?: string
  part: PartKey
}

export interface ResolvedModule {
  id: string
  cl: ClassKey
  name: string
  icon?: string
  /** real price from the game data; null when the data has none */
  nanites: number | null
  currency: string
  bonus: Range
  availability: string
}

export interface ResolvedFamily extends FamilyMeta {
  name: string
  core: ResolvedTech[]
  mods: ResolvedModule[]
}

const EMPTY: WorkshopData = {}

function pick(it: WorkshopItem | undefined, lang: Lang, a: 'fr' | 'gFr' | 'dFr', b: 'en' | 'gEn' | 'dEn'): string {
  if (!it) return ''
  return String((lang === 'fr' ? it[a] : it[b]) ?? it[b] ?? it[a] ?? '')
}

/**
 * A handful of catalogue entries are shouted — "DÉFLECTEUR D'ANALYSE DE CARGAISON" among cards that
 * are otherwise sentence case. Lower-casing the tail keeps the grid uniform without touching names
 * that are genuinely capitalised, initialisms included.
 */
function sentenceCase(s: string): string {
  if (!s || s !== s.toLocaleUpperCase() || s.length < 5) return s
  return s.charAt(0) + s.slice(1).toLocaleLowerCase()
}

/**
 * Resolve every family of a workshop kind. Families with no ids in the data still appear, using
 * their curated label and glyph, so the bench never collapses if the dataset is missing.
 */
export function resolveFamilies(
  kind: 'tool' | 'ship',
  data: WorkshopData | undefined,
  lang: Lang,
): ResolvedFamily[] {
  const wd = data || EMPTY
  const items = wd.items || {}
  const groups = wd.families?.[kind] || []
  const byKey: Record<string, WorkshopFamily> = {}
  groups.forEach((g) => { byKey[g.key] = g })

  return familyMeta(kind).map((meta) => {
    const fam = byKey[meta.key]
    const coreIds = fam?.coreIds || []
    const modIds = fam?.modIds || []

    const core: ResolvedTech[] = coreIds.map((id) => {
      const it = items[id]
      const name = sentenceCase(pick(it, lang, 'fr', 'en')) || id
      // a few entries repeat the name into their description and group; showing it three times
      // stacked reads as a rendering fault, so the duplicates are dropped
      const desc = pick(it, lang, 'dFr', 'dEn')
      const group = pick(it, lang, 'gFr', 'gEn')
      return {
        id,
        name,
        desc: desc === name ? '' : desc,
        group: group === name ? '' : sentenceCase(group),
        icon: it?.icon,
        part: PART_OVERRIDE[id] || meta.part,
      }
    })

    const mods: ResolvedModule[] = modIds.map((id, i) => {
      const it = items[id]
      // the generator reads each module's class out of the game data; the positional C/B/A/S/X
      // order is only a fallback for a dataset built before that field existed
      const cl = (fam?.modClasses?.[i] as ClassKey) || TIER_ORDER[i] || 'X'
      return {
        id,
        cl,
        name: sentenceCase(pick(it, lang, 'fr', 'en')) || id,
        icon: it?.icon,
        nanites: it?.v != null ? it.v : null,
        currency: it?.cur || 'Nanites',
        bonus: TIER_BONUS[cl],
        availability: AVAILABILITY[cl][lang === 'fr' ? 0 : 1],
      }
    })

    return {
      ...meta,
      // multitool.json names and colours its own families; ships have no such block in the data
      color: fam?.color || meta.color,
      name: (lang === 'fr' ? fam?.fr : fam?.en) || (lang === 'fr' ? meta.fr : meta.en),
      core,
      mods,
    }
  })
}

/** Family a stat belongs to, for the live estimate. */
export function statsOf(f: ResolvedFamily): { primary: StatKey; secondary: StatKey[] } {
  return { primary: f.primary, secondary: f.secondary || [] }
}
