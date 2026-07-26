import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { fmt, rawIconFallback } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import type { ElementCell } from '../types'

const mono = "'Space Mono',monospace"

/** Fallback FR/EN names for substances that market.json doesn't carry. */
const NM: Record<string, [string, string]> = {
  raw1: ['Carbone', 'Carbon'], raw2: ['Carbone condensé', 'Condensed Carbon'],
  raw12: ['Sodium', 'Sodium'], raw13: ['Nitrate de sodium', 'Sodium Nitrate'],
  raw5: ['Dihydrogène', 'Di-hydrogen'], raw6: ['Deutérium', 'Deuterium'], raw7: ['Tritium', 'Tritium'],
  raw3: ['Oxygène', 'Oxygen'], raw37: ['Azote', 'Nitrogen'], raw35: ['Soufrine', 'Sulphurine'],
  raw36: ['Radon', 'Radon'], raw8: ['Poussière de ferrite', 'Ferrite Dust'],
  raw9: ['Ferrite pure', 'Pure Ferrite'], raw10: ['Ferrite magnétisée', 'Magnetised Ferrite'],
  raw14: ['Cobalt', 'Cobalt'], raw15: ['Cobalt ionisé', 'Ionised Cobalt'],
  raw19: ['Cuivre', 'Copper'], raw38: ['Cuivre activé', 'Activated Copper'],
  raw20: ['Cadmium', 'Cadmium'], raw39: ['Cadmium activé', 'Activated Cadmium'],
  raw21: ['Emeril', 'Emeril'], raw40: ['Emeril activé', 'Activated Emeril'],
  raw22: ['Indium', 'Indium'], raw23: ['Métal chromatique', 'Chromatic Metal'],
  raw24: ['Paraffinium', 'Paraffinium'], raw28: ['Dioxite', 'Dioxite'], raw25: ['Pyrite', 'Pyrite'],
  raw29: ['Phosphore', 'Phosphorus'], raw27: ['Uranium', 'Uranium'], raw26: ['Ammoniac', 'Ammonia'],
  raw16: ['Sel', 'Salt'], raw31: ['Pugneum', 'Pugneum'],
}

