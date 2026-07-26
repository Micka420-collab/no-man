import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type {
  DataBundle, DetailData, Lang, MarketItem, RecipeItem, Tab,
} from '../types'
import { strings, type Strings } from '../i18n/strings'
import { dataUrl, fmt, fmtDate, L2, readJSON, writeJSON } from './util'
import { loadSettings, type Settings } from './settings'

const DATA_FILES = [
  'stats', 'stats_history', 'timeline', 'expeditions', 'ships', 'creatures', 'galaxies',
  'galaxy_hubs', 'elements', 'market', 'community', 'news', 'official', 'videos',
  'achievements', 'challenges', 'progress', 'guide', 'missions', 'recipes', 'multitool', 'workshop', 'substances', 'war',
  'descriptions', 'freighters',
] as const

export type SortKey = 'name' | 'group' | 'value'

export interface AtlasState {
  tab: Tab
  lang: Lang
  live: number
  cd: { d: string; h: string; m: string; s: string }
  seOpen: boolean
  seQ: string
  seIdx: number
  detail: DetailData | null
  elSel: string | null
  elCtx: { color?: string; famLabel?: string }
  shipQ: string
  faunaQ: string
  faunaFam: string
  faunaSort: 'az' | 'za'
  galSel: number | null
  galQ: string
  guideTab: 'guides' | 'wiki'
  guideSel: number
  missionOpen: string | null
  dbCat: string
  dbQ: string
  dbSortK: SortKey
  dbSortD: 1 | -1
  dbFavOnly: boolean
  dbLimit: number
  rcSel: string | null
  rcQ: string
  pg: number[]
  ptCopied: boolean
  mtType: string
  mtClass: string
  mtFam: string
  shType: string
  shClass: string
  shFam: string
}

const INITIAL: AtlasState = {
  tab: 'accueil', lang: 'fr', live: 0, cd: { d: '--', h: '--', m: '--', s: '--' },
  seOpen: false, seQ: '', seIdx: 0, detail: null,
  elSel: null, elCtx: {}, shipQ: '', faunaQ: '', faunaFam: 'all', faunaSort: 'az',
  galSel: null, galQ: '', guideTab: 'guides', guideSel: 0, missionOpen: null,
  dbCat: 'all', dbQ: '', dbSortK: 'value', dbSortD: -1, dbFavOnly: false, dbLimit: 80,
  rcSel: null, rcQ: '', pg: [], ptCopied: false,
  mtType: 'rifle', mtClass: 'A', mtFam: 'mining',
  shType: 'fighter', shClass: 'A', shFam: 'pulse',
}

export interface AtlasStore {
  state: AtlasState
  patch: (p: Partial<AtlasState> | ((s: AtlasState) => Partial<AtlasState>)) => void
  data: DataBundle
  loaded: boolean
  L: Strings
  lang: Lang
  settings: Settings
  /** localStorage-backed database favourites. */
  favs: Set<string>
  toggleFav: (id: string) => void
  /** bump to force a re-render after a localStorage write (builds, progress). */
  revision: number
  bump: () => void

  nav: (tab: Tab) => void
  setLang: (lang: Lang) => void
  openDetail: (d: DetailData) => void
  closeDetail: () => void
  selectGalaxy: (n: number) => void
  goRecipesFor: (id: string) => void

  // shared lookups
  t2: (o: unknown, base: string) => string
  date: (iso?: string) => string
  marketMap: Record<string, MarketItem>
  itemsMap: Record<string, RecipeItem>
  rcName: (id: string) => string
  rcIcon: (id: string) => string
  rcVal: (id: string) => number | null
  rcOp: (op: string) => string
  /** real in-game description of an item ("what is it for"), '' when the data has none */
  rcDesc: (id: string) => string
}

const Ctx = createContext<AtlasStore | null>(null)

