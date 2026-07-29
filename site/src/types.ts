/** Shapes of the JSON payloads served from /data — mirrors the Micka420-collab/no-man repo. */

export type Lang = 'fr' | 'en'

export type Tab =
  | 'accueil' | 'direct' | 'progress'
  | 'ships' | 'fauna' | 'galaxies' | 'elements' | 'multitool'
  | 'expeditions' | 'war' | 'updates'
  | 'guides' | 'database' | 'recipes' | 'portal'

export interface Stats {
  player_count?: number
  reviews?: { total?: number; positive?: number; percent_positive?: number; score_desc?: string }
  price?: { final?: string; initial?: string; discount_percent?: number }
  peak_24h?: number
  peak_all?: number
  updated_at?: string
}

export interface StatsHistory { points?: { t: string; players: number }[] }

export interface TimelineItem {
  version?: string; name?: string; name_en?: string; date?: string; url?: string
  desc?: string; desc_en?: string
}

export interface Expedition {
  num: number; name: string; start: string; end: string
  theme_fr?: string; theme_en?: string
}

export interface Ship {
  id: string; icon?: string; image?: string; rarity?: number
  name_fr?: string; name_en?: string; bonus_fr?: string; bonus_en?: string
  price_fr?: string; price_en?: string; find_fr?: string; find_en?: string
  build_fr?: string; build_en?: string
}

export interface UpgradeGuide {
  title_fr?: string; title_en?: string; intro_fr?: string; intro_en?: string
  steps?: { icon?: string; title_fr?: string; title_en?: string; body_fr?: string; body_en?: string }[]
}

export interface Harvest {
  method_fr?: string; method_en?: string; item_fr?: string; item_en?: string; icon?: string
}

export interface Creature {
  type: string; name_fr?: string; name_en?: string; emoji?: string
  example?: string; wiki?: string; image?: string; harvests?: Harvest[]
}

export interface Galaxy { n: number; name: string; type: 'norm' | 'lush' | 'harsh' | 'empty' }

export interface GalaxyHub {
  pop: number; tag_fr?: string; tag_en?: string; civ_fr?: string; civ_en?: string
  desc_fr?: string; desc_en?: string; civs?: string[]
}

export interface ElementFamily { fr: string; en: string; color: string }
export interface ElementCell { raw: string; sym: string }
export interface ElementColumn { head_fr: string; head_en: string; fam: string; cells: ElementCell[] }
export interface ElementRow { key: string; fr: string; en: string; cells: ElementCell[] }
export interface ElementsData {
  families?: Record<string, ElementFamily>
  columns?: ElementColumn[]
  flora?: { fr: string; en: string; color: string; cells: ElementCell[] }
  /** full-width sections added after the periodic columns (waste, lore substances…) */
  extra_rows?: ElementRow[]
}

export interface MarketItem {
  id: string; name_fr?: string; name_en?: string; value?: number; icon?: string
  group_fr?: string; group_en?: string; cat?: string
  /** every catalogued item is priced in credits today, but the data names the currency per item */
  currency?: string
}
export interface FishItem {
  name_en: string; name_fr?: string
  quality?: string; size?: string; time?: string
  storm?: boolean; mission?: boolean
  biomes?: string[]; value?: number; icon?: string
}
export interface MarketData { categories?: Record<string, MarketItem[]>; fish?: FishItem[] }

export interface RedditPost { title: string; title_fr?: string; url: string; date: string; author?: string }
export interface CommunityData {
  top_week?: RedditPost[]; hot?: RedditPost[]; coordinates?: RedditPost[]; french?: RedditPost[]
}

export interface NewsItem {
  title: string; url: string; date: string; source?: string; excerpt?: string
  /** true for Hello Games' own community announcements, false for third-party press */
  is_official?: boolean
}
export interface VideoItem {
  title: string; url: string; channel?: string; thumbnail?: string; views?: number; date?: string
}
export interface Achievement { percent: number; name: string; desc: string; name_en?: string; desc_en?: string }
export interface Challenge { id: string; icon: string; diff: number; fr: string; en: string }

export interface ProgressCategory {
  id: string; title: string; title_en?: string; icon?: string
  items?: { id: string; label: string; label_en?: string }[]
}

export interface Guide {
  id: string; icon?: string; name_fr?: string; name_en?: string; intro_fr?: string; intro_en?: string
  sections?: { icon?: string; title_fr?: string; title_en?: string; items?: { fr: string; en: string }[] }[]
}

export interface Mission {
  id: string; cat: string; icon?: string
  name_fr?: string; name_en?: string; goal_fr?: string; goal_en?: string
  steps?: { fr: string; en: string }[]
  rewards_fr?: string; rewards_en?: string
  hidden?: { fr: string; en: string }[]
  wiki?: string
}