export default function Elements() {
  const { state, patch, data, L, lang, marketMap, rcIcon, rcName, goRecipesFor } = useAtlas()

  const el = useMemo(() => data.elements || {}, [data])
  /** the game's own substance data — names, groups, values and icons for every tile */
  const sub = useMemo(() => data.substances?.items || {}, [data])
  const fams = el.families || {}

  const cellVM = (c: ElementCell, color: string, famLabel: string) => {
    const g = sub[c.raw]
    const m = marketMap[c.raw]
    const nm = NM[c.raw]
    const fromRecipes = rcName(c.raw)
    const name = (g ? (lang === 'fr' ? g.fr : g.en) : '')
      || (m ? (lang === 'fr' ? m.name_fr : m.name_en) : '')
      || (nm ? nm[lang === 'fr' ? 0 : 1] : '')
      || (fromRecipes !== c.raw ? fromRecipes : '')
    const icon = g?.icon || m?.icon || rcIcon(c.raw) || rawIconFallback(c.raw, color)
    const value = g?.v != null ? g.v : (m?.value != null ? m.value : null)
    const active = state.elSel === c.raw
    return {
      sym: c.sym, name, value: value != null ? fmt(value) : '', hasVal: value != null, icon,
      bg: active ? 'rgba(95,208,224,.18)' : 'rgba(10,14,28,.55)',
      onClick: () => patch({ elSel: active ? null : c.raw, elCtx: { color, famLabel } }),
    }
  }

  const columns = (el.columns || []).map((col) => {
    const f = fams[col.fam] || ({} as { color?: string })
    const head = (lang === 'fr' ? col.head_fr : col.head_en) || col.head_fr
    const color = f.color || '#8a96a8'
    return { head, color, cells: (col.cells || []).map((c) => cellVM(c, color, head)) }
  })

  /** flora plus any extra_rows the dataset adds, rendered as full-width sections */
  const extraSections = [
    ...(el.flora
      ? [{
        key: 'flora',
        head: lang === 'fr' ? el.flora.fr : el.flora.en,
        color: el.flora.color || '#7fbf4a',
        cells: el.flora.cells || [],
      }]
      : []),
    ...(el.extra_rows || []).map((r) => ({
      key: r.key,
      head: lang === 'fr' ? r.fr : r.en,
      color: fams[r.key]?.color || '#8a96a8',
      cells: r.cells || [],
    })),
  ]

  const legend = Object.keys(fams).map((k) => ({
    label: lang === 'fr' ? fams[k].fr : fams[k].en, color: fams[k].color,
  }))

  const sel = useMemo(() => {
    const id = state.elSel
    if (!id) return null
    const g = sub[id]
    const m = marketMap[id]
    const nm = NM[id]
    const ctx = state.elCtx || {}
    const fromRecipes = rcName(id)
    const name = (g ? (lang === 'fr' ? g.fr : g.en) : '')
      || (m ? (lang === 'fr' ? m.name_fr : m.name_en) : '')
      || (nm ? nm[lang === 'fr' ? 0 : 1] : '')
      || (fromRecipes !== id ? fromRecipes : '') || id
    const icon = g?.icon || m?.icon || rcIcon(id) || rawIconFallback(id, ctx.color)
    const source = (g ? (lang === 'fr' ? g.gFr : g.gEn) : '')
      || (m ? (lang === 'fr' ? m.group_fr : m.group_en) : '') || ctx.famLabel || ''
    const ref = data.recipes?.refiner || []
    const prod = ref.filter((r) => r.o && r.o[0] === id).slice(0, 4)
      .map((r) => ({ label: (r.i || []).map((x) => rcName(x[0])).join(' + ') }))
    const used = ref.filter((r) => (r.i || []).some((x) => x[0] === id)).slice(0, 4)
      .map((r) => ({ label: rcName((r.o || [])[0]) }))
    // every place a cell can live: the periodic columns, flora, and the extra full-width rows
    let sym = ''
    const scan = (cells: ElementCell[] | undefined) =>
      (cells || []).forEach((c) => { if (c.raw === id && !sym) sym = c.sym })
    ;(el.columns || []).forEach((col) => scan(col.cells))
    scan(el.flora?.cells)
    ;(el.extra_rows || []).forEach((r) => scan(r.cells))
    return {
      sym, name, icon,
      value: g?.v != null ? fmt(g.v) : (m?.value != null ? fmt(m.value) : '—'),
      desc: (g ? (lang === 'fr' ? g.dFr : g.dEn) : '') || '',
      source,
      famLabel: ctx.famLabel || '', color: ctx.color || '#5fd0e0', prod, used,
    }
  }, [state.elSel, state.elCtx, marketMap, sub, lang, rcIcon, rcName, data, el])

  const cellTile = (c: ReturnType<typeof cellVM>, color: string, key: string) => (
    <div
      key={key}
      title={c.name}
      role="button"
      tabIndex={0}
      onClick={c.onClick}
      className="hv-lift2"
      style={{
        cursor: 'pointer', border: '1px solid ' + color, borderTop: '3px solid ' + color, borderRadius: 9,
        background: c.bg, padding: '8px 8px 9px', textAlign: 'center', transition: 'transform .15s',
      }}
    >
      {!!c.icon && (
        <img src={c.icon} alt="" loading="lazy" style={{
          width: 34, height: 34, objectFit: 'contain', display: 'block', margin: '0 auto 5px',
          filter: 'drop-shadow(0 3px 7px rgba(0,0,0,.6))',
        }} />
      )}
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1 }}>{c.sym}</div>
      {!!c.name && (
        <div style={{
          fontSize: 8.5, color: '#9aa6c8', marginTop: 5, lineHeight: 1.15, minHeight: 18, overflow: 'hidden',
        }}>{c.name}</div>
      )}
      {c.hasVal && (
        <div style={{ fontFamily: mono, fontSize: 9.5, color: '#e8c24a', marginTop: 3 }}>
          {c.value} <span style={{ color: '#7a6a3a', fontSize: 8 }}>{L.el_val}</span>
        </div>
      )}
    </div>
  )

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.el_kicker} title={L.el_title} intro={L.el_intro} />

      {sel && (
        <div style={{
          position: 'relative', marginTop: 22, border: '1px solid ' + sel.color, borderRadius: 16,
          background: 'linear-gradient(120deg,rgba(16,22,44,.75),rgba(9,12,26,.6))', padding: '20px 24px',
          animation: 'nmsPop .25s both',
        }}>
          <button onClick={() => patch({ elSel: null })} aria-label="Fermer" style={{
            position: 'absolute', top: 10, right: 10, cursor: 'pointer', width: 28, height: 28, borderRadius: 8,
            border: '1px solid rgba(120,150,220,.25)', background: 'rgba(10,14,28,.6)', color: '#9aa6c8', fontSize: 12,
          }}>✕</button>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              width: 78, height: 78, flex: '0 0 78px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid ' + sel.color, borderRadius: 14,
              background: 'rgba(10,14,28,.65)',
            }}>
              {sel.icon
                ? <img src={sel.icon} alt={sel.name} style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.65))' }} />
                : <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 26, color: '#fff' }}>{sel.sym}</span>}
            </div>

            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 24, color: '#fff' }}>{sel.name}</span>
                <span style={{
                  fontFamily: mono, fontSize: 12, color: sel.color, border: '1px solid ' + sel.color,
                  padding: '2px 9px', borderRadius: 14,
                }}>{sel.sym}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#9aa6c8' }}>{sel.famLabel}</span>
              </div>

              {!!sel.desc && (
                <p style={{
                  margin: '11px 0 0', maxWidth: 640, fontSize: 12.5, lineHeight: 1.55, color: '#aab6d6',
                }}>{sel.desc}</p>
              )}

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 13 }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.el_d_val}</div>
                  <div style={{ color: '#e8c24a', fontWeight: 700, fontSize: 18, marginTop: 3 }}>
                    {sel.value} <span style={{ fontSize: 11, color: '#7a6a3a' }}>u</span>
                  </div>
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.el_d_src}</div>
                  <div style={{ color: '#dbe4ff', fontSize: 14, marginTop: 3, lineHeight: 1.45 }}>{sel.source}</div>
                </div>
              </div>

              {sel.prod.length > 0 && (
                <>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#8bf0a0', marginTop: 15 }}>{L.el_d_prod}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                    {sel.prod.map((rp, i) => (
                      <button key={i} className="hv-green-border" onClick={() => goRecipesFor(state.elSel!)} style={{
                        cursor: 'pointer', fontSize: 11.5, color: '#bfe6d4', background: 'rgba(87,198,150,.1)',
                        border: '1px solid rgba(87,198,150,.22)', padding: '4px 10px', borderRadius: 14,
                      }}>⚗ {rp.label}</button>
                    ))}
                  </div>
                </>
              )}

              {sel.used.length > 0 && (
                <>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#c9a8ff', marginTop: 13 }}>{L.el_d_used}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                    {sel.used.map((rp, i) => (
                      <button key={i} className="hv-purple-border" onClick={() => goRecipesFor(state.elSel!)} style={{
                        cursor: 'pointer', fontSize: 11.5, color: '#d8c8f2', background: 'rgba(168,119,230,.1)',
                        border: '1px solid rgba(168,119,230,.25)', padding: '4px 10px', borderRadius: 14,
                      }}>⚗ {rp.label}</button>
                    ))}
                  </div>
                </>
              )}

              <a href="#" onClick={(e) => { e.preventDefault(); goRecipesFor(state.elSel!) }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 16, fontFamily: mono,
                fontSize: 11.5, letterSpacing: '.06em', color: '#5fd0e0',
              }}>{L.el_d_go} →</a>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontFamily: mono, fontSize: 10.5, color: '#57628a', marginTop: 14 }}>{L.el_hint}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
        {legend.map((lg) => (
          <span key={lg.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: mono, fontSize: 11, color: '#9aa6c8',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: lg.color }} />{lg.label}
          </span>
        ))}
      </div>

      <div className="nms-scroll" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '24px 0 14px', alignItems: 'flex-start',
      }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 7, minWidth: 96 }}>
            <div style={{
              fontFamily: mono, fontSize: 9.5, letterSpacing: '.06em', color: col.color, textAlign: 'center',
              height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05,
            }}>{col.head}</div>
            {col.cells.map((c, i) => cellTile(c, col.color, ci + '-' + i))}
          </div>
        ))}
      </div>

      {extraSections.map((sec) => (
        <div key={sec.key} style={{ marginTop: 22 }}>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: '.1em', color: sec.color, marginBottom: 10,
          }}>{sec.head}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))', gap: 8 }}>
            {sec.cells.map((c, i) => cellTile(cellVM(c, sec.color, sec.head), sec.color, sec.key + '-' + i))}
          </div>
        </div>
      ))}
    </section>
  )
}
