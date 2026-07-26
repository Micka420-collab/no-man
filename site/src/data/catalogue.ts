/**
 * Curated metadata for the workshop technology families.
 *
 * The *content* — technology names, descriptions, prices, currencies, module classes and item
 * icons — is not written here: it comes from `public/data/workshop.json`, generated from
 * `data/catalogue.json` in the source repo (itself sourced from the community Assistant NMS
 * dataset) by `scripts/build-workshop-data.mjs`. This file only carries what the game data does not
 * model: which family a technology belongs to on the bench, the glyph used in the UI, the part of
 * the 3D model it sits on, and which stat it drives.
 *
 * See `lib/workshopData.ts` for the resolver that joins the two.
 */

export type ClassKey = 'C' | 'B' | 'A' | 'S' | 'X'

export type StatKey =
  | 'dmg' | 'mine' | 'scan' | 'rate' | 'reach'
  | 'shield' | 'hyper' | 'pulse' | 'agility'

/** Anchor on the 3D model that lights up when a family is installed. */
export type PartKey = 'barrel' | 'scope' | 'grip' | 'core' | 'engine' | 'wing' | 'weapon' | 'hull'

export interface Range { min: number; max: number }

export interface FamilyMeta {
  key: string
  /** 24×24 stroke path — drawn until the real item icon loads */
  glyph: string
  /** used only where the dataset declares no colour of its own; multi-tool families do */
  color: string
  /** fallback family label, for the same case — kept in step with multitool.json */
  fr: string
  en: string
  part: PartKey
  primary: StatKey
  /** extra stats the family contributes to, at half weight */
  secondary?: StatKey[]
}

export const STAT_LABEL: Record<StatKey, [string, string]> = {
  dmg: ['DÉGÂTS', 'DAMAGE'],
  mine: ['MINAGE', 'MINING'],
  scan: ['SCANNER', 'SCANNER'],
  rate: ['CADENCE', 'FIRE RATE'],
  reach: ['PORTÉE', 'RANGE'],
  shield: ['BOUCLIER', 'SHIELD'],
  hyper: ['HYPERDRIVE', 'HYPERDRIVE'],
  pulse: ['IMPULSION', 'PULSE'],
  agility: ['MANIABILITÉ', 'AGILITY'],
}

export const STAT_COLOR: Record<StatKey, string> = {
  dmg: '#f05a5a', mine: '#e0a13a', scan: '#5fd0e0', rate: '#ffb347', reach: '#c98af0',
  shield: '#5fd0e0', hyper: '#c98af0', pulse: '#ffb347', agility: '#8bf0a0',
}

/** Where each class of module is sold. */
export const AVAILABILITY: Record<ClassKey, [string, string]> = {
  C: ['Marchand de technologie · station', 'Tech merchant · space station'],
  B: ['Marchand de technologie · station', 'Tech merchant · space station'],
  A: ['Marchand · systèmes développés', 'Merchant · developed systems'],
  S: ['Marchand · systèmes riches, rare', 'Merchant · wealthy systems, rare'],
  X: ['Station hors-la-loi · stats aléatoires', 'Outlaw station · random stats'],
}

/**
 * Fallback module order, for a workshop.json built before classes were written into it.
 * The generator now reads each module's class from the game data — from the explicit "C-Class …"
 * labels where they exist, otherwise from the 60 / 140 / 300 / 480 price ladder — and this ordering
 * is what the two agreed on.
 */
export const TIER_ORDER: ClassKey[] = ['C', 'B', 'A', 'S', 'X']

/**
 * Bonus windows per class, in %. The game data carries prices but not the stat rolls: every module
 * rolls random stats inside a class-dependent window that Hello Games does not publish, so these
 * stay community-observed estimates and the UI labels them as such.
 */
export const TIER_BONUS: Record<ClassKey, Range> = {
  C: { min: 4, max: 9 },
  B: { min: 8, max: 14 },
  A: { min: 13, max: 19 },
  S: { min: 17, max: 24 },
  X: { min: 2, max: 26 },
}

