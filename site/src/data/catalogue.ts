import type { Lang } from '../types'

/**
 * Technology catalogue for the multi-tool and starship workshops.
 *
 * Names, families and slot rules follow the game. Nanite prices and bonus percentages are
 * community-observed *ranges*: in No Man's Sky every upgrade module rolls random stats inside a
 * class-dependent window, and Hello Games does not publish the exact tables — the UI labels these
 * values as estimates rather than presenting them as exact.
 *
 * If `data/catalogue.json` (generated in the source repo) is ever dropped into `public/data/`,
 * `resolveIcon()` in the workshop picks up the real item icons automatically.
 */

export type ClassKey = 'C' | 'B' | 'A' | 'S' | 'X'

export type StatKey =
  | 'dmg' | 'mine' | 'scan' | 'rate' | 'reach'
  | 'shield' | 'hyper' | 'pulse' | 'agility'

/** Anchor on the 3D model that lights up when a family is installed. */
export type PartKey = 'barrel' | 'scope' | 'grip' | 'core' | 'engine' | 'wing' | 'weapon' | 'hull'

export interface Range { min: number; max: number }

export interface Tier {
  cl: ClassKey
  /** typical nanite price at a tech merchant */
  nanites: Range
  /** typical bonus applied to the family's primary stat, in % */
  bonus: Range
}

export interface CoreTech {
  id: string
  fr: string
  en: string
  dFr: string
  dEn: string
  part: PartKey
  /** how you obtain it in game */
  srcFr: string
  srcEn: string
}

