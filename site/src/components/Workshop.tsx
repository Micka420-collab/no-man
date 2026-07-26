import { useAtlas } from '../lib/store'
import { hexA, readJSON, writeJSON } from '../lib/util'
import type { BuildSlot } from '../types'
import HoloCanvas from './HoloCanvas'

const mono = "'Space Mono',monospace"
export const CLASS_COLOR: Record<string, string> = {
  C: '#8a96a8', B: '#6aa9ff', A: '#57c66a', S: '#ffb347', X: '#c98af0',
}

export interface WorkshopFamily {
  key: string
  emoji: string
  color: string
  name: string
  coreLabels: string[]
  /** number of upgrade-module tiers offered (0 = unique tech, no modules) */
  modsCount: number
  /** core technologies beyond the named ones ("+ 2 more") */
  othersCount?: number
}

export interface WorkshopConfig {
  kind: 'ship' | 'tool'
  storageKey: string
  type: string
  onType: (t: string) => void
  cls: string
  onClass: (c: string) => void
  fam: string
  onFam: (f: string) => void
  types: { key: string; emoji: string; label: string }[]
  fams: WorkshopFamily[]
  total: number
  scN: number
  scPos: number[]
  classLabel: string
  holoEmoji: string
  holoName: string
  holoDesc: string
  bars: { label: string; dots: { bg: string }[] }[]
  note?: string
  accent: 'cyan' | 'gold'
}

const COLS = 10

/**
 * Technology inventory bench shared by the starship and multi-tool workshops:
 * per-class slot grid with supercharged cells, one-click install / click-to-remove,
 * live adjacency links and the 3-modules-per-family overload rule. Saved per type+class.
 */
