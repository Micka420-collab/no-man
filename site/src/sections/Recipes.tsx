import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { fmt, norm } from '../lib/util'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"

/** Refiner + cooking in one browser: pick an item, walk the tree in either direction. */
export default function Recipes() {
  const { state, patch, data, L, itemsMap, rcName, rcIcon, rcVal, rcOp } = useAtlas()

  const all = useMemo(() => {
    const rec = data.recipes || {}
    return (rec.refiner || []).concat(rec.cooking || [])
  }, [data])

  const chip = (id: string) => ({
    id, label: rcName(id), icon: rcIcon(id),
    onClick: () => patch({ rcSel: id, rcQ: '' }),
  })

  const q = norm(state.rcQ).trim()
  const matches = useMemo(() => {
    if (!q) return []
    const out: string[] = []
    const ids = Object.keys(itemsMap)
    for (let i = 0; i < ids.length && out.length < 14; i++) {
      const it = itemsMap[ids[i]]
      if (norm(it.fr).indexOf(q) >= 0 || norm(it.en).indexOf(q) >= 0) out.push(ids[i])
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, itemsMap])

  /** most-referenced ingredients/products, used as the default shortcut row */
  const popular = useMemo(() => {
    if (!all.length) return []
    const freq: Record<string, number> = {}
    all.forEach((r) => {
      (r.i || []).forEach((x) => { freq[x[0]] = (freq[x[0]] || 0) + 1 })
      const o = (r.o || [])[0]
      if (o) freq[o] = (freq[o] || 0) + 2
    })
    return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 12)
  }, [all])

  const sel = state.rcSel
  const prodAll = useMemo(() => (sel ? all.filter((r) => (r.o || [])[0] === sel) : []), [all, sel])
  const usedAll = useMemo(() => (sel ? all.filter((r) => (r.i || []).some((x) => x[0] === sel)) : []), [all, sel])

  const inputChip = (x: [string, number], key: string) => {
    const id = x[0]
    const hl = id === sel
    const icon = rcIcon(id)
    return (
      <button
        key={key}
        className="hv-cyan-border-strong"
        onClick={() => patch({ rcSel: id, rcQ: '' })}
        style={{
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
          borderRadius: 9, border: '1px solid ' + (hl ? 'rgba(232,194,74,.5)' : 'rgba(120,150,220,.2)'),
          background: hl ? 'rgba(232,194,74,.12)' : 'rgba(120,150,220,.07)',
          color: hl ? '#ffd98a' : '#dbe4ff', fontSize: 12,
        }}
      >
        {!!icon && <img src={icon} alt="" loading="lazy" style={{ width: 17, height: 17, objectFit: 'contain' }} />}
        {rcName(id)} <span style={{ fontFamily: mono, fontSize: 10, color: '#8b97ba' }}>×{x[1] || 1}</span>
      </button>
    )
  }

  const selVal = sel ? rcVal(sel) : null
  const selIcon = sel ? rcIcon(sel) : ''

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1140, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.rc_kicker} title={L.rc_title} intro={L.rc_intro} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 420 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b78a0', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            value={state.rcQ}
            onChange={(e) => patch({ rcQ: e.target.value })}
            placeholder={L.rc_search}
            style={{
              width: '100%', padding: '11px 14px', paddingLeft: 34, borderRadius: 10,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{fmt(all.length)} {L.rc_count}</div>
      </div>

      {matches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {matches.map((id) => {
            const c = chip(id)
            return (
              <button key={id} className="hv-cyan-border" onClick={c.onClick} style={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px',
                borderRadius: 18, border: '1px solid rgba(120,150,220,.22)', background: 'rgba(120,150,220,.07)',
                color: '#dbe4ff', fontSize: 12.5,
              }}>
                {!!c.icon && <img src={c.icon} alt="" loading="lazy" style={{ width: 17, height: 17, objectFit: 'contain' }} />}
                {c.label}
              </button>
            )
          })}
        </div>
      )}

      {!sel && (
        <>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#ffb347', marginTop: 26,
          }}>{L.rc_popular}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
            {popular.map((id) => {
              const c = chip(id)
              return (
                <button key={id} className="hv-popular" onClick={c.onClick} style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                  borderRadius: 11, border: '1px solid rgba(120,150,220,.2)', background: 'rgba(16,22,44,.55)',
                  color: '#dbe4ff', fontSize: 13, fontWeight: 500,
                }}>
                  {!!c.icon && <img src={c.icon} alt="" loading="lazy" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                  {c.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {sel && (
        <>
          <div style={{
            position: 'relative', marginTop: 24, border: '1px solid rgba(232,194,74,.3)', borderRadius: 16,
            background: 'linear-gradient(120deg,rgba(40,32,14,.4),rgba(9,12,26,.6) 60%)', padding: '18px 22px',
            animation: 'nmsPop .25s both',
          }}>
            <button onClick={() => patch({ rcSel: null })} aria-label="Fermer" style={{
              position: 'absolute', top: 10, right: 10, cursor: 'pointer', width: 28, height: 28, borderRadius: 8,
              border: '1px solid rgba(120,150,220,.25)', background: 'rgba(10,14,28,.6)', color: '#9aa6c8', fontSize: 12,
            }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {!!selIcon && (
                <div style={{
                  width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(232,194,74,.35)', borderRadius: 12, background: 'rgba(10,14,28,.65)',
                }}>
                  <img src={selIcon} alt={rcName(sel)} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 22, color: '#fff' }}>{rcName(sel)}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: '#9aa6c8', marginTop: 4 }}>
                  {prodAll.length} {L.rc_prod_n} · {usedAll.length} {L.rc_used_n}
                  {selVal != null && <> · <span style={{ color: '#e8c24a' }}>{fmt(selVal)} u</span></>}
                </div>
              </div>
            </div>
          </div>

          <div className="nms-hl-even" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18, alignItems: 'start',
          }}>
            {/* produced by */}
            <div>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#8bf0a0', marginBottom: 10,
              }}>// {L.rc_prod}</div>
              {prodAll.length === 0 && (
                <div style={{
                  border: '1px dashed rgba(120,150,220,.2)', borderRadius: 12, padding: 16, color: '#6b78a0',
                  fontSize: 12.5,
                }}>{L.rc_none}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prodAll.slice(0, 12).map((r, ri) => (
                  <div key={r.id || ri} style={{
                    border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
                    padding: '13px 15px',
                  }}>
                    <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.1em', color: '#c9a8ff' }}>{rcOp(r.op)}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 9 }}>
                      {(r.i || []).map((x, i) => inputChip(x, ri + '-' + i))}
                      <span style={{ color: '#ff9a4d', fontFamily: mono }}>→</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9,
                        border: '1px solid rgba(232,194,74,.35)', background: 'rgba(232,194,74,.08)',
                        color: '#ffd98a', fontSize: 12, fontWeight: 600,
                      }}>
                        {rcName(sel)} <span style={{ fontFamily: mono, fontSize: 10, color: '#b9a05a' }}>×{(r.o || [])[1] || 1}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* used in */}
            <div>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#c9a8ff', marginBottom: 10,
              }}>// {L.rc_used}</div>
              {usedAll.length === 0 && (
                <div style={{
                  border: '1px dashed rgba(120,150,220,.2)', borderRadius: 12, padding: 16, color: '#6b78a0',
                  fontSize: 12.5,
                }}>{L.rc_none}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {usedAll.slice(0, 12).map((r, ri) => {
                  const oid = (r.o || [])[0]
                  const oicon = rcIcon(oid)
                  return (
                    <div key={r.id || ri} style={{
                      border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
                      padding: '13px 15px',
                    }}>
                      <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.1em', color: '#c9a8ff' }}>{rcOp(r.op)}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 9 }}>
                        {(r.i || []).map((x, i) => inputChip(x, 'u' + ri + '-' + i))}
                        <span style={{ color: '#ff9a4d', fontFamily: mono }}>→</span>
                        <button className="hv-green-out" onClick={() => patch({ rcSel: oid, rcQ: '' })} style={{
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                          borderRadius: 9, border: '1px solid rgba(139,240,160,.3)', background: 'rgba(87,198,106,.08)',
                          color: '#bfe6d4', fontSize: 12,
                        }}>
                          {!!oicon && <img src={oicon} alt="" loading="lazy" style={{ width: 17, height: 17, objectFit: 'contain' }} />}
                          {rcName(oid)} <span style={{ fontFamily: mono, fontSize: 10, color: '#8b97ba' }}>×{(r.o || [])[1] || 1}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