export interface Family {
  key: string
  emoji: string
  color: string
  fr: string
  en: string
  part: PartKey
  primary: StatKey
  /** extra stats the family contributes to, at half weight */
  secondary?: StatKey[]
  core: CoreTech[]
  /** null when the family has no upgrade modules (unique technologies) */
  module: { fr: string; en: string; tiers: Tier[] } | null
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

/** Weapon-grade module tiers (damage-oriented families). */
const WEAPON_TIERS: Tier[] = [
  { cl: 'C', nanites: { min: 80, max: 160 }, bonus: { min: 4, max: 9 } },
  { cl: 'B', nanites: { min: 150, max: 320 }, bonus: { min: 8, max: 14 } },
  { cl: 'A', nanites: { min: 320, max: 600 }, bonus: { min: 13, max: 19 } },
  { cl: 'S', nanites: { min: 600, max: 1000 }, bonus: { min: 17, max: 24 } },
  { cl: 'X', nanites: { min: 400, max: 900 }, bonus: { min: 2, max: 26 } },
]

/** Utility/mobility module tiers — cheaper, smaller windows. */
const UTIL_TIERS: Tier[] = [
  { cl: 'C', nanites: { min: 60, max: 130 }, bonus: { min: 3, max: 7 } },
  { cl: 'B', nanites: { min: 130, max: 260 }, bonus: { min: 6, max: 11 } },
  { cl: 'A', nanites: { min: 260, max: 500 }, bonus: { min: 10, max: 16 } },
  { cl: 'S', nanites: { min: 500, max: 900 }, bonus: { min: 15, max: 21 } },
  { cl: 'X', nanites: { min: 350, max: 800 }, bonus: { min: 2, max: 23 } },
]

// ─────────────────────────────── MULTI-TOOL ───────────────────────────────

export const TOOL_FAMILIES: Family[] = [
  {
    key: 'mining', emoji: '⛏️', color: '#e0a13a', fr: "Rayon d'extraction", en: 'Mining Beam',
    part: 'barrel', primary: 'mine', secondary: ['reach'],
    core: [
      { id: 'mining-beam', fr: "Rayon d'extraction", en: 'Mining Beam', part: 'barrel',
        dFr: "Le laser de base : extrait ressources et minerais, chauffe puis se coupe s'il n'est pas géré.",
        dEn: 'The base laser: harvests resources and ore, overheats and cuts out if mismanaged.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'advanced-mining', fr: "Laser d'extraction avancé", en: 'Advanced Mining Laser', part: 'barrel',
        dFr: 'Augmente fortement le rendement de minage et réduit la surchauffe.',
        dEn: 'Sharply raises mining yield and reduces overheating.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'optical-drill', fr: 'Foreuse optique', en: 'Optical Drill', part: 'barrel',
        dFr: 'Rendement supplémentaire sur chaque dépôt miné.',
        dEn: 'Extra yield from every deposit mined.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'runic-lens', fr: 'Lentille runique', en: 'Runic Lens', part: 'barrel',
        dFr: 'Lentille d’origine atlantide : bonus de minage majeur, exige du multi-outil de classe supérieure.',
        dEn: 'Atlantid lens: major mining bonus, wants a higher-class tool.',
        srcFr: 'Plan · récompense d’expédition', srcEn: 'Blueprint · expedition reward' },
    ],
    module: { fr: "Module d'extraction", en: 'Mining Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'scanner', emoji: '📡', color: '#5fd0e0', fr: 'Scanner', en: 'Scanner',
    part: 'scope', primary: 'scan', secondary: ['reach'],
    core: [
      { id: 'scanner', fr: 'Scanner', en: 'Scanner', part: 'scope',
        dFr: 'Impulsion qui révèle ressources, faune et points d’intérêt autour de toi.',
        dEn: 'Pulse that reveals resources, fauna and points of interest around you.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'analysis-visor', fr: "Visière d'analyse", en: 'Analysis Visor', part: 'scope',
        dFr: 'Identifie faune, flore et minéraux — chaque découverte rapporte des unités.',
        dEn: 'Identifies fauna, flora and minerals — each discovery pays units.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'waveform-recycler', fr: "Recycleur d'ondes", en: 'Waveform Recycler', part: 'scope',
        dFr: 'Réduit fortement le temps de recharge du scanner.',
        dEn: 'Sharply cuts scanner recharge time.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'scanner-harmoniser', fr: 'Harmoniseur de scanner', en: 'Scanner Harmoniser', part: 'scope',
        dFr: 'Augmente la portée du scanner et la valeur des découvertes.',
        dEn: 'Boosts scanner range and discovery value.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'survey-device', fr: 'Appareil de prospection', en: 'Survey Device', part: 'scope',
        dFr: 'Traque un type de ressource précis et guide vers les enterrés.',
        dEn: 'Tracks a chosen resource type and guides you to buried caches.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de scanner', en: 'Scanner Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'boltcaster', emoji: '🔫', color: '#ff7a1a', fr: 'Fulgurateur', en: 'Boltcaster',
    part: 'barrel', primary: 'dmg', secondary: ['rate'],
    core: [
      { id: 'boltcaster', fr: 'Fulgurateur', en: 'Boltcaster', part: 'barrel',
        dFr: 'Arme automatique polyvalente, chargeur large, dégâts moyens.',
        dEn: 'All-round automatic weapon, big clip, medium damage.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'barrel-ioniser', fr: 'Ioniseur de canon', en: 'Barrel Ioniser', part: 'barrel',
        dFr: 'Améliore dégâts et précision du Fulgurateur.',
        dEn: 'Improves Boltcaster damage and accuracy.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'ricochet-module-bc', fr: 'Module ricochet', en: 'Ricochet Module', part: 'barrel',
        dFr: 'Les projectiles rebondissent sur les surfaces.',
        dEn: 'Projectiles bounce off surfaces.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de fulgurateur', en: 'Boltcaster Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'scatter', emoji: '💥', color: '#f05a5a', fr: 'Fusil à dispersion', en: 'Scatter Blaster',
    part: 'barrel', primary: 'dmg', secondary: [],
    core: [
      { id: 'scatter-blaster', fr: 'Fusil à dispersion', en: 'Scatter Blaster', part: 'barrel',
        dFr: 'Fusil à pompe : dégâts énormes à bout portant, inutile à distance.',
        dEn: 'Shotgun: enormous point-blank damage, useless at range.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'shell-greaser', fr: 'Graisseur de cartouches', en: 'Shell Greaser', part: 'barrel',
        dFr: 'Accélère nettement le rechargement.',
        dEn: 'Markedly speeds up reloading.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de dispersion', en: 'Scatter Blaster Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'spitter', emoji: '🔥', color: '#ffb347', fr: 'Cracheur à impulsions', en: 'Pulse Spitter',
    part: 'barrel', primary: 'rate', secondary: ['dmg'],
    core: [
      { id: 'pulse-spitter', fr: 'Cracheur à impulsions', en: 'Pulse Spitter', part: 'barrel',
        dFr: 'Cadence de tir très élevée, consomme beaucoup de munitions.',
        dEn: 'Very high rate of fire, burns through ammo.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'impact-igniter', fr: 'Allumeur à impact', en: 'Impact Igniter', part: 'barrel',
        dFr: 'Les projectiles enflamment la cible.',
        dEn: 'Rounds set the target on fire.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'ricochet-module-ps', fr: 'Module ricochet', en: 'Ricochet Module', part: 'barrel',
        dFr: 'Les projectiles rebondissent sur les surfaces.',
        dEn: 'Projectiles bounce off surfaces.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de cracheur', en: 'Pulse Spitter Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'javelin', emoji: '🎯', color: '#c98af0', fr: 'Javelot incandescent', en: 'Blaze Javelin',
    part: 'barrel', primary: 'dmg', secondary: ['reach'],
    core: [
      { id: 'blaze-javelin', fr: 'Javelot incandescent', en: 'Blaze Javelin', part: 'barrel',
        dFr: 'Fusil de précision à charge : un tir chargé pulvérise une cible unique.',
        dEn: 'Charged sniper rifle: one charged shot obliterates a single target.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'waveform-oscillator', fr: "Oscillateur d'ondes", en: 'Waveform Oscillator', part: 'barrel',
        dFr: 'Charge plus rapide et dégâts accrus.',
        dEn: 'Faster charge and higher damage.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'mass-accelerator', fr: 'Accélérateur de masse', en: 'Mass Accelerator', part: 'barrel',
        dFr: 'Le tir traverse les cibles alignées.',
        dEn: 'Shots punch through lined-up targets.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de javelot', en: 'Blaze Javelin Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'neutron', emoji: '☢️', color: '#8bf0a0', fr: 'Canon à neutrons', en: 'Neutron Cannon',
    part: 'barrel', primary: 'dmg', secondary: ['reach'],
    core: [
      { id: 'neutron-cannon', fr: 'Canon à neutrons', en: 'Neutron Cannon', part: 'barrel',
        dFr: 'Tir à charge dévastateur en zone, se recharge sur les ressources minées.',
        dEn: 'Devastating charged area shot, recharges from mined resources.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'p-field-compressor', fr: 'Compresseur de champ P', en: 'P-Field Compressor', part: 'barrel',
        dFr: 'Réduit le temps de charge et augmente la zone d’effet.',
        dEn: 'Cuts charge time and widens the blast.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de neutrons', en: 'Neutron Cannon Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'plasma', emoji: '🧨', color: '#b0805a', fr: 'Lance-plasma', en: 'Plasma Launcher',
    part: 'barrel', primary: 'dmg', secondary: [],
    core: [
      { id: 'plasma-launcher', fr: 'Lance-plasma', en: 'Plasma Launcher', part: 'barrel',
        dFr: 'Grenades à plasma : creusent le terrain et arrachent les structures.',
        dEn: 'Plasma grenades: dig terrain and tear through structures.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
    ],
    module: { fr: 'Module de plasma', en: 'Plasma Launcher Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'geology', emoji: '🪨', color: '#8a96a8', fr: 'Canon géologique', en: 'Geology Cannon',
    part: 'barrel', primary: 'mine', secondary: ['dmg'],
    core: [
      { id: 'geology-cannon', fr: 'Canon géologique', en: 'Geology Cannon', part: 'barrel',
        dFr: 'Fait exploser le terrain et libère les ressources enfouies en masse.',
        dEn: 'Blows up terrain and frees buried resources in bulk.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
    ],
    module: { fr: 'Module géologique', en: 'Geology Cannon Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'utility', emoji: '🛠️', color: '#6aa9ff', fr: 'Utilitaires', en: 'Utilities',
    part: 'grip', primary: 'reach', secondary: ['scan'],
    core: [
      { id: 'terrain-manipulator', fr: 'Manipulateur de terrain', en: 'Terrain Manipulator', part: 'barrel',
        dFr: 'Creuse, sculpte et restaure le terrain — indispensable pour les bases et les grottes.',
        dEn: 'Digs, sculpts and restores terrain — essential for bases and caves.',
        srcFr: 'Plan · quête principale', srcEn: 'Blueprint · main quest' },
      { id: 'personal-forcefield', fr: 'Champ de force personnel', en: 'Personal Forcefield', part: 'grip',
        dFr: 'Bouclier frontal qui absorbe les tirs pendant que tu ripostes.',
        dEn: 'Frontal shield that soaks incoming fire while you return it.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'combat-scope', fr: 'Lunette de combat', en: 'Combat Scope', part: 'scope',
        dFr: 'Zoom de visée et précision accrue sur toutes les armes.',
        dEn: 'Aim zoom and better accuracy on every weapon.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'cloaking-device', fr: "Dispositif d'occultation", en: 'Cloaking Device', part: 'grip',
        dFr: 'Rend invisible aux sentinelles pendant un court instant.',
        dEn: 'Turns you invisible to Sentinels for a short while.',
        srcFr: 'Plan · récompense sentinelle', srcEn: 'Blueprint · Sentinel reward' },
      { id: 'paralysis-mortar', fr: 'Mortier paralysant', en: 'Paralysis Mortar', part: 'barrel',
        dFr: 'Onde de choc qui immobilise les ennemis proches.',
        dEn: 'Shockwave that freezes nearby enemies.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'fishing-rig', fr: 'Kit de pêche', en: 'Fishing Rig', part: 'grip',
        dFr: 'Transforme le multi-outil en canne à pêche.',
        dEn: 'Turns the multi-tool into a fishing rod.',
        srcFr: 'Plan · quête pêche', srcEn: 'Blueprint · fishing quest' },
    ],
    module: null,
  },
]

// ──────────────────────────────── STARSHIP ────────────────────────────────

export const SHIP_FAMILIES: Family[] = [
  {
    key: 'pulse', emoji: '🔥', color: '#ffb347', fr: 'Moteur à impulsion', en: 'Pulse Engine',
    part: 'engine', primary: 'pulse', secondary: ['agility'],
    core: [
      { id: 'pulse-engine', fr: 'Moteur à impulsion', en: 'Pulse Engine', part: 'engine',
        dFr: 'Vol interplanétaire à haute vitesse à l’intérieur d’un système.',
        dEn: 'High-speed interplanetary flight inside a system.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'photonix-core', fr: 'Cœur photonix', en: 'Photonix Core', part: 'engine',
        dFr: 'Impulsion plus rapide et recharge gratuite près d’une étoile.',
        dEn: 'Faster pulse and free recharge close to a star.',
        srcFr: 'Plan · quête Anomalie', srcEn: 'Blueprint · Anomaly quest' },
      { id: 'instability-drive', fr: 'Réacteur d’instabilité', en: 'Instability Drive', part: 'engine',
        dFr: 'Vitesse d’impulsion accrue au prix d’une consommation plus élevée.',
        dEn: 'Higher pulse speed at the cost of fuel burn.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module d’impulsion', en: 'Pulse Engine Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'launch', emoji: '🛫', color: '#e0a13a', fr: 'Système de décollage', en: 'Launch System',
    part: 'engine', primary: 'agility', secondary: [],
    core: [
      { id: 'launch-thruster', fr: 'Propulseur de décollage', en: 'Launch Thruster', part: 'engine',
        dFr: 'Décollage depuis une planète — consomme du plutonium/tritium.',
        dEn: 'Lifts off from a planet — burns launch fuel.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'launch-recharger', fr: 'Recharge du système de décollage', en: 'Launch System Recharger', part: 'engine',
        dFr: 'Recharge le décollage automatiquement au soleil.',
        dEn: 'Recharges launch fuel automatically in sunlight.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'efficient-thrusters', fr: 'Propulseurs économiques', en: 'Efficient Thrusters', part: 'engine',
        dFr: 'Réduit fortement le carburant consommé au décollage.',
        dEn: 'Sharply reduces launch fuel usage.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de décollage', en: 'Launch Thruster Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'hyper', emoji: '🌌', color: '#c98af0', fr: 'Hyperpropulseur', en: 'Hyperdrive',
    part: 'core', primary: 'hyper', secondary: [],
    core: [
      { id: 'hyperdrive', fr: 'Hyperpropulseur', en: 'Hyperdrive', part: 'core',
        dFr: 'Saut entre systèmes stellaires — la base de toute exploration.',
        dEn: 'Jump between star systems — the basis of all exploration.',
        srcFr: 'Quête principale', srcEn: 'Main quest' },
      { id: 'cadmium-drive', fr: 'Réacteur cadmium', en: 'Cadmium Drive', part: 'core',
        dFr: 'Débloque les systèmes rouges.',
        dEn: 'Unlocks red systems.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'emeril-drive', fr: 'Réacteur émeril', en: 'Emeril Drive', part: 'core',
        dFr: 'Débloque les systèmes verts.',
        dEn: 'Unlocks green systems.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'indium-drive', fr: 'Réacteur indium', en: 'Indium Drive', part: 'core',
        dFr: 'Débloque les systèmes bleus.',
        dEn: 'Unlocks blue systems.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'emergency-warp', fr: 'Unité de saut d’urgence', en: 'Emergency Warp Unit', part: 'core',
        dFr: 'Permet de fuir un combat par un saut immédiat.',
        dEn: 'Lets you escape a fight with an immediate warp.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module d’hyperpropulseur', en: 'Hyperdrive Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'shield', emoji: '🛡️', color: '#5fd0e0', fr: 'Bouclier déflecteur', en: 'Deflector Shield',
    part: 'hull', primary: 'shield', secondary: [],
    core: [
      { id: 'deflector-shield', fr: 'Bouclier déflecteur', en: 'Deflector Shield', part: 'hull',
        dFr: 'Absorbe les tirs ennemis et les impacts d’astéroïdes.',
        dEn: 'Soaks enemy fire and asteroid impacts.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
      { id: 'ablative-armour', fr: 'Blindage ablatif', en: 'Ablative Armour', part: 'hull',
        dFr: 'Couche de coque supplémentaire sous le bouclier.',
        dEn: 'Extra hull layer underneath the shield.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de bouclier', en: 'Shield Upgrade', tiers: UTIL_TIERS },
  },
  {
    key: 'photon', emoji: '💥', color: '#ff7a1a', fr: 'Canon à photons', en: 'Photon Cannon',
    part: 'weapon', primary: 'dmg', secondary: ['rate'],
    core: [
      { id: 'photon-cannon', fr: 'Canon à photons', en: 'Photon Cannon', part: 'weapon',
        dFr: 'Arme de vaisseau standard, équilibrée, sans munitions.',
        dEn: 'Standard ship weapon, balanced, no ammo.',
        srcFr: 'Installé d’origine', srcEn: 'Installed by default' },
    ],
    module: { fr: 'Module de canon à photons', en: 'Photon Cannon Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'phase', emoji: '🔆', color: '#7fe08a', fr: 'Rayon de phase', en: 'Phase Beam',
    part: 'weapon', primary: 'dmg', secondary: ['reach'],
    core: [
      { id: 'phase-beam', fr: 'Rayon de phase', en: 'Phase Beam', part: 'weapon',
        dFr: 'Laser continu, excellent contre les boucliers, mine les astéroïdes.',
        dEn: 'Continuous laser, great against shields, mines asteroids.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'fourier-delimiter', fr: 'Dé-limiteur de Fourier', en: 'Fourier De-Limiter', part: 'weapon',
        dFr: 'Augmente les dégâts et réduit la surchauffe du rayon.',
        dEn: 'Raises damage and cuts beam overheating.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: { fr: 'Module de rayon de phase', en: 'Phase Beam Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'positron', emoji: '✴️', color: '#f05a5a', fr: 'Éjecteur de positrons', en: 'Positron Ejector',
    part: 'weapon', primary: 'dmg', secondary: [],
    core: [
      { id: 'positron-ejector', fr: 'Éjecteur de positrons', en: 'Positron Ejector', part: 'weapon',
        dFr: 'Fusil à pompe spatial : dégâts massifs à courte portée.',
        dEn: 'Space shotgun: massive damage at close range.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
    ],
    module: { fr: 'Module de positrons', en: 'Positron Ejector Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'infra', emoji: '🗡️', color: '#ffd166', fr: 'Accélérateur infra-lame', en: 'Infra-Knife Accelerator',
    part: 'weapon', primary: 'rate', secondary: ['dmg'],
    core: [
      { id: 'infra-knife', fr: 'Accélérateur infra-lame', en: 'Infra-Knife Accelerator', part: 'weapon',
        dFr: 'Mitrailleuse à très haute cadence — le DPS le plus élevé une fois modulée.',
        dEn: 'Very high rate-of-fire cannon — the top DPS once modded.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
    ],
    module: { fr: 'Module infra-lame', en: 'Infra-Knife Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'cyclotron', emoji: '🌀', color: '#6aa9ff', fr: 'Baliste cyclotron', en: 'Cyclotron Ballista',
    part: 'weapon', primary: 'dmg', secondary: [],
    core: [
      { id: 'cyclotron', fr: 'Baliste cyclotron', en: 'Cyclotron Ballista', part: 'weapon',
        dFr: 'Projectiles lourds à forte pénétration de bouclier.',
        dEn: 'Heavy projectiles with strong shield penetration.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
    ],
    module: { fr: 'Module de baliste', en: 'Cyclotron Upgrade', tiers: WEAPON_TIERS },
  },
  {
    key: 'rockets', emoji: '🚀', color: '#b0805a', fr: 'Lance-roquettes', en: 'Rocket Launcher',
    part: 'weapon', primary: 'dmg', secondary: [],
    core: [
      { id: 'rocket-launcher', fr: 'Lance-roquettes', en: 'Rocket Launcher', part: 'weapon',
        dFr: 'Roquettes à munitions, gros dégâts par tir contre les cargos.',
        dEn: 'Ammo-fed rockets, big per-shot damage against freighters.',
        srcFr: 'Plan · marchand de technologie', srcEn: 'Blueprint · tech merchant' },
      { id: 'large-rocket', fr: 'Grande soute à roquettes', en: 'Large Rocket Tubes', part: 'weapon',
        dFr: 'Augmente la réserve de roquettes embarquée.',
        dEn: 'Increases carried rocket capacity.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
    ],
    module: null,
  },
  {
    key: 'sutility', emoji: '📡', color: '#8a96a8', fr: 'Utilitaires', en: 'Utilities',
    part: 'hull', primary: 'scan', secondary: [],
    core: [
      { id: 'teleport-receiver', fr: 'Récepteur de téléportation', en: 'Teleport Receiver', part: 'hull',
        dFr: 'Téléporte vers le vaisseau depuis une base ou une station.',
        dEn: 'Teleport to the ship from a base or station.',
        srcFr: 'Plan · Anomalie spatiale', srcEn: 'Blueprint · Space Anomaly' },
      { id: 'economy-scanner', fr: 'Scanner économique', en: 'Economy Scanner', part: 'hull',
        dFr: 'Affiche la richesse des systèmes sur la carte galactique.',
        dEn: 'Shows system wealth on the galaxy map.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'conflict-scanner', fr: 'Scanner de conflit', en: 'Conflict Scanner', part: 'hull',
        dFr: 'Affiche le niveau de conflit des systèmes.',
        dEn: 'Shows system conflict level.',
        srcFr: 'Plan · marchand', srcEn: 'Blueprint · merchant' },
      { id: 'cargo-deflector', fr: 'Déflecteur de scan de cargaison', en: 'Cargo Scan Deflector', part: 'hull',
        dFr: 'Masque la contrebande aux scans des sentinelles spatiales.',
        dEn: 'Hides contraband from space Sentinel scans.',
        srcFr: 'Plan · station hors-la-loi', srcEn: 'Blueprint · outlaw station' },
    ],
    module: null,
  },
]

export function families(kind: 'tool' | 'ship'): Family[] {
  return kind === 'tool' ? TOOL_FAMILIES : SHIP_FAMILIES
}

export function famName(f: Family, lang: Lang): string {
  return lang === 'fr' ? f.fr : f.en
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

/** Class multiplier applied to the hull/frame itself (C → S). */
export const CLASS_MULT: Record<string, number> = { C: 1, B: 1.1, A: 1.2, S: 1.35 }

/** A tech installed in a supercharged slot is worth roughly half again as much. */
export const SUPERCHARGE_MULT = 1.5

/** Each neighbouring tech of the same family adds this much, in %. */
export const ADJACENCY_BONUS = 5

/** Maximum upgrade modules of one family before the whole family shuts down. */
export const MODULE_LIMIT = 3