export default function Workshop(cfg: WorkshopConfig) {
  const { L, lang, bump } = useAtlas()
  const famBy: Record<string, WorkshopFamily> = {}
  cfg.fams.forEach((f) => { famBy[f.key] = f })

  const slotKey = cfg.type + '_' + cfg.cls
  const load = (): BuildSlot[] => {
    const all = readJSON<Record<string, BuildSlot[]>>(cfg.storageKey, {})
    return all[slotKey] || []
  }
  const save = (arr: BuildSlot[]) => {
    const all = readJSON<Record<string, BuildSlot[]>>(cfg.storageKey, {})
    all[slotKey] = arr
    writeJSON(cfg.storageKey, all)
    bump()
  }

  const build = load().filter((b) => b.i < cfg.total)
  const occ: Record<number, BuildSlot> = {}
  build.forEach((b) => { occ[b.i] = b })

  const modCount: Record<string, number> = {}
  build.forEach((b) => { if (b.k === 'mod') modCount[b.f] = (modCount[b.f] || 0) + 1 })
  const over: Record<string, 1> = {}
  Object.keys(modCount).forEach((k) => { if (modCount[k] > 3) over[k] = 1 })

  let links = 0
  const linked: Record<number, 1> = {}
  for (let i = 0; i < cfg.total; i++) {
    const a = occ[i]
    if (!a) continue
    const r = occ[i + 1]
    if (r && i % COLS < COLS - 1 && r.f === a.f) { links++; linked[i] = 1; linked[i + 1] = 1 }
    const d2 = occ[i + COLS]
    if (d2 && d2.f === a.f) { links++; linked[i] = 1; linked[i + COLS] = 1 }
  }

  const place = (item: Omit<BuildSlot, 'i'>) => {
    const arr = load().filter((b) => b.i < cfg.total)
    const used: Record<number, 1> = {}
    arr.forEach((b) => { used[b.i] = 1 })
    let slot = -1
    for (let i = 0; i < cfg.total; i++) { if (!used[i]) { slot = i; break } }
    if (slot < 0) return
    if (item.k === 'mod' && arr.filter((b) => b.k === 'mod' && b.f === item.f).length >= 4) return
    arr.push({ i: slot, ...item })
    save(arr)
  }

  const curF = famBy[cfg.fam] || cfg.fams[0]
  const overNames = Object.keys(over).map((k) => (famBy[k] || { name: k }).name).join(', ')
  const mc = curF ? modCount[curF.key] || 0 : 0
  const AVAIL: Record<string, string> = { C: L.mt_av_c, B: L.mt_av_c, A: L.mt_av_a, S: L.mt_av_s, X: L.mt_av_x }
  const chipHover = cfg.accent === 'cyan' ? 'hv-chip-cyan' : 'hv-chip-gold'
  const activeChipBg = cfg.accent === 'cyan' ? '#5fd0e0' : '#ffb347'
  const activeChipFg = cfg.accent === 'cyan' ? '#03151a' : '#1a0d02'

  return (
    <div className="nms-hl-even" style={{
      display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, marginTop: 20, alignItems: 'stretch',
    }}>
      {/* HOLOGRAM */}
      <div style={{
        position: 'relative', border: '1px solid rgba(95,208,224,.28)', borderRadius: 16,
        background: 'radial-gradient(120% 90% at 50% 0%,rgba(20,40,60,.35),rgba(7,10,20,.7))',
        padding: '18px 20px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0' }}>// {L.mt_holo}</div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.1em', color: '#57628a' }}>{cfg.classLabel}</div>
        </div>
        <HoloCanvas kind={cfg.kind} type={cfg.type} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 20 }}>{cfg.holoEmoji}</span>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>{cfg.holoName}</div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9aa6c8', lineHeight: 1.55, marginTop: 7 }}>{cfg.holoDesc}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 13 }}>
          {cfg.bars.map((b) => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                flex: cfg.kind === 'ship' ? '0 0 96px' : '0 0 76px', fontFamily: mono, fontSize: 9,
                letterSpacing: '.14em', color: '#6b78a0',
              }}>{b.label}</span>
              <span style={{ display: 'flex', gap: 5 }}>
                {b.dots.map((d, i) => (
                  <span key={i} style={{ width: 16, height: 6, borderRadius: 3, background: d.bg }} />
                ))}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, color: '#465073', marginTop: 'auto', paddingTop: 12 }}>{L.mt_holo_note}</div>
      </div>

      {/* BENCH */}
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
          {['C', 'B', 'A', 'S'].map((k) => {
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
            {build.length} / {cfg.total} {L.mt_used} · ⚡ {build.filter((b) => cfg.scPos.indexOf(b.i) >= 0).length} / {cfg.scN}
          </span>
        </div>

        <div style={{
          border: '1px solid rgba(120,150,220,.16)', borderRadius: 14, background: 'rgba(9,12,26,.55)', padding: 13,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 5 }}>
            {Array.from({ length: cfg.total }, (_, i) => {
              const b = occ[i]
              const sc = cfg.scPos.indexOf(i) >= 0
              if (!b) {
                return (
                  <button key={i} title={sc ? L.mt_sc_leg : ''} onClick={(e) => e.preventDefault()} style={{
                    cursor: 'pointer', aspectRatio: '1', borderRadius: 7,
                    border: sc ? '1px dashed rgba(95,208,224,.55)' : '1px solid rgba(120,150,220,.13)',
                    background: sc ? 'rgba(95,208,224,.06)' : 'rgba(10,14,28,.5)',
                    color: 'rgba(95,208,224,.55)', fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700,
                    fontSize: 11, boxShadow: 'none', padding: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', lineHeight: 1,
                  }}>{sc ? '⚡' : ''}</button>
                )
              }
              const f = famBy[b.f] || { color: '#8a96a8', emoji: '▦', name: b.f } as WorkshopFamily
              const isOver = b.k === 'mod' && !!over[b.f]
              return (
                <button
                  key={i}
                  title={b.n + (b.k === 'mod' ? ' · ' + b.c : '') + (sc ? ' · ⚡' : '') + (isOver ? ' · ' + L.mt_over : '')}
                  onClick={() => save(load().filter((x) => x.i !== i))}
                  style={{
                    cursor: 'pointer', aspectRatio: '1', borderRadius: 7,
                    border: '1.5px solid ' + (isOver ? '#f05a5a' : sc ? '#5fd0e0' : hexA(f.color, 0.6)),
                    background: isOver ? 'rgba(240,90,90,.18)' : hexA(f.color, sc ? 0.3 : 0.16),
                    color: b.k === 'mod' ? '#fff' : '#dbe4ff',
                    fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700,
                    fontSize: b.k === 'mod' ? 13 : 12,
                    boxShadow: isOver
                      ? '0 0 10px rgba(240,90,90,.5)'
                      : linked[i] ? '0 0 9px ' + hexA(f.color, 0.65)
                        : sc ? '0 0 9px rgba(95,208,224,.5)' : 'none',
                    padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}
                >{b.k === 'mod' ? b.c : f.emoji}</button>
              )
            })}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 11,
            fontFamily: mono, fontSize: 9.5, color: '#6b78a0',
          }}>
            <span>⚡ {L.mt_sc_leg}</span>
            <span style={{ color: '#8bf0a0' }}>▣ {links} {L.mt_links}</span>
            {overNames.length > 0 && (
              <span style={{ color: '#ff8a8a' }}>⚠ {L.mt_over} · {overNames}</span>
            )}
            <span style={{ flex: 1 }} />
            <button className="hv-danger" onClick={() => save([])} style={{
              cursor: 'pointer', padding: '6px 11px', borderRadius: 8, border: '1px solid rgba(120,150,220,.25)',
              background: 'transparent', color: '#9aa6c8', fontFamily: mono, fontSize: 9.5,
            }}>✕ {L.mt_clear}</button>
          </div>

          {cfg.note && (
            <div style={{ fontFamily: mono, fontSize: 9, color: '#465073', marginTop: 8 }}>{cfg.note}</div>
          )}
        </div>

        {/* CATALOGUE */}
        <div style={{
          border: '1px solid ' + (cfg.accent === 'cyan' ? 'rgba(95,208,224,.22)' : 'rgba(255,179,71,.22)'),
          borderRadius: 14,
          background: cfg.accent === 'cyan'
            ? 'linear-gradient(180deg,rgba(10,26,32,.35),rgba(9,12,26,.55))'
            : 'linear-gradient(180deg,rgba(30,22,10,.35),rgba(9,12,26,.55))',
          padding: '14px 16px',
        }}>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: '.18em',
            color: cfg.accent === 'cyan' ? '#5fd0e0' : '#ffb347',
          }}>{L.mt_pal}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {cfg.fams.map((f) => {
              const a = curF && f.key === curF.key
              return (
                <button key={f.key} onClick={() => cfg.onFam(f.key)} style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  borderRadius: 16, border: '1px solid ' + (a ? f.color : hexA(f.color, 0.35)),
                  background: a ? f.color : hexA(f.color, 0.08),
                  color: a ? '#05070f' : f.color, fontSize: 11.5,
                }}>{f.emoji} {f.name}</button>
              )
            })}
          </div>

          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.14em', color: '#6b78a0', marginTop: 13 }}>{L.mt_core_lbl}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
            {curF?.coreLabels.map((label) => (
              <button key={label} className="hv-lift1" onClick={() => place({ k: 'tech', f: curF.key, c: '', n: label })} style={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px',
                borderRadius: 9, border: '1px solid ' + hexA(curF.color, 0.4), background: hexA(curF.color, 0.1),
                color: '#e8edfb', fontSize: 12,
              }}>
                {curF.emoji} {label} <span style={{ fontFamily: mono, fontSize: 9, color: '#8b97ba' }}>+</span>
              </button>
            ))}
            {!!curF?.othersCount && curF.othersCount > 0 && (
              <span style={{ alignSelf: 'center', fontFamily: mono, fontSize: 10, color: '#57628a' }}>
                + {curF.othersCount}{lang === 'fr' ? ' autres' : ' more'}
              </span>
            )}
          </div>

          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.14em', color: '#6b78a0', marginTop: 13 }}>
            {L.mt_mods_lbl} · <span style={{ color: mc > 3 ? '#ff8a8a' : mc === 3 ? '#ffb347' : '#8bf0a0' }}>{mc} / 3</span>
          </div>

          {curF && curF.modsCount > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
              {['C', 'B', 'A', 'S', 'X'].slice(0, Math.min(5, curF.modsCount)).map((cl) => (
                <button
                  key={cl}
                  className="hv-lift1"
                  title={AVAIL[cl]}
                  onClick={() => place({ k: 'mod', f: curF.key, c: cl, n: 'Module · ' + curF.name })}
                  style={{
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                    padding: '7px 11px', borderRadius: 9,
                    border: '1px solid ' + hexA(CLASS_COLOR[cl], 0.45), background: hexA(CLASS_COLOR[cl], 0.09),
                  }}
                >
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>
                    <span style={{ fontFamily: "'Chakra Petch',sans-serif", color: CLASS_COLOR[cl] }}>{cl}</span> · {curF.name}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 8.5, color: '#8b97ba' }}>{AVAIL[cl]}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: '#57628a', marginTop: 7 }}>{L.mt_nomods}</div>
          )}

          <div style={{ fontSize: 10.5, color: '#57628a', marginTop: 12, lineHeight: 1.6 }}>
            {L.mt_price_note}<br />{L.mt_hint}
          </div>
        </div>
      </div>
    </div>
  )
}
