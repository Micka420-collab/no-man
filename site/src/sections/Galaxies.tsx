import { useMemo, useState } from 'react'
import { useAtlas } from '../lib/store'
import SectionHeader from '../components/SectionHeader'
import GalaxyCanvas from '../components/GalaxyCanvas'

const mono = "'Space Mono',monospace"

const TYPES: Record<string, { fr: string; en: string; color: string }> = {
  norm: { fr: 'Standard', en: 'Standard', color: '#6aa9ff' },
  lush: { fr: 'Luxuriante', en: 'Lush', color: '#57c66a' },
  harsh: { fr: 'Hostile', en: 'Harsh', color: '#ff7a4d' },
  empty: { fr: 'Vide', en: 'Empty', color: '#9a93c4' },
}

export default function Galaxies() {
  const { state, patch, data, L, lang, selectGalaxy } = useAtlas()
  const [resetToken, setResetToken] = useState(0)

  const raw = useMemo(() => data.galaxies?.items || [], [data])
  const hubsRaw = useMemo(() => data.galaxy_hubs?.hubs || {}, [data])

  const list = useMemo(() => {
    const q = (state.galQ || '').trim().toLowerCase()
    const all = raw.map((g) => {
      const t = TYPES[g.type] || TYPES.norm
      const active = g.n === state.galSel
      return {
        n: g.n, name: g.name, color: t.color, hub: !!hubsRaw[g.n], active,
        rowBg: active ? 'rgba(255,122,26,.13)' : 'transparent',
      }
    })
    return q ? all.filter((g) => g.name.toLowerCase().indexOf(q) >= 0 || String(g.n) === q) : all
  }, [raw, hubsRaw, state.galQ, state.galSel])

  const hubs = useMemo(() => Object.keys(hubsRaw).map((k) => {
    const h = hubsRaw[k]
    const g = raw.find((x) => x.n === +k)
    return {
      n: +k, name: g?.name || '#' + k, pop: h.pop,
      dots: [1, 2, 3].map((x) => ({ color: x <= h.pop ? '#ffb347' : 'rgba(120,150,220,.22)' })),
      tag: lang === 'fr' ? h.tag_fr : h.tag_en,
      desc: lang === 'fr' ? h.desc_fr : h.desc_en,
    }
  }).sort((a, b) => b.pop - a.pop), [hubsRaw, raw, lang])

  const selected = useMemo(() => {
    if (state.galSel == null) return null
    const g = raw.find((x) => x.n === state.galSel)
    if (!g) return null
    const t = TYPES[g.type] || TYPES.norm
    const h = hubsRaw[g.n]
    return {
      n: g.n, name: g.name, typeLabel: lang === 'fr' ? t.fr : t.en, color: t.color, isHub: !!h,
      tag: h ? (lang === 'fr' ? h.tag_fr : h.tag_en) : '',
      civ: h ? (lang === 'fr' ? h.civ_fr : h.civ_en) : '',
      desc: h ? (lang === 'fr' ? h.desc_fr : h.desc_en) : '',
      civs: h?.civs || [],
    }
  }, [state.galSel, raw, hubsRaw, lang])

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1220, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.gl_kicker} title={L.gl_title} intro={L.gl_intro} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
        {Object.keys(TYPES).map((k) => (
          <span key={k} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: mono, fontSize: 11, color: '#9aa6c8',
          }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: TYPES[k].color }} />
            {lang === 'fr' ? TYPES[k].fr : TYPES[k].en}
          </span>
        ))}
      </div>

      <div className="nms-hl-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginTop: 22 }}>
        <div>
          <div style={{
            position: 'relative', border: '1px solid rgba(120,150,220,.18)', borderRadius: 16, overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 45%,rgba(22,28,54,.55),rgba(6,9,18,.72))',
            height: 'clamp(360px,54vh,548px)',
          }}>
            <GalaxyCanvas
              galaxies={raw}
              hubs={hubsRaw}
              selected={state.galSel}
              onSelect={selectGalaxy}
              resetToken={resetToken}
              lang={lang}
            />
            <div style={{
              position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 10,
              pointerEvents: 'none',
            }}>
              <span style={{
                fontFamily: mono, fontSize: 9.5, letterSpacing: '.08em', color: '#57628a',
                background: 'rgba(6,9,18,.7)', border: '1px solid rgba(120,150,220,.14)',
                padding: '4px 9px', borderRadius: 7,
              }}>{L.gl_ctl}</span>
            </div>
            <button className="hv-close" onClick={() => setResetToken((t) => t + 1)} style={{
              position: 'absolute', right: 12, bottom: 12, cursor: 'pointer', fontFamily: mono, fontSize: 10,
              letterSpacing: '.08em', color: '#9aa6c8', background: 'rgba(6,9,18,.75)',
              border: '1px solid rgba(120,150,220,.22)', padding: '6px 11px', borderRadius: 8,
            }}>⟲ {L.gl_reset}</button>
          </div>

          {selected ? (
            <div style={{
              marginTop: 14, border: '1px solid ' + selected.color, borderRadius: 14,
              background: 'linear-gradient(180deg,rgba(16,22,44,.6),rgba(9,12,26,.6))', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 22, color: '#fff' }}>{selected.name}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontFamily: mono, fontSize: 10, letterSpacing: '.08em',
                  color: selected.color, border: '1px solid ' + selected.color,
                }}>{selected.typeLabel}</span>
                {selected.isHub && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, background: 'rgba(255,122,26,.16)',
                    border: '1px solid rgba(255,122,26,.4)', fontFamily: mono, fontSize: 10,
                    letterSpacing: '.1em', color: '#ffb347',
                  }}>★ {L.gl_hub_badge}</span>
                )}
                <span style={{ fontFamily: mono, fontSize: 11, color: '#6b78a0' }}>#{selected.n} / 255</span>
              </div>
              {selected.isHub && (
                <>
                  <div style={{
                    fontFamily: mono, fontSize: 11, letterSpacing: '.08em', color: '#ffb347', marginTop: 12,
                  }}>{selected.tag} · {selected.civ}</div>
                  <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#aab6d6' }}>{selected.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {selected.civs.map((cv) => (
                      <span key={cv} style={{
                        fontSize: 11, color: '#c9a8ff', background: 'rgba(168,119,230,.1)',
                        border: '1px solid rgba(168,119,230,.25)', padding: '3px 9px', borderRadius: 14,
                      }}>{cv}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{
              marginTop: 14, border: '1px dashed rgba(120,150,220,.2)', borderRadius: 14, padding: '18px 20px',
              fontSize: 13, color: '#6b78a0', textAlign: 'center',
            }}>{L.gl_select}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            border: '1px solid rgba(255,122,26,.2)', borderRadius: 15,
            background: 'linear-gradient(180deg,rgba(26,20,40,.55),rgba(9,12,26,.55))', padding: '18px 20px',
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347' }}>{L.gl_hubs}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hubs.map((h) => (
                <a key={h.n} href="#" onClick={(e) => { e.preventDefault(); selectGalaxy(h.n) }} style={{
                  display: 'block', border: '1px solid rgba(120,150,220,.14)', borderRadius: 11,
                  background: 'rgba(10,14,28,.5)', padding: '12px 13px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{h.name}</span>
                    <span style={{ display: 'flex', gap: 3 }}>
                      {h.dots.map((d, i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: d.color }} />
                      ))}
                    </span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#ffb347', marginTop: 5 }}>{h.tag}</div>
                  <div style={{ fontSize: 12, color: '#9aa6c8', marginTop: 5, lineHeight: 1.45 }}>{h.desc}</div>
                </a>
              ))}
            </div>
          </div>

          <div style={{
            border: '1px solid rgba(120,150,220,.16)', borderRadius: 15,
            background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0' }}>{L.gl_all}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#6b78a0' }}>{list.length} / {raw.length}</div>
            </div>
            <input
              type="text"
              value={state.galQ}
              onChange={(e) => {
                const v = e.target.value
                patch({ galQ: v })
                const n = parseInt(v, 10)
                if (!isNaN(n) && String(n) === v.trim() && n >= 1 && n <= 256) selectGalaxy(n)
              }}
              placeholder={L.gl_search}
              style={{
                width: '100%', marginTop: 11, padding: '10px 13px', borderRadius: 9,
                border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
                fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none',
              }}
            />
            <div className="nms-scroll" style={{
              marginTop: 10, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column',
            }}>
              {list.map((g) => (
                <a key={g.n} href="#" onClick={(e) => { e.preventDefault(); selectGalaxy(g.n) }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 8,
                  background: g.rowBg,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flex: '0 0 auto' }} />
                  <span style={{
                    flex: 1, minWidth: 0, color: '#dbe4ff', fontSize: 13, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{g.name}</span>
                  {g.hub && <span style={{ color: '#ffb347', fontSize: 11 }}>★</span>}
                  <span style={{ fontFamily: mono, fontSize: 10, color: '#5a6488' }}>#{g.n}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