/** Per-technology 3D anchor override, where the family default would be wrong. */
export const PART_OVERRIDE: Record<string, PartKey> = {
  tech62: 'scope',   // Analysis Visor
  tech63: 'scope',   // Scanner
  tech64: 'scope',   // Waveform Recycler
  tech65: 'scope',   // Survey Device
  tech66: 'barrel',  // Terrain Manipulator
  tech67: 'grip',    // Personal Forcefield
  tech204: 'grip',   // Cloaking Device
  tech249: 'barrel', // Runic Lens
  tech28: 'hull',    // Teleport Receiver
  tech39: 'hull',    // Economy Scanner
  tech40: 'hull',    // Conflict Scanner
}

// ─────────────────────────────── MULTI-TOOL ───────────────────────────────

/**
 * Labels and colours here mirror `public/data/multitool.json`, which is the authority: the resolver
 * takes the family name and colour from the dataset and only falls back to these when it is absent.
 */
export const TOOL_META: FamilyMeta[] = [
  { key: 'mining', color: '#e0a13a', fr: "Rayon d'extraction", en: 'Mining Beam',
    part: 'barrel', primary: 'mine', secondary: ['reach'],
    glyph: 'M4 20 14 10M12 4l8 8M14 4l6 6M4 20l2.5-.5.5-2.5' },
  { key: 'scanner', color: '#5fd0e0', fr: 'Scanner & Visière', en: 'Scanner & Visor',
    part: 'scope', primary: 'scan', secondary: ['reach'],
    glyph: 'M12 20a8 8 0 0 1 0-16M12 17a5 5 0 0 1 0-10M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16 6l4-2M16 18l4 2' },
  { key: 'boltcaster', color: '#ff7a1a', fr: 'Fulgurateur', en: 'Boltcaster',
    part: 'barrel', primary: 'dmg', secondary: ['rate'],
    glyph: 'M3 12h11M17 9.5l4 2.5-4 2.5zM6 8v8M9.5 9v6' },
  { key: 'scatter', color: '#f05a5a', fr: 'Fusil à dispersion', en: 'Scatter Blaster',
    part: 'barrel', primary: 'dmg',
    glyph: 'M4 12h4M10 8.5l2.5-1M10 15.5l2.5 1M15 6.5l1.5-1M15 17.5l1.5 1M14 12h6M18 9l2 3-2 3' },
  { key: 'spitter', color: '#c98af0', fr: 'Cracheur à impulsions', en: 'Pulse Spitter',
    part: 'barrel', primary: 'rate', secondary: ['dmg'],
    glyph: 'M3 12h5M11 12h2M16 12h2M20.5 12h.5M7 7.5l1.5 1M7 16.5l1.5-1' },
  { key: 'javelin', color: '#ffd166', fr: 'Javelot incandescent', en: 'Blaze Javelin',
    part: 'barrel', primary: 'dmg', secondary: ['reach'],
    glyph: 'M3 21 21 3M15 3h6v6M9 12l3 3' },
  { key: 'neutron', color: '#7fe08a', fr: 'Canon à neutrons', en: 'Neutron Cannon',
    part: 'barrel', primary: 'dmg', secondary: ['reach'],
    glyph: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M12 3c4.5 4 4.5 14 0 18M12 3c-4.5 4-4.5 14 0 18M3.5 8c5.5-2 11.5-2 17 0M3.5 16c5.5 2 11.5 2 17 0' },
  { key: 'plasma', color: '#f08a3a', fr: 'Lance-plasma', en: 'Plasma Launcher',
    part: 'barrel', primary: 'dmg',
    glyph: 'M12 3c1 3.5 5 4.5 5 9a5 5 0 0 1-10 0c0-4.5 4-5.5 5-9zM12 19a3 3 0 0 0 3-3' },
  { key: 'geology', color: '#b0805a', fr: 'Canon géologique', en: 'Geology Cannon',
    part: 'barrel', primary: 'mine', secondary: ['dmg'],
    glyph: 'M3 19h18L14.5 7 10 14l-2.5-3z' },
  { key: 'utility', color: '#8a96a8', fr: 'Utilitaires & spéciaux', en: 'Utilities & specials',
    part: 'grip', primary: 'reach', secondary: ['scan'],
    glyph: 'M14.4 6.1a4.7 4.7 0 0 0-6 6L3 17.6 6.4 21l5.5-5.5a4.7 4.7 0 0 0 6-6l-3.2 3.2-3.5-3.5 3.2-3.1z' },
]

// ──────────────────────────────── STARSHIP ────────────────────────────────

export const SHIP_META: FamilyMeta[] = [
  { key: 'pulse', color: '#ffb347', fr: 'Pulsoréacteur', en: 'Pulse Engine',
    part: 'engine', primary: 'pulse', secondary: ['agility'],
    glyph: 'M6 5l6 7-6 7M13 5l6 7-6 7' },
  { key: 'launch', color: '#e0a13a', fr: 'Système de décollage', en: 'Launch System',
    part: 'engine', primary: 'agility',
    glyph: 'M12 3c2.5 3 3.5 6.5 3.5 10L12 16l-3.5-3c0-3.5 1-7 3.5-10zM8.5 17 6 21l4-1.5M15.5 17 18 21l-4-1.5M12 10.5h.01' },
  { key: 'hyper', color: '#c98af0', fr: 'Hyperpropulsion', en: 'Hyperdrive',
    part: 'core', primary: 'hyper',
    glyph: 'M12 12a5 5 0 1 1-3.5-4.8M12 12c0-5 3.5-9 8-9M3 21c2.5-3.5 5.5-6.5 9-9' },
  { key: 'shield', color: '#5fd0e0', fr: 'Bouclier déflecteur', en: 'Deflector Shield',
    part: 'hull', primary: 'shield',
    glyph: 'M12 3l8 3.5v5.5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6.5L12 3z' },
  { key: 'photon', color: '#ff7a1a', fr: 'Canon à photons', en: 'Photon Cannon',
    part: 'weapon', primary: 'dmg', secondary: ['rate'],
    glyph: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5' },
  { key: 'phase', color: '#7fe08a', fr: 'Rayon phasique', en: 'Phase Beam',
    part: 'weapon', primary: 'dmg', secondary: ['reach'],
    glyph: 'M3 12h13M16 8.5 21 12l-5 3.5zM6 8.5v7M10 9.5v5' },
  { key: 'positron', color: '#f05a5a', fr: 'Éjecteur à positrons', en: 'Positron Ejector',
    part: 'weapon', primary: 'dmg',
    glyph: 'M4 12h4M12 12h2M11 7l3-1.5M11 17l3 1.5M17 5l3-1.5M17 19l3 1.5M17 12h4' },
  { key: 'infra', color: '#ffd166', fr: 'Accélérateur infra-couteau', en: 'Infra-Knife Accelerator',
    part: 'weapon', primary: 'rate', secondary: ['dmg'],
    glyph: 'M4 18 14 6l2 2-8 11zM14 6l2-3 3 2-3 3M6 20l3-2' },
  { key: 'cyclotron', color: '#6aa9ff', fr: 'Baliste cyclotron', en: 'Cyclotron Ballista',
    part: 'weapon', primary: 'dmg',
    glyph: 'M12 12a3 3 0 1 1-2.1-2.9M12 12c0-4 2.5-7 6-8M12 12c0 4-2.5 7-6 8M20 4c-1 6-4 10-9 12' },
  { key: 'rockets', color: '#b0805a', fr: 'Lance-roquettes', en: 'Rocket Launcher',
    part: 'weapon', primary: 'dmg',
    glyph: 'M12 3c2.5 3 3.5 6.5 3.5 10L12 16l-3.5-3c0-3.5 1-7 3.5-10zM12 9.5h.01M9 18l-2 3 3-1M15 18l2 3-3-1' },
  { key: 'sutility', color: '#8a96a8', fr: 'Utilitaires', en: 'Utilities',
    part: 'hull', primary: 'scan',
    glyph: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6.5 6.5a8 8 0 0 0 0 11M17.5 6.5a8 8 0 0 1 0 11M4 4a11.5 11.5 0 0 0 0 16M20 4a11.5 11.5 0 0 1 0 16' },
]

export function familyMeta(kind: 'tool' | 'ship'): FamilyMeta[] {
  return kind === 'tool' ? TOOL_META : SHIP_META
}

/** Base 0–5 profile per multi-tool type / starship archetype. */
export const TOOL_PROFILE: Record<string, Partial<Record<StatKey, number>>> = {
  pistol: { dmg: 0, mine: 5, scan: 2, rate: 2, reach: 2 },
  rifle: { dmg: 2, mine: 2, scan: 2, rate: 3, reach: 3 },
  experimental: { dmg: 1, mine: 2, scan: 5, rate: 2, reach: 3 },
  alien: { dmg: 4, mine: 3, scan: 3, rate: 3, reach: 3 },
  royal: { dmg: 3, mine: 3, scan: 5, rate: 3, reach: 4 },
  sentinel: { dmg: 4, mine: 2, scan: 2, rate: 4, reach: 3 },
  atlantid: { dmg: 3, mine: 5, scan: 2, rate: 2, reach: 3 },
  staff: { dmg: 4, mine: 2, scan: 3, rate: 3, reach: 4 },
}

export const SHIP_PROFILE: Record<string, Partial<Record<StatKey, number>>> = {
  fighter: { dmg: 5, shield: 2, hyper: 1, agility: 4, pulse: 3 },
  hauler: { dmg: 1, shield: 5, hyper: 2, agility: 1, pulse: 2 },
  explorer: { dmg: 1, shield: 1, hyper: 5, agility: 3, pulse: 3 },
  shuttle: { dmg: 2, shield: 2, hyper: 2, agility: 2, pulse: 2 },
  exotic: { dmg: 4, shield: 4, hyper: 4, agility: 5, pulse: 4 },
  solar: { dmg: 3, shield: 2, hyper: 2, agility: 5, pulse: 5 },
  interceptor: { dmg: 5, shield: 3, hyper: 1, agility: 3, pulse: 4 },
  living: { dmg: 3, shield: 3, hyper: 4, agility: 3, pulse: 3 },
  freighter: { dmg: 1, shield: 4, hyper: 3, agility: 1, pulse: 1 },
  corvette: { dmg: 3, shield: 3, hyper: 3, agility: 2, pulse: 3 },
}

/**
 * Base hyperdrive range per starship archetype, in light years — the one ship stat the game
 * shows as a hard number. Community-observed order of magnitude for a fully-fuelled drive.
 */
export const BASE_HYPERDRIVE_LY: Record<string, number> = {
  fighter: 100, hauler: 150, explorer: 300, shuttle: 150, exotic: 250,
  solar: 200, interceptor: 100, living: 250, freighter: 200, corvette: 200,
}

/** Class multiplier applied to the hull/frame itself (C → S). */
export const CLASS_MULT: Record<string, number> = { C: 1, B: 1.1, A: 1.2, S: 1.35 }

/**
 * Starship tech-inventory rules.
 *
 * `multitool.json` ships a `rules` block that the multi-tool bench reads directly; `ships.json` has
 * no equivalent, so the starship numbers live here. A starship's technology inventory is a fixed
 * 30 slots regardless of class, and the class decides only how many of them are supercharged.
 */
export const SHIP_TECH_SLOTS = 30
export const SHIP_SC_BY_CLASS: Record<string, number> = { C: 1, B: 2, A: 3, S: 4 }

/** A tech installed in a supercharged slot is worth roughly half again as much. */
export const SUPERCHARGE_MULT = 1.5

/** Each neighbouring tech of the same family adds this much, in %. */
export const ADJACENCY_BONUS = 5

/** Maximum upgrade modules of one family before the whole family shuts down. */
export const MODULE_LIMIT = 3