export interface MissionsData {
  secret16?: {
    title_fr?: string; title_en?: string; lead_fr?: string; lead_en?: string
    quote_fr?: string; quote_en?: string; quote_src?: string
    facts?: { fr: string; en: string }[]; npc_fr?: string; npc_en?: string
  }
  easter?: {
    title_fr?: string; title_en?: string; lead_fr?: string; lead_en?: string
    refs?: { fr: string; en: string }[]; lore?: { fr: string; en: string }[]
  }
  categories?: Record<string, { fr: string; en: string; icon?: string }>
  missions?: Mission[]
}

/** recipes.json — `items` is a dictionary keyed by item id (raw12, cook161, tech69…). */
export interface RecipeItem { fr?: string; en?: string; icon?: string; v?: number }
export interface Recipe { id: string; i: [string, number][]; o: [string, number]; op: string; t?: string }
export interface RecipesData {
  items?: Record<string, RecipeItem>
  refiner?: Recipe[]
  cooking?: Recipe[]
  op_fr?: Record<string, string>
}

export interface MultitoolType {
  key: string; emoji?: string; fr?: string; en?: string; desc_fr?: string; desc_en?: string
}
export interface MultitoolFamily {
  key: string; emoji?: string; color?: string; fr?: string; en?: string
  core?: string[]; mods?: string[]
}
export interface MultitoolData {
  rules?: { slots_by_class?: Record<string, number>; sc_by_class?: Record<string, number>; module_limit?: number; cols?: number }
  types?: MultitoolType[]
  families?: MultitoolFamily[]
}

export interface WorkshopFamilyIds { key: string; coreIds: string[]; modIds: string[] }
export interface WorkshopDataset {
  families?: { tool?: WorkshopFamilyIds[]; ship?: WorkshopFamilyIds[] }
  items?: Record<string, {
    fr: string; en: string; gFr?: string; gEn?: string; dFr?: string; dEn?: string
    v?: number | null; cur?: string | null; icon?: string
  }>
  updated_at?: string
}

/** Populated by the tracker while a community war effort is live. */
export interface WarEvent {
  name?: string
  version?: string
  status?: string
  status_fr?: string
  start?: string
  end?: string
  desc?: string
  desc_en?: string
  url?: string
}

/** Element-table substances resolved from the game catalogue. */
export interface SubstanceDataset {
  items?: Record<string, {
    fr: string; en: string; gFr?: string; gEn?: string; dFr?: string; dEn?: string
    v?: number | null; icon?: string
  }>
  updated_at?: string
}

export interface DataBundle {
  stats?: Stats
  stats_history?: StatsHistory
  timeline?: { items?: TimelineItem[] }
  expeditions?: { items?: Expedition[] }
  ships?: { items?: Ship[]; upgrade_guide?: UpgradeGuide }
  creatures?: { creatures?: Creature[] }
  galaxies?: { items?: Galaxy[] }
  galaxy_hubs?: { hubs?: Record<string, GalaxyHub> }
  elements?: ElementsData
  market?: MarketData
  community?: CommunityData
  news?: { items?: NewsItem[] }
  official?: { items?: NewsItem[] }
  videos?: { items?: VideoItem[] }
  achievements?: { items?: Achievement[] }
  challenges?: { items?: Challenge[] }
  progress?: { categories?: ProgressCategory[] }
  guide?: { guides?: Guide[] }
  missions?: MissionsData
  recipes?: RecipesData
  multitool?: MultitoolData
  workshop?: WorkshopDataset
  substances?: SubstanceDataset
  /** real in-game item descriptions ("what is it for"), projected from the repo catalogue */
  descriptions?: { items?: Record<string, { fr?: string; en?: string }> }
  /** freighter comparison: documented families, sizes, acquisition routes (wiki-sourced) */
  freighters?: {
    updated_at?: string
    families?: Record<string, string>[]
    steps?: Record<string, string>[]
    /** every documented hull type with an in-game example image */
    types?: Record<string, string>[]
    types_note?: string
  }
  /** live war-effort feed; `event` is null while no effort is running */
  war?: { event?: WarEvent | null; updated_at?: string }
}

/** Payload of the shared detail modal (ships, creatures, search hits). */
export interface DetailData {
  kicker: string
  title: string
  sub?: string
  img?: string
  rows: { k: string; v: string }[]
  hasChips: boolean
  chips: string[]
  chipsLabel: string
  link: string
  linkLabel: string
}

/** A single installed technology in a multi-tool / starship build. */
export interface BuildSlot {
  /** slot index in the tech inventory */
  i: number
  /** family key */
  f: string
  k: 'tech' | 'mod'
  /** class letter for modules ('' for core technologies) */
  c: string
  /** display name at install time */
  n: string
  /** catalogue id — core tech id, or "<family>-<class>" for modules */
  id?: string
}
