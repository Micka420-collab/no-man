import { useAtlas } from '../lib/store'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"

export default function Guides() {
  const { state, patch, data, L, lang } = useAtlas()

  const guidesRaw = data.guide?.guides || []
  const gsel = Math.min(state.guideSel || 0, Math.max(0, guidesRaw.length - 1))
  const gg = guidesRaw[gsel] || {}
  const guide = {
    icon: gg.icon,
    name: lang === 'fr' ? gg.name_fr : gg.name_en,
    intro: lang === 'fr' ? gg.intro_fr : gg.intro_en,
    sections: (gg.sections || []).map((s) => ({
      icon: s.icon,
      title: lang === 'fr' ? s.title_fr : s.title_en,
      items: (s.items || []).map((it) => (lang === 'fr' ? it.fr : it.en)),
    })),
  }

  const m = data.missions || {}
  const s16 = m.secret16
  const easter = m.easter
  const cats = m.categories || {}
  let lastCat: string | null = null
  const missions = (m.missions || []).map((mi) => {
    const catDiv = mi.cat !== lastCat
    lastCat = mi.cat
    const open = state.missionOpen === mi.id
    return {
      id: mi.id, icon: mi.icon, catDiv,
      catLabel: cats[mi.cat] ? (lang === 'fr' ? cats[mi.cat].fr : cats[mi.cat].en) : '',
      catIcon: cats[mi.cat]?.icon || '',
      name: lang === 'fr' ? mi.name_fr : mi.name_en,
      goal: lang === 'fr' ? mi.goal_fr : mi.goal_en,
      steps: (mi.steps || []).map((st, si) => ({ n: si + 1, txt: lang === 'fr' ? st.fr : st.en })),
      rewards: lang === 'fr' ? mi.rewards_fr : mi.rewards_en,
      hidden: (mi.hidden || []).map((h) => (lang === 'fr' ? h.fr : h.en)),
      wiki: mi.wiki, open,
      toggleLabel: open ? L.gw_less : L.gw_more,
    }
  })

  const isGuides = state.guideTab === 'guides'

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1080, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.gw_kicker} title={L.gw_title} intro={L.gw_intro} introWidth={660} />

      <div style={{
        display: 'inline-flex', marginTop: 22, border: '1px solid rgba(120,150,220,.2)', borderRadius: 11,
        overflow: 'hidden',
      }}>
        <button onClick={() => patch({ guideTab: 'guides' })} style={{
          cursor: 'pointer', border: 0, padding: '10px 18px', fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 13.5,
          background: isGuides ? '#ff7a1a' : 'transparent', color: isGuides ? '#1a0d02' : '#9aa6c8',
        }}>{L.gw_tab_guides}</button>
        <button onClick={() => patch({ guideTab: 'wiki' })} style={{
          cursor: 'pointer', border: 0, padding: '10px 18px', fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 13.5,
          background: !isGuides ? '#ff7a1a' : 'transparent', color: !isGuides ? '#1a0d02' : '#9aa6c8',
        }}>{L.gw_tab_wiki}</button>
      </div>

      {isGuides ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
            {guidesRaw.map((g, i) => {
              const a = i === gsel
              return (
                <button key={g.id || i} onClick={() => patch({ guideSel: i })} style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px',
                  borderRadius: 20, fontSize: 13, fontWeight: 500,
                  color: a ? '#1a0d02' : '#aab6d6',
                  background: a ? '#ff7a1a' : 'rgba(120,150,220,.07)',
                  border: '1px solid ' + (a ? '#ff7a1a' : 'rgba(120,150,220,.18)'),
                }}>
                  <span style={{ fontSize: 14 }}>{g.icon}</span>{lang === 'fr' ? g.name_fr : g.name_en}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 34 }}>{guide.icon}</span>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 26, color: '#fff' }}>{guide.name}</h3>
            </div>
            <p style={{ margin: '12px 0 0', maxWidth: 720, fontSize: 15, lineHeight: 1.62, color: '#aab6d6' }}>{guide.intro}</p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 16, marginTop: 22,
            }}>
              {guide.sections.map((s, i) => (
                <div key={i} style={{
                  border: '1px solid rgba(120,150,220,.15)', borderRadius: 14,
                  background: 'linear-gradient(180deg,rgba(16,22,44,.5),rgba(9,12,26,.5))', padding: '18px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 19 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15.5, color: '#fff', lineHeight: 1.2 }}>{s.title}</span>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {s.items.map((it, j) => (
                      <div key={j} style={{ display: 'flex', gap: 9, fontSize: 13, lineHeight: 1.55, color: '#aab6d6' }}>
                        <span style={{ color: '#ff9a4d', flex: '0 0 auto' }}>▹</span><span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {s16 && (
            <div style={{
              position: 'relative', marginTop: 24, border: '1px solid rgba(255,122,26,.3)', borderRadius: 18,
              overflow: 'hidden',
              background: 'linear-gradient(135deg,rgba(255,122,26,.14),rgba(120,40,160,.1) 55%,rgba(9,12,26,.5))',
            }}>
              <div style={{
                position: 'absolute', right: -30, top: -40, fontFamily: mono, fontWeight: 700, fontSize: 220,
                color: 'rgba(255,180,90,.07)', lineHeight: 1, pointerEvents: 'none',
              }}>16</div>
              <div style={{ position: 'relative', padding: '28px 30px' }}>
                <div style={{
                  fontFamily: mono, fontSize: 10.5, letterSpacing: '.24em', color: '#ffb347',
                }}>★ {L.gw_secret_badge}</div>
                <h3 style={{
                  margin: '10px 0 0', fontWeight: 700, fontSize: 'clamp(26px,3.5vw,38px)', color: '#fff',
                }}>{lang === 'fr' ? s16.title_fr : s16.title_en}</h3>
                <p style={{
                  margin: '12px 0 0', maxWidth: 760, fontSize: 15, lineHeight: 1.62, color: '#d4ddf2',
                }}>{lang === 'fr' ? s16.lead_fr : s16.lead_en}</p>
                <div style={{
                  margin: '18px 0 0', padding: '14px 18px', borderLeft: '3px solid #ffb347',
                  background: 'rgba(10,14,28,.4)', borderRadius: '0 10px 10px 0',
                }}>
                  <div style={{
                    fontSize: 16, fontStyle: 'italic', color: '#ffcf9a', lineHeight: 1.5,
                  }}>{lang === 'fr' ? s16.quote_fr : s16.quote_en}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: '#8b97ba', marginTop: 6 }}>— {s16.quote_src}</div>
                </div>
                <div style={{
                  fontFamily: mono, fontSize: 10.5, letterSpacing: '.18em', color: '#5fd0e0', margin: '20px 0 10px',
                }}>{L.gw_facts}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
                  {(s16.facts || []).map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5, color: '#aab6d6',
                      background: 'rgba(10,14,28,.35)', border: '1px solid rgba(120,150,220,.1)',
                      borderRadius: 10, padding: '11px 13px',
                    }}>
                      <span style={{ fontFamily: mono, color: '#ff9a4d', flex: '0 0 auto' }}>16</span>
                      <span>{lang === 'fr' ? f.fr : f.en}</span>
                    </div>
                  ))}
                </div>
                <p style={{
                  margin: '18px 0 0', maxWidth: 820, fontSize: 13.5, lineHeight: 1.6, color: '#9aa6c8',
                }}>{lang === 'fr' ? s16.npc_fr : s16.npc_en}</p>
              </div>
            </div>
          )}

          <div style={{
            fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0', margin: '30px 0 6px',
          }}>// {L.gw_missions}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missions.map((mi) => (
              <div key={mi.id}>
                {mi.catDiv && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
                    <span style={{ fontSize: 16 }}>{mi.catIcon}</span>
                    <span style={{
                      fontFamily: mono, fontSize: 11, letterSpacing: '.16em', color: '#c9a8ff',
                    }}>{mi.catLabel}</span>
                    <span style={{ flex: 1, height: 1, background: 'rgba(120,150,220,.12)' }} />
                  </div>
                )}
                <div style={{
                  border: '1px solid rgba(120,150,220,.15)', borderRadius: 13,
                  background: 'linear-gradient(180deg,rgba(16,22,44,.5),rgba(9,12,26,.5))', overflow: 'hidden',
                }}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); patch({ missionOpen: mi.open ? null : mi.id }) }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px 18px' }}
                  >
                    <span style={{ fontSize: 24, flex: '0 0 auto' }}>{mi.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 16, color: '#fff' }}>{mi.name}</span>
                      <span style={{
                        display: 'block', fontSize: 13, color: '#9aa6c8', marginTop: 4, lineHeight: 1.5,
                      }}>{mi.goal}</span>
                    </span>
                    <span style={{
                      fontFamily: mono, fontSize: 11, color: '#5fd0e0', flex: '0 0 auto', whiteSpace: 'nowrap',
                    }}>{mi.toggleLabel}</span>
                  </a>

                  {mi.open && (
                    <div style={{ padding: '2px 18px 18px 55px', borderTop: '1px solid rgba(120,150,220,.1)' }}>
                      <div style={{
                        fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#5fd0e0', margin: '14px 0 8px',
                      }}>{L.gw_steps}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {mi.steps.map((st) => (
                          <div key={st.n} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5, color: '#aab6d6' }}>
                            <span style={{
                              fontFamily: mono, fontSize: 11, color: '#ff9a4d',
                              border: '1px solid rgba(255,122,26,.3)', borderRadius: 6, padding: '1px 7px',
                              flex: '0 0 auto', height: 'fit-content',
                            }}>{st.n}</span>
                            <span>{st.txt}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#8bf0a0', margin: '16px 0 6px',
                      }}>{L.gw_rewards}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#bfe6d4' }}>{mi.rewards}</div>
                      <div style={{
                        fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#c9a8ff', margin: '16px 0 6px',
                      }}>{L.gw_hidden}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {mi.hidden.map((h, i) => (
                          <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12.5, lineHeight: 1.5, color: '#c3b3e6' }}>
                            <span style={{ flex: '0 0 auto' }}>✦</span><span>{h}</span>
                          </div>
                        ))}
                      </div>
                      <a href={mi.wiki} target="_blank" rel="noopener" style={{
                        display: 'inline-block', marginTop: 14, fontFamily: mono, fontSize: 11, color: '#5fd0e0',
                      }}>{L.gw_wikilink} ↗</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {easter && (
            <div style={{
              marginTop: 26, border: '1px solid rgba(168,119,230,.26)', borderRadius: 16,
              background: 'linear-gradient(180deg,rgba(28,20,44,.55),rgba(9,12,26,.55))', padding: '26px 28px',
            }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 24, color: '#fff' }}>
                {lang === 'fr' ? easter.title_fr : easter.title_en}
              </h3>
              <p style={{ margin: '10px 0 0', maxWidth: 760, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>
                {lang === 'fr' ? easter.lead_fr : easter.lead_en}
              </p>
              <div className="nms-hl-even" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18,
              }}>
                {([
                  { label: L.gw_refs, color: '#c9a8ff', rows: easter.refs || [] },
                  { label: L.gw_lore, color: '#5fd0e0', rows: easter.lore || [] },
                ]).map((col) => (
                  <div key={col.label}>
                    <div style={{
                      fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: col.color, marginBottom: 10,
                    }}>{col.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {col.rows.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12.5, lineHeight: 1.55, color: '#aab6d6' }}>
                          <span style={{ color: col.color, flex: '0 0 auto' }}>◆</span>
                          <span>{lang === 'fr' ? r.fr : r.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
