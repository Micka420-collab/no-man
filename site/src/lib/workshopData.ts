import type { Lang } from '../types'
import {
  AVAILABILITY, PART_OVERRIDE, TIER_BONUS, TIER_ORDER, familyMeta,
  type ClassKey, type FamilyMeta, type PartKey, type Range, type StatKey,
} from '../data/catalogue'

/**
 * Joins the curated family metadata with the game's own item data.
 *
 * `public/data/workshop.json` is generated from `data/catalogue.json` in the source repo — the
 * Assistant NMS dataset — so technology names, descriptions, nanite prices and item icons are the
 * game's, not hand-written. Family membership comes from `multitool.json` for the multi-tool and
 * from the resolved starship technology ids for ships.
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

export interface WorkshopData {
  families?: { tool?: { key: string; coreIds: string[]; modIds: string[] }[]; ship?: { key: string; coreIds: string[]; modIds: string[] }[] }
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
  const byKey: Record<string, { coreIds: string[]; modIds: string[] }> = {}
  groups.forEach((g) => { byKey[g.key] = { coreIds: g.coreIds || [], modIds: g.modIds || [] } })

  return familyMeta(kind).map((meta) => {
    const ids = byKey[meta.key] || { coreIds: [], modIds: [] }

    const core: ResolvedTech[] = ids.coreIds.map((id) => {
      const it = items[id]
      return {
        id,
        name: pick(it, lang, 'fr', 'en') || id,
        desc: pick(it, lang, 'dFr', 'dEn'),
        group: pick(it, lang, 'gFr', 'gEn'),
        icon: it?.icon,
        part: PART_OVERRIDE[id] || meta.part,
      }
    })

    // module ids arrive as C, B, A, S then the "suspicious" X variant
    const mods: ResolvedModule[] = ids.modIds.map((id, i) => {
      const it = items[id]
      const cl = TIER_ORDER[i] || 'X'
      return {
        id,
        cl,
        name: pick(it, lang, 'fr', 'en') || id,
        icon: it?.icon,
        nanites: it?.v != null ? it.v : null,
        currency: it?.cur || 'Nanites',
        bonus: TIER_BONUS[cl],
        availability: AVAILABILITY[cl][lang === 'fr' ? 0 : 1],
      }
    })

    return {
      ...meta,
      name: (lang === 'fr' ? meta.fr : meta.en),
      core,
      mods,
    }
  })
}

/** Family a stat belongs to, for the live estimate. */
export function statsOf(f: ResolvedFamily): { primary: StatKey; secondary: StatKey[] } {
  return { primary: f.primary, secondary: f.secondary || [] }
}
