import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useAtlas } from '../lib/store'
import { fmt, hexA, readJSON, writeJSON } from '../lib/util'
import type { BuildSlot } from '../types'
import {
  ADJACENCY_BONUS, AVAILABILITY, BASE_HYPERDRIVE_LY, CLASS_MULT, MODULE_LIMIT, SHIP_PROFILE,
  STAT_COLOR, STAT_LABEL,
  SUPERCHARGE_MULT, TOOL_PROFILE, families,
  type ClassKey, type Family, type PartKey, type StatKey,
} from '../data/catalogue'

/** three.js is ~450 kB — only pulled in when a workshop is actually opened. */
const Viewer3D = lazy(() => import('./Viewer3D'))

const mono = "'Space Mono',monospace"
export const CLASS_COLOR: Record<string, string> = {
  C: '#8a96a8', B: '#6aa9ff', A: '#57c66a', S: '#ffb347', X: '#c98af0',
}

const COLS = 10

export interface WorkshopConfig {
  kind: 'ship' | 'tool'
  storageKey: string
  type: string
  onType: (t: string) => void
  cls: string
  onClass: (c: string) => void
  fam: string
  onFam: (f: string) => void
  types: { key: string; emoji: string; label: string; desc?: string }[]
  total: number
  scN: number
  holoName: string
  holoDesc: string
  holoEmoji: string
  note?: string
  accent: 'cyan' | 'gold'
}

/**
 * Supercharged slots sit as a contiguous cluster in game, not scattered — a 2×2 block
 * (or the first cells of it) near the middle of the tech inventory.
 */
function superchargedSlots(total: number, n: number): number[] {
  const row = Math.max(0, Math.floor(total / COLS / 2) - 1)
  const base = row * COLS + 2
  return [base, base + 1, base + COLS, base + COLS + 1].filter((i) => i < total).slice(0, n)
}

interface Installed extends BuildSlot {
  fam?: Family
  sc: boolean
  over: boolean
  linked: boolean
}