/** ms until the 10-year anniversary (9 Aug 2026 UTC) used by the hero countdown. */
const COUNTDOWN_TARGET = Date.UTC(2026, 7, 9, 0, 0, 0)

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AtlasState>(INITIAL)
  const [data, setData] = useState<DataBundle>({})
  const [loaded, setLoaded] = useState(false)
  const [revision, setRevision] = useState(0)
  const settings = useMemo(loadSettings, [])
  const favsRef = useRef<Set<string>>(new Set(readJSON<string[]>('atlas-terminal-favs', [])))
  const mounted = useRef(true)

  const patch = useCallback<AtlasStore['patch']>((p) => {
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }))
  }, [])

  const bump = useCallback(() => setRevision((r) => r + 1), [])

  // ── data + intro count-up ────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true
    let raf = 0
    ;(async () => {
      const res = await Promise.all(
        DATA_FILES.map((f) =>
          fetch(dataUrl(f)).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
      )
      if (!mounted.current) return
      const d: Record<string, unknown> = {}
      DATA_FILES.forEach((f, i) => { d[f] = res[i] })
      setData(d as DataBundle)
      setLoaded(true)

      const target = (d.stats as { player_count?: number } | null)?.player_count ?? 7516
      const start = Math.max(0, Math.round(target * 0.5))
      const dur = 1700
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const e = 1 - Math.pow(1 - p, 3)
        if (!mounted.current) return
        setState((s) => ({ ...s, live: Math.round(start + (target - start) * e) }))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })()
    return () => { mounted.current = false; if (raf) cancelAnimationFrame(raf) }
  }, [])

  // ── anniversary clock ────────────────────────────────────────────────────
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const tick = () => {
      let diff = COUNTDOWN_TARGET - Date.now()
      if (diff < 0) diff = 0
      setState((s) => ({
        ...s,
        cd: {
          d: String(Math.floor(diff / 86400000)),
          h: pad(Math.floor((diff % 86400000) / 3600000)),
          m: pad(Math.floor((diff % 3600000) / 60000)),
          s: pad(Math.floor((diff % 60000) / 1000)),
        },
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const lang = state.lang
  const L = useMemo(() => strings(lang), [lang])

  const marketMap = useMemo(() => {
    const m: Record<string, MarketItem> = {}
    const cats = data.market?.categories || {}
    Object.keys(cats).forEach((k) => (cats[k] || []).forEach((it) => {
      if (it && it.id) m[it.id] = { ...it, cat: k }
    }))
    return m
  }, [data])

  const itemsMap = useMemo(() => data.recipes?.items || {}, [data])

  const rcName = useCallback((id: string) => {
    const it = itemsMap[id]
    if (it) return (lang === 'fr' ? it.fr : it.en) || it.fr || id
    const m = marketMap[id]
    if (m) return (lang === 'fr' ? m.name_fr : m.name_en) || id
    return id
  }, [itemsMap, marketMap, lang])

  const rcIcon = useCallback((id: string) => {
    const it = itemsMap[id]
    if (it?.icon) return it.icon
    return marketMap[id]?.icon || ''
  }, [itemsMap, marketMap])

  const rcVal = useCallback((id: string): number | null => {
    const m = marketMap[id]
    if (m?.value != null) return m.value
    const it = itemsMap[id]
    return it?.v != null ? it.v : null
  }, [itemsMap, marketMap])

  const rcOp = useCallback((op: string) => {
    if (lang !== 'fr') return op
    return data.recipes?.op_fr?.[op] || op
  }, [data, lang])

  const rcDesc = useCallback((id: string) => {
    const d = data.descriptions?.items?.[id]
    if (!d) return ''
    return (lang === 'fr' ? d.fr : d.en) || d.fr || d.en || ''
  }, [data, lang])

  const nav = useCallback((tab: Tab) => {
    setState((s) => ({ ...s, tab }))
    const m = document.getElementById('nms-main')
    if (m) m.scrollTop = 0
  }, [])

  const store: AtlasStore = {
    state, patch, data, loaded, L, lang, settings,
    favs: favsRef.current,
    toggleFav: (id) => {
      const f = favsRef.current
      if (f.has(id)) f.delete(id); else f.add(id)
      writeJSON('atlas-terminal-favs', Array.from(f))
      bump()
    },
    revision, bump,
    nav,
    setLang: (l) => { if (l !== lang) patch({ lang: l }) },
    openDetail: (d) => patch({ detail: d }),
    closeDetail: () => patch({ detail: null }),
    selectGalaxy: (n) => patch({ galSel: n }),
    goRecipesFor: (id) => { patch({ rcSel: id, rcQ: '', seOpen: false, detail: null }); nav('recipes') },
    t2: (o, base) => L2(o, base, lang),
    date: (iso) => fmtDate(iso, lang),
    marketMap, itemsMap, rcName, rcIcon, rcVal, rcOp, rcDesc,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useAtlas(): AtlasStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAtlas must be used inside <AtlasProvider>')
  return v
}

export { fmt }