export default function Workshop(cfg: WorkshopConfig) {
  const { L, lang, bump } = useAtlas()
  const [hover, setHover] = useState<number | null>(null)
  /** slot index currently picked up — the game's "move technology" mode */
  const [held, setHeld] = useState<number | null>(null)

  const fams = useMemo(() => families(cfg.kind), [cfg.kind])
  const famBy = useMemo(() => {
    const m: Record<string, Family> = {}
    fams.forEach((f) => { m[f.key] = f })
    return m
  }, [fams])

  const scPos = useMemo(() => superchargedSlots(cfg.total, cfg.scN), [cfg.total, cfg.scN])
  const slotKey = cfg.type + '_' + cfg.cls

  const load = (): BuildSlot[] => {
    const all = readJSON<Record<string, BuildSlot[]>>(cfg.storageKey, {})
    return (all[slotKey] || []).filter((b) => b && b.i < cfg.total)
  }
  const save = (arr: BuildSlot[]) => {
    const all = readJSON<Record<string, BuildSlot[]>>(cfg.storageKey, {})
    all[slotKey] = arr
    writeJSON(cfg.storageKey, all)
    bump()
  }

  const build = load()
  const occ: Record<number, BuildSlot> = {}
  build.forEach((b) => { occ[b.i] = b })

  const modCount: Record<string, number> = {}
  build.forEach((b) => { if (b.k === 'mod') modCount[b.f] = (modCount[b.f] || 0) + 1 })
  const over: Record<string, boolean> = {}
  Object.keys(modCount).forEach((k) => { if (modCount[k] > MODULE_LIMIT) over[k] = true })

  // adjacency: orthogonal neighbours of the same family reinforce each other
  let links = 0
  const linkCount: Record<number, number> = {}
  for (let i = 0; i < cfg.total; i++) {
    const a = occ[i]
    if (!a) continue
    const right = occ[i + 1]
    if (right && i % COLS < COLS - 1 && right.f === a.f) {
      links++; linkCount[i] = (linkCount[i] || 0) + 1; linkCount[i + 1] = (linkCount[i + 1] || 0) + 1
    }
    const down = occ[i + COLS]
    if (down && down.f === a.f) {
      links++; linkCount[i] = (linkCount[i] || 0) + 1; linkCount[i + COLS] = (linkCount[i + COLS] || 0) + 1
    }
  }

  const slots: (Installed | null)[] = Array.from({ length: cfg.total }, (_, i) => {
    const b = occ[i]
    if (!b) return null
    return {
      ...b, fam: famBy[b.f], sc: scPos.includes(i), over: b.k === 'mod' && !!over[b.f],
      linked: (linkCount[i] || 0) > 0,
    }
  })

  // ── live stat estimate ────────────────────────────────────────────────────
  const profile = (cfg.kind === 'tool' ? TOOL_PROFILE : SHIP_PROFILE)[cfg.type]
    || (cfg.kind === 'tool' ? TOOL_PROFILE.rifle : SHIP_PROFILE.shuttle)
  const classMult = CLASS_MULT[cfg.cls] || 1

  const bonus: Record<string, { min: number; max: number }> = {}
  const addBonus = (stat: StatKey, min: number, max: number) => {
    const b = (bonus[stat] ||= { min: 0, max: 0 })
    b.min += min; b.max += max
  }
  let naniteMin = 0, naniteMax = 0

  build.forEach((b) => {
    const f = famBy[b.f]
    if (!f || over[b.f]) return
    const mult = (scPos.includes(b.i) ? SUPERCHARGE_MULT : 1)
      * (1 + (linkCount[b.i] || 0) * (ADJACENCY_BONUS / 100))
    if (b.k === 'tech') {
      addBonus(f.primary, 6 * mult, 10 * mult)
      ;(f.secondary || []).forEach((s) => addBonus(s, 3 * mult, 5 * mult))
    } else {
      const tier = f.module?.tiers.find((t) => t.cl === b.c)
      if (!tier) return
      addBonus(f.primary, tier.bonus.min * mult, tier.bonus.max * mult)
      ;(f.secondary || []).forEach((s) => addBonus(s, (tier.bonus.min / 2) * mult, (tier.bonus.max / 2) * mult))
      naniteMin += tier.nanites.min; naniteMax += tier.nanites.max
    }
  })

  const statRows = (Object.keys(profile) as StatKey[]).map((s) => {
    const base = (profile[s] || 0) * classMult
    const b = bonus[s]
    return {
      key: s,
      label: STAT_LABEL[s][lang === 'fr' ? 0 : 1],
      color: STAT_COLOR[s],
      base: Math.min(5, base),
      pct: Math.min(100, (base / 5) * 100),
      bonusPct: Math.min(100, (base / 5) * 100 * (1 + (b ? b.max : 0) / 100)),
      bMin: b ? Math.round(b.min) : 0,
      bMax: b ? Math.round(b.max) : 0,
    }
  })

  const scUsedCount = build.filter((b) => scPos.includes(b.i)).length

  const activeParts = useMemo(() => {
    const parts = new Set<PartKey>()
    build.forEach((b) => {
      const f = famBy[b.f]
      if (!f || over[b.f]) return
      const core = f.core.find((c) => c.id === b.id)
      parts.add(core ? core.part : f.part)
    })
    return Array.from(parts)
    // build is derived from localStorage; the revision bump re-renders this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(build), famBy])

  const [mode, setMode] = useState<'solid' | 'holo'>('solid')

  /** Compact technical sheet: the numbers a player actually compares builds on. */
  const hyperB = bonus.hyper
  const baseLy = BASE_HYPERDRIVE_LY[cfg.type] || 0
  const sheet: { k: string; v: string; color: string }[] = [
    { k: lang === 'fr' ? 'EMPLACEMENTS' : 'SLOTS', v: build.length + ' / ' + cfg.total, color: '#e8edfb' },
    { k: lang === 'fr' ? 'SURVOLTÉS' : 'SUPERCHARGED', v: scUsedCount + ' / ' + cfg.scN, color: '#5fd0e0' },
    { k: lang === 'fr' ? 'ADJACENCE' : 'ADJACENCY', v: String(links), color: '#8bf0a0' },
    ...(cfg.kind === 'ship' && baseLy
      ? [{
        k: 'HYPERDRIVE',
        v: '≈ ' + fmt(Math.round(baseLy * (1 + (hyperB?.min || 0) / 100))) + '–'
          + fmt(Math.round(baseLy * (1 + (hyperB?.max || 0) / 100))) + (lang === 'fr' ? ' al' : ' ly'),
        color: '#c98af0',
      }]
      : []),
    {
      k: lang === 'fr' ? 'COÛT BUILD' : 'BUILD COST',
      v: naniteMax > 0 ? '≈ ' + fmt(naniteMin) + '–' + fmt(naniteMax) + ' ⬡' : '—',
      color: '#ffd98a',
    },
  ]

  useEffect(() => {
    if (held == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setHeld(null) }
      if (e.key === 'Delete' || e.key === 'Backspace') removeSlot(held)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held])

  // ── actions ───────────────────────────────────────────────────────────────
  const firstFree = (arr: BuildSlot[]) => {
    const used: Record<number, 1> = {}
    arr.forEach((b) => { used[b.i] = 1 })
    // fill supercharged slots last so they stay available for deliberate placement
    for (let i = 0; i < cfg.total; i++) if (!used[i] && !scPos.includes(i)) return i
    for (let i = 0; i < cfg.total; i++) if (!used[i]) return i
    return -1
  }

  const installCore = (f: Family, coreId: string, target?: number) => {
    const arr = load()
    if (arr.some((b) => b.k === 'tech' && b.id === coreId)) return   // one of each core tech
    const core = f.core.find((c) => c.id === coreId)
    if (!core) return
    const slot = target != null && !arr.some((b) => b.i === target) ? target : firstFree(arr)
    if (slot < 0) return
    arr.push({ i: slot, f: f.key, k: 'tech', c: '', n: lang === 'fr' ? core.fr : core.en, id: coreId })
    save(arr)
  }

  const installModule = (f: Family, cl: ClassKey, target?: number) => {
    const arr = load()
    if (arr.filter((b) => b.k === 'mod' && b.f === f.key).length >= MODULE_LIMIT + 1) return
    const slot = target != null && !arr.some((b) => b.i === target) ? target : firstFree(arr)
    if (slot < 0) return
    const label = (lang === 'fr' ? f.module?.fr : f.module?.en) || f.fr
    arr.push({ i: slot, f: f.key, k: 'mod', c: cl, n: label, id: f.key + '-' + cl })
    save(arr)
  }

  const removeSlot = (i: number) => {
    save(load().filter((b) => b.i !== i))
    setHeld((h) => (h === i ? null : h))
  }

  /** Move the held technology to `to`, swapping with whatever sits there. */
  const moveTo = (to: number) => {
    const from = held
    if (from == null || from === to) { setHeld(null); return }
    const arr = load()
    const a = arr.find((b) => b.i === from)
    if (!a) { setHeld(null); return }
    const b = arr.find((x) => x.i === to)
    a.i = to
    if (b) b.i = from
    save(arr)
    setHeld(null)
  }

  /** Click an empty cell: drop the next thing that makes sense for the selected family. */
  const dropInto = (i: number) => {
    if (!curF) return
    const installed = new Set(load().filter((b) => b.k === 'tech').map((b) => b.id))
    const next = curF.core.find((c) => !installed.has(c.id))
    if (next) { installCore(curF, next.id, i); return }
    if (curF.module) {
      const cl = (['C', 'B', 'A', 'S'] as ClassKey[]).includes(cfg.cls as ClassKey)
        ? (cfg.cls as ClassKey) : 'C'
      installModule(curF, cl, i)
    }
  }

  const curF = famBy[cfg.fam] || fams[0]
  const chipHover = cfg.accent === 'cyan' ? 'hv-chip-cyan' : 'hv-chip-gold'
  const activeChipBg = cfg.accent === 'cyan' ? '#5fd0e0' : '#ffb347'
  const activeChipFg = cfg.accent === 'cyan' ? '#03151a' : '#1a0d02'
  const accentHex = CLASS_COLOR[cfg.cls] || '#5fd0e0'

  const installedCoreIds = new Set(build.filter((b) => b.k === 'tech').map((b) => b.id))
  const full = build.length >= cfg.total
  const overNames = Object.keys(over).map((k) => famBy[k]?.[lang === 'fr' ? 'fr' : 'en'] || k).join(', ')
  const hovered = hover != null ? slots[hover] : null
  const detail = held != null ? slots[held] : hovered
  const scUsed = scUsedCount

  return (
    <div className="nms-hl-even" style={{
      display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, marginTop: 20, alignItems: 'stretch',
    }}>
      {/* ── VIEWER ─────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', border: '1px solid rgba(95,208,224,.28)', borderRadius: 16,
        background: 'radial-gradient(120% 90% at 50% 0%,rgba(20,40,60,.35),rgba(7,10,20,.7))',
        padding: '18px 20px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0' }}>// {L.mt_holo}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['solid', 'holo'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                cursor: 'pointer', padding: '3px 9px', borderRadius: 7, fontFamily: mono, fontSize: 9,
                letterSpacing: '.1em',
                border: '1px solid ' + (mode === m ? '#5fd0e0' : 'rgba(120,150,220,.25)'),
                background: mode === m ? 'rgba(95,208,224,.16)' : 'transparent',
                color: mode === m ? '#dbe4ff' : '#6b78a0',
              }}>{m === 'solid' ? (lang === 'fr' ? 'SOLIDE' : 'SOLID') : 'HOLO'}</button>
            ))}
          </div>
        </div>

        <Suspense fallback={
          <div style={{
            height: 286, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#57628a',
          }}>
            <span style={{
              width: 34, height: 34, border: '2px solid rgba(120,160,230,.2)', borderTopColor: '#5fd0e0',
              borderRadius: '50%', animation: 'nmsSpin 1.1s linear infinite', marginRight: 12,
            }} />
            {lang === 'fr' ? 'CHARGEMENT DU MODÈLE' : 'LOADING MODEL'}
          </div>
        }>
          <Viewer3D
            kind={cfg.kind}
            type={cfg.type}
            accent={accentHex}
            activeParts={activeParts}
            mode={mode}
            height={286}
          />
        </Suspense>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <span style={{ fontSize: 20 }}>{cfg.holoEmoji}</span>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#fff', flex: 1 }}>{cfg.holoName}</div>
          <span style={{
            fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 13, color: '#05070f',
            background: accentHex, borderRadius: 6, padding: '2px 9px',
          }}>{cfg.cls}</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#9aa6c8', lineHeight: 1.55, marginTop: 7 }}>{cfg.holoDesc}</div>

        {/* live stat estimate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {statRows.map((r) => (
            <div key={r.key}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
                fontFamily: mono, fontSize: 9, letterSpacing: '.14em', color: '#6b78a0',
              }}>
                <span>{r.label}</span>
                {r.bMax > 0 && (
                  <span style={{ color: r.color }}>+{r.bMin}–{r.bMax}%</span>
                )}
              </div>
              <div style={{
                position: 'relative', height: 6, borderRadius: 4, background: 'rgba(120,150,220,.14)',
                marginTop: 4, overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, width: r.bonusPct + '%', borderRadius: 4,
                  background: hexA(r.color, 0.35), transition: 'width .35s',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, width: r.pct + '%', borderRadius: 4,
                  background: r.color, transition: 'width .35s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* technical sheet */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))', gap: 7, marginTop: 13,
          paddingTop: 12, borderTop: '1px solid rgba(120,150,220,.12)',
        }}>
          {sheet.map((row) => (
            <div key={row.k}>
              <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.14em', color: '#6b78a0' }}>{row.k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: row.color, marginTop: 3 }}>{row.v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: mono, fontSize: 9, color: '#465073', marginTop: 'auto', paddingTop: 12, lineHeight: 1.6 }}>
          {lang === 'fr'
            ? 'Glisser pour pivoter · molette pour zoomer · modèles stylisés (assets du jeu propriétaires)'
            : 'Drag to orbit · wheel to zoom · stylised models (game assets are proprietary)'}
        </div>
      </div>

      {/* ── BENCH ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {cfg.types.map((t) => {
            const a = t.key === cfg.type
            return (
              <button key={t.key} className={chipHover} onClick={() => cfg.onType(t.key)} style={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px',
                borderRadius: 19, border: '1px solid ' + (a ? activeChipBg : 'rgba(120,150,220,.2)'),
                background: a ? activeChipBg : 'rgba(120,150,220,.07)',
                color: a ? activeChipFg : '#dbe4ff', fontSize: 12.5, fontWeight: 600,
              }}>{t.emoji} {t.label}</button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.16em', color: '#6b78a0' }}>{L.mt_class_sel}</span>
          {(['C', 'B', 'A', 'S'] as const).map((k) => {
            const a = k === cfg.cls
            return (
              <button key={k} onClick={() => cfg.onClass(k)} style={{
                cursor: 'pointer', width: 38, height: 34, borderRadius: 9,
                border: '1px solid ' + (a ? CLASS_COLOR[k] : 'rgba(120,150,220,.25)'),
                background: a ? CLASS_COLOR[k] : 'rgba(10,14,28,.6)',
                color: a ? '#05070f' : CLASS_COLOR[k],
                fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 15,
              }}>{k}</button>
            )
          })}
          <span style={{ fontFamily: mono, fontSize: 10.5, color: '#8b97ba', marginLeft: 6 }}>
            {build.length} / {cfg.total} {L.mt_used} · ⚡ {scUsed} / {cfg.scN}
          </span>
        </div>

        {/* inventory grid */}
        <div style={{
          border: '1px solid rgba(120,150,220,.16)', borderRadius: 14, background: 'rgba(9,12,26,.55)', padding: 13,
        }}>
          <div className="nms-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 5 }}>
            {slots.map((b, i) => {
              const sc = scPos.includes(i)
              if (!b) {
                return (
                  <button
                    key={i}
                    className="nms-slot"
                    title={sc ? L.mt_sc_leg : ''}
                    onMouseEnter={() => setHover(null)}
                    onClick={() => (held != null ? moveTo(i) : dropInto(i))}
                    style={{
                      cursor: 'pointer', aspectRatio: '1', borderRadius: 7,
                      border: sc ? '1px dashed rgba(95,208,224,.55)' : '1px solid rgba(120,150,220,.13)',
                      background: sc ? 'rgba(95,208,224,.06)' : 'rgba(10,14,28,.5)',
                      color: 'rgba(95,208,224,.55)', fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700,
                      fontSize: 11, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >{sc ? '⚡' : ''}</button>
                )
              }
              const f = b.fam
              const color = f?.color || '#8a96a8'
              return (
                <button
                  key={i}
                  className="nms-slot"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                  onClick={() => (held != null ? moveTo(i) : setHeld(i))}
                  title={b.n + (b.k === 'mod' ? ' · ' + b.c : '') + (b.sc ? ' · ⚡' : '') + (b.over ? ' · ' + L.mt_over : '')}
                  style={{
                    cursor: 'pointer', aspectRatio: '1', borderRadius: 7,
                    border: (held === i ? '1.5px dashed #fff' : '1.5px solid '
                      + (b.over ? '#f05a5a' : b.sc ? '#5fd0e0' : hexA(color, 0.6))),
                    opacity: held === i ? 0.55 : 1,
                    background: b.over ? 'rgba(240,90,90,.18)' : hexA(color, b.sc ? 0.3 : 0.16),
                    color: b.k === 'mod' ? '#fff' : '#dbe4ff',
                    fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700,
                    fontSize: b.k === 'mod' ? 13 : 12,
                    boxShadow: b.over ? '0 0 10px rgba(240,90,90,.5)'
                      : b.linked ? '0 0 9px ' + hexA(color, 0.65)
                        : b.sc ? '0 0 9px rgba(95,208,224,.5)' : 'none',
                    padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    outlineOffset: 2,
                  }}
                >
                  {b.k === 'mod' ? b.c : (
                    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={f?.glyph || 'M12 12h.01'} />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {/* held / hovered slot detail */}
          <div style={{
            marginTop: 10, minHeight: 42, borderRadius: 9,
            border: '1px solid ' + (held != null ? 'rgba(95,208,224,.4)' : 'rgba(120,150,220,.12)'),
            background: held != null ? 'rgba(95,208,224,.07)' : 'rgba(10,14,28,.45)',
            padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {detail ? (
              <>
                <span style={{ color: detail.fam?.color || '#8a96a8', display: 'flex', flex: '0 0 auto' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={detail.fam?.glyph || 'M12 12h.01'} />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', color: '#fff', fontSize: 12.5, fontWeight: 600 }}>
                    {detail.n}{detail.k === 'mod' && (
                      <span style={{ color: CLASS_COLOR[detail.c], fontFamily: "'Chakra Petch',sans-serif" }}> · {detail.c}</span>
                    )}
                  </span>
                  <span style={{ display: 'block', fontFamily: mono, fontSize: 9.5, color: '#8b97ba', marginTop: 2 }}>
                    {detail.fam ? (lang === 'fr' ? detail.fam.fr : detail.fam.en) : ''}
                    {detail.sc && <span style={{ color: '#5fd0e0' }}> · ⚡ {lang === 'fr' ? 'survolté ×1,5' : 'supercharged ×1.5'}</span>}
                    {detail.linked && <span style={{ color: '#8bf0a0' }}> · ▣ +{ADJACENCY_BONUS}% {lang === 'fr' ? 'adjacence' : 'adjacency'}</span>}
                    {detail.over && <span style={{ color: '#ff8a8a' }}> · ⚠ {L.mt_over}</span>}
                  </span>
                </span>
                {held != null && (
                  <span style={{ fontFamily: mono, fontSize: 9, color: '#5fd0e0', whiteSpace: 'nowrap' }}>
                    {lang === 'fr' ? 'pose sur une case · Échap' : 'click a cell · Esc'}
                  </span>
                )}
                <button
                  className="hv-danger"
                  onClick={() => removeSlot(detail.i)}
                  style={{
                    cursor: 'pointer', padding: '5px 9px', borderRadius: 7, flex: '0 0 auto',
                    border: '1px solid rgba(120,150,220,.25)', background: 'transparent',
                    color: '#9aa6c8', fontFamily: mono, fontSize: 9,
                  }}
                >✕ {lang === 'fr' ? 'Retirer' : 'Remove'}</button>
              </>
            ) : (
              <span style={{ fontFamily: mono, fontSize: 9.5, color: '#57628a', lineHeight: 1.6 }}>
                {lang === 'fr'
                  ? 'Clique une techno pour la prendre, puis une case pour la poser (échange si occupée) · case vide = installer la famille sélectionnée'
                  : 'Click a technology to pick it up, then a cell to place it (swaps if occupied) · empty cell installs the selected family'}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 11,
            fontFamily: mono, fontSize: 9.5, color: '#6b78a0',
          }}>
            <span>⚡ {L.mt_sc_leg}</span>
            <span style={{ color: '#8bf0a0' }}>▣ {links} {L.mt_links}</span>
            {!!overNames && <span style={{ color: '#ff8a8a' }}>⚠ {L.mt_over} · {overNames}</span>}
            {full && <span style={{ color: '#ffb347' }}>▣ {lang === 'fr' ? 'Inventaire plein' : 'Inventory full'}</span>}
            <span style={{ flex: 1 }} />
            <button className="hv-danger" onClick={() => save([])} style={{
              cursor: 'pointer', padding: '6px 11px', borderRadius: 8, border: '1px solid rgba(120,150,220,.25)',
              background: 'transparent', color: '#9aa6c8', fontFamily: mono, fontSize: 9.5,
            }}>✕ {L.mt_clear}</button>
          </div>

          {cfg.note && <div style={{ fontFamily: mono, fontSize: 9, color: '#465073', marginTop: 8 }}>{cfg.note}</div>}
        </div>

        {/* catalogue */}
        <div style={{
          border: '1px solid ' + (cfg.accent === 'cyan' ? 'rgba(95,208,224,.22)' : 'rgba(255,179,71,.22)'),
          borderRadius: 14,
          background: cfg.accent === 'cyan'
            ? 'linear-gradient(180deg,rgba(10,26,32,.35),rgba(9,12,26,.55))'
            : 'linear-gradient(180deg,rgba(30,22,10,.35),rgba(9,12,26,.55))',
          padding: '14px 16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
          }}>
            <div style={{
              fontFamily: mono, fontSize: 10, letterSpacing: '.18em',
              color: cfg.accent === 'cyan' ? '#5fd0e0' : '#ffb347',
            }}>{L.mt_pal}</div>
            {naniteMax > 0 && (
              <div style={{ fontFamily: mono, fontSize: 10, color: '#c9a8ff' }}>
                ≈ {fmt(naniteMin)} – {fmt(naniteMax)} {lang === 'fr' ? 'nanites' : 'nanites'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {fams.map((f) => {
              const a = curF && f.key === curF.key
              const n = modCount[f.key] || 0
              return (
                <button key={f.key} onClick={() => cfg.onFam(f.key)} style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  borderRadius: 16, border: '1px solid ' + (over[f.key] ? '#f05a5a' : a ? f.color : hexA(f.color, 0.35)),
                  background: a ? f.color : hexA(f.color, 0.08),
                  color: a ? '#05070f' : f.color, fontSize: 11.5,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.glyph} />
                  </svg>
                  {lang === 'fr' ? f.fr : f.en}
                  {n > 0 && (
                    <span style={{
                      fontFamily: mono, fontSize: 9, color: a ? '#05070f' : over[f.key] ? '#ff8a8a' : '#8b97ba',
                    }}>{n}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* core technologies */}
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.14em', color: '#6b78a0', marginTop: 14 }}>{L.mt_core_lbl}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 7 }}>
            {curF?.core.map((c) => {
              const done = installedCoreIds.has(c.id)
              const blocked = done || full
              return (
                <button
                  key={c.id}
                  className="hv-lift1"
                  disabled={blocked}
                  title={done
                    ? (lang === 'fr' ? 'Déjà installée' : 'Already installed')
                    : full ? (lang === 'fr' ? 'Inventaire plein' : 'Inventory full') : ''}
                  onClick={() => installCore(curF, c.id)}
                  style={{
                    cursor: blocked ? 'default' : 'pointer', textAlign: 'left', display: 'flex', gap: 10,
                    alignItems: 'flex-start', padding: '9px 11px', borderRadius: 10,
                    border: '1px solid ' + (done ? hexA(curF.color, 0.7) : hexA(curF.color, 0.3)),
                    background: done ? hexA(curF.color, 0.16) : 'rgba(10,14,28,.5)',
                    opacity: done ? 0.85 : full ? 0.45 : 1, transition: 'transform .15s',
                  }}
                >
                  <span style={{ flex: '0 0 auto', color: curF.color, display: 'flex', width: 16 }}>
                    {done ? <span style={{ fontSize: 14, color: '#8bf0a0' }}>✓</span> : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={curF.glyph} />
                      </svg>
                    )}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', color: '#fff', fontSize: 12.5, fontWeight: 600 }}>
                      {lang === 'fr' ? c.fr : c.en}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: '#9aa6c8', marginTop: 3, lineHeight: 1.5 }}>
                      {lang === 'fr' ? c.dFr : c.dEn}
                    </span>
                    <span style={{ display: 'block', fontFamily: mono, fontSize: 9, color: '#57628a', marginTop: 4 }}>
                      {lang === 'fr' ? c.srcFr : c.srcEn}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* upgrade modules */}
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.14em', color: '#6b78a0', marginTop: 14 }}>
            {L.mt_mods_lbl}
            {curF && (
              <> · <span style={{
                color: (modCount[curF.key] || 0) > MODULE_LIMIT ? '#ff8a8a'
                  : (modCount[curF.key] || 0) === MODULE_LIMIT ? '#ffb347' : '#8bf0a0',
              }}>{modCount[curF.key] || 0} / {MODULE_LIMIT}</span></>
            )}
          </div>

          {curF?.module ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 7, marginTop: 7,
            }}>
              {curF.module.tiers.map((t) => (
                <button
                  key={t.cl}
                  className="hv-lift1"
                  disabled={full}
                  title={full ? (lang === 'fr' ? 'Inventaire plein' : 'Inventory full') : ''}
                  onClick={() => installModule(curF, t.cl)}
                  style={{
                    opacity: full ? 0.45 : 1,
                    cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3,
                    padding: '9px 11px', borderRadius: 10,
                    border: '1px solid ' + hexA(CLASS_COLOR[t.cl], 0.45),
                    background: hexA(CLASS_COLOR[t.cl], 0.09), transition: 'transform .15s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 14,
                      color: '#05070f', background: CLASS_COLOR[t.cl], borderRadius: 5, padding: '0 7px',
                    }}>{t.cl}</span>
                    <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 600 }}>
                      +{t.bonus.min}–{t.bonus.max}%
                    </span>
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9.5, color: '#ffd98a' }}>
                    ≈ {fmt(t.nanites.min)}–{fmt(t.nanites.max)} ⬡
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 8.5, color: '#8b97ba', lineHeight: 1.45 }}>
                    {AVAILABILITY[t.cl][lang === 'fr' ? 0 : 1]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: '#57628a', marginTop: 7 }}>{L.mt_nomods}</div>
          )}

          <div style={{ fontSize: 10.5, color: '#57628a', marginTop: 12, lineHeight: 1.6 }}>
            {lang === 'fr'
              ? 'Prix et bonus : fourchettes observées par la communauté — chaque module tire ses stats au hasard dans la fenêtre de sa classe. Max 3 modules par famille, au-delà toute la famille se désactive.'
              : 'Prices and bonuses are community-observed ranges — every module rolls random stats inside its class window. Max 3 modules per family; beyond that the whole family shuts down.'}
          </div>
        </div>
      </div>
    </div>
  )
}
