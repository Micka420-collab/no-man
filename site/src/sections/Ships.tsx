import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { asset } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import Workshop from '../components/Workshop'
import { SHIP_SC_BY_CLASS, SHIP_TECH_SLOTS } from '../data/catalogue'

const mono = "'Space Mono',monospace"

export default function Ships() {
  const { state, patch, data, L, t2, openDetail } = useAtlas()

  const ships = useMemo(() => data.ships?.items || [], [data])

  const gallery = useMemo(() => {
    const all = ships.map((it) => ({
      id: it.id,
      name: t2(it, 'name'), bonus: t2(it, 'bonus'), price: t2(it, 'price'),
      find: t2(it, 'find'), build: t2(it, 'build'),
      img: asset(it.image || ''), rarity: it.rarity || 1,
    }))
    const q = (state.shipQ || '').trim().toLowerCase()
    const items = q
      ? all.filter((x) => x.name.toLowerCase().indexOf(q) >= 0
        || x.bonus.toLowerCase().indexOf(q) >= 0
        || x.find.toLowerCase().indexOf(q) >= 0)
      : all
    return { items, count: items.length, total: all.length }
  }, [ships, state.shipQ, t2])

  const ug = data.ships?.upgrade_guide || {}
  const steps = (ug.steps || []).map((st, i) => ({
    num: String(i + 1).padStart(2, '0'), icon: st.icon,
    title: t2(st, 'title'), body: t2(st, 'body'),
  }))

  const curT = ships.find((t) => t.id === state.shType) || ships[0] || {}
  const scN = SHIP_SC_BY_CLASS[state.shClass] || 2

  const frFams = data.freighters?.families || []
  const frSteps = data.freighters?.steps || []
  const frTypes = data.freighters?.types || []
  const fgTypes = data.frigates?.types || []
  const fgTips = data.frigates?.tips || []

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.sh_kicker} title={L.sh_title} intro={L.sh_intro} introWidth={660} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b78a0', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            value={state.shipQ}
            onChange={(e) => patch({ shipQ: e.target.value })}
            placeholder={L.sh_search}
            style={{
              width: '100%', padding: '11px 14px', paddingLeft: 34, borderRadius: 10,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{gallery.count} / {gallery.total} {L.sh_types}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18, marginTop: 20,
      }}>
        {gallery.items.map((s) => (
          <div
            key={s.id}
            className="hv-card-gold"
            role="button"
            tabIndex={0}
            onClick={() => openDetail({
              kicker: L.sh_kicker, title: s.name, sub: s.bonus, img: s.img,
              rows: [{ k: L.sh_price, v: s.price }, { k: L.sh_find, v: s.find }, { k: L.sh_build, v: s.build }],
              hasChips: false, chips: [], chipsLabel: '', link: '', linkLabel: '',
            })}
            style={{
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(120,150,220,.15)', borderRadius: 15, overflow: 'hidden',
              background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))',
              transition: 'transform .18s,border-color .18s',
            }}
          >
            <div style={{
              position: 'relative', height: 172, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 42%,rgba(56,120,200,.22),transparent 68%)',
              borderBottom: '1px solid rgba(120,150,220,.1)',
            }}>
              <img src={s.img} alt={s.name} loading="lazy" style={{
                maxWidth: '84%', maxHeight: '84%', objectFit: 'contain',
                filter: 'drop-shadow(0 12px 26px rgba(0,0,0,.65))',
              }} />
              <div style={{ position: 'absolute', top: 11, right: 12, display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ fontSize: 10, color: n <= s.rarity ? '#ffb347' : 'rgba(120,150,220,.22)' }}>◆</span>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 17px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{s.name}</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: '#ffcf9a' }}>{s.bonus}</div>
              <div style={{ marginTop: 2 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.sh_price}</div>
                <div style={{ fontSize: 13, color: '#e8c24a', fontWeight: 600, marginTop: 2 }}>{s.price}</div>
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.sh_find}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#9aa6c8', marginTop: 2 }}>{s.find}</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(120,150,220,.1)', paddingTop: 9 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#ff9a4d' }}>{L.sh_build}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#aab6d6', marginTop: 3 }}>{s.build}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WORKSHOP */}
      <div style={{ marginTop: 36 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#5fd0e0' }}>// {L.shw_kicker}</div>
        <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{L.shw_title}</h3>
        <p style={{ margin: '9px 0 0', maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{L.shw_intro}</p>

        <Workshop
          kind="ship"
          accent="cyan"
          storageKey="atlas-terminal-ship"
          type={state.shType}
          onType={(t) => patch({ shType: t })}
          cls={state.shClass}
          onClass={(c) => patch({ shClass: c })}
          fam={state.shFam}
          onFam={(f) => patch({ shFam: f })}
          types={ships.map((t) => ({ key: t.id, emoji: t.icon || '', label: t2(t, 'name') }))}
          total={SHIP_TECH_SLOTS}
          scN={scN}
          holoEmoji={curT.icon || ''}
          holoName={t2(curT, 'name')}
          holoDesc={t2(curT, 'bonus')}
          note={L.shw_note}
        />
      </div>

      {/* OPTIMISATION GUIDE */}
      <div style={{
        position: 'relative', marginTop: 36, border: '1px solid rgba(255,122,26,.24)', borderRadius: 16,
        overflow: 'hidden', background: 'linear-gradient(160deg,rgba(255,122,26,.09),rgba(9,12,26,.5) 55%)',
        padding: '26px 28px',
      }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#ffb347' }}>// {L.sh_upgrade_kicker}</div>
        <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{t2(ug, 'title')}</h3>
        <p style={{ margin: '9px 0 0', maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{t2(ug, 'intro')}</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 15, marginTop: 22,
        }}>
          {steps.map((st) => (
            <div key={st.num} style={{
              border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
              padding: '16px 17px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{
                  fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#ff7a1a',
                  border: '1px solid rgba(255,122,26,.35)', borderRadius: 7, padding: '4px 8px',
                }}>{st.num}</span>
                <span style={{ fontSize: 20 }}>{st.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14.5, color: '#fff', lineHeight: 1.2 }}>{st.title}</span>
              </div>
              <p style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.55, color: '#9aa6c8' }}>{st.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FREIGHTER COMPARISON — familles documentées + parcours d'obtention */}
      {frFams.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#c9a8ff' }}>// {L.fr_kicker}</div>
          <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{L.fr_title}</h3>
          <p style={{ margin: '9px 0 0', maxWidth: 760, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{L.fr_intro}</p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 15, marginTop: 22,
          }}>
            {frFams.map((f) => (
              <div key={String(f.key)} style={{
                border: '1px solid rgba(168,119,230,.22)', borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(165deg,rgba(60,40,110,.16),rgba(9,12,26,.55) 55%)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderBottom: '1px solid rgba(168,119,230,.16)',
                }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15.5, color: '#fff', lineHeight: 1.2 }}>{t2(f, 'name')}</span>
                </div>
                <div style={{ padding: '13px 16px 16px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                  {([['fr_f_look', 'look'], ['fr_f_sizes', 'sizes'], ['fr_f_slots', 'slots'], ['fr_f_where', 'where'], ['fr_f_how', 'how']] as const).map(([lk, fk]) => (
                    <div key={fk}>
                      <div style={{
                        fontFamily: mono, fontSize: 9, letterSpacing: '.16em',
                        color: fk === 'where' || fk === 'how' ? '#8bf0a0' : '#c9a8ff',
                      }}>{L[lk]}</div>
                      <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.55, color: '#c6d1ec' }}>{t2(f, fk)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {frSteps.length > 0 && (
            <>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#ffb347', marginTop: 30,
              }}>// {L.fr_guide}</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 15, marginTop: 14,
              }}>
                {frSteps.map((st, i) => (
                  <div key={i} style={{
                    border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
                    padding: '16px 17px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span style={{
                        fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#c9a8ff',
                        border: '1px solid rgba(168,119,230,.35)', borderRadius: 7, padding: '4px 8px',
                      }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 20 }}>{st.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: '#fff', lineHeight: 1.2 }}>{t2(st, 'title')}</span>
                    </div>
                    <p style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.55, color: '#9aa6c8' }}>{t2(st, 'body')}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* GALERIE — chaque type documenté avec sa capture du jeu */}
          {frTypes.length > 0 && (
            <>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#5fd0e0', marginTop: 34,
              }}>// {L.fr_types_h}</div>

              {(['capital', 'regular', 'organic'] as const).map((grp) => {
                const list = frTypes.filter((t) => t.group === grp)
                if (!list.length) return null
                const gLabel = grp === 'capital' ? L.fr_g_capital : grp === 'regular' ? L.fr_g_regular : L.fr_g_organic
                const gColor = grp === 'capital' ? '#c9a8ff' : grp === 'regular' ? '#5fd0e0' : '#8bf0a0'
                return (
                  <div key={grp} style={{ marginTop: 20 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 11,
                      letterSpacing: '.1em', color: gColor,
                    }}>
                      <span>▸ {gLabel}</span>
                      <span style={{ opacity: 0.55, fontSize: 10 }}>{list.length}</span>
                      <span style={{ flex: 1, height: 1, background: 'currentColor', opacity: 0.18 }} />
                    </div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
                      gap: 15, marginTop: 13,
                    }}>
                      {list.map((t) => (
                        <figure key={String(t.key)} className="hv-lift2" style={{
                          margin: 0, border: '1px solid ' + gColor + '30', borderRadius: 14, overflow: 'hidden',
                          background: 'rgba(9,12,26,.55)', transition: 'transform .18s,border-color .18s',
                        }}>
                          <img
                            src={asset(String(t.image || ''))}
                            alt={t2(t, 'name')}
                            loading="lazy"
                            style={{
                              display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
                              background: 'rgba(5,7,15,.8)',
                            }}
                          />
                          <figcaption style={{ padding: '13px 15px 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.25 }}>{t2(t, 'name')}</div>
                            <div style={{
                              marginTop: 5, fontFamily: mono, fontSize: 10.5, lineHeight: 1.5, color: gColor,
                            }}>{t2(t, 'size')}</div>
                            <div style={{ marginTop: 10 }}>
                              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.fr_t_look}</div>
                              <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.55, color: '#c6d1ec' }}>{t2(t, 'look')}</div>
                            </div>
                            <div style={{ marginTop: 9 }}>
                              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.fr_t_def}</div>
                              <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.55, color: '#9aa6c8' }}>{t2(t, 'def')}</div>
                            </div>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )
              })}

              {!!data.freighters?.types_note && (
                <div style={{
                  fontFamily: mono, fontSize: 10.5, lineHeight: 1.6, color: '#57628a', marginTop: 16,
                }}>{data.freighters.types_note}</div>
              )}
            </>
          )}

          <div style={{ fontFamily: mono, fontSize: 10.5, color: '#57628a', marginTop: 10 }}>{L.fr_src}</div>
        </div>
      )}

      {/* FRÉGATES — la flotte qui escorte le cargo */}
      {fgTypes.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#8bf0a0' }}>// {L.fg_kicker}</div>
          <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{L.fg_title}</h3>
          <p style={{ margin: '9px 0 0', maxWidth: 760, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{L.fg_intro}</p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 15, marginTop: 22,
          }}>
            {fgTypes.map((f) => (
              <figure key={String(f.key)} className="hv-lift2" style={{
                margin: 0, border: '1px solid rgba(139,240,160,.22)', borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(165deg,rgba(30,80,55,.14),rgba(9,12,26,.55) 55%)',
                transition: 'transform .18s,border-color .18s',
              }}>
                <img
                  src={asset(String(f.image || ''))}
                  alt={t2(f, 'name')}
                  loading="lazy"
                  style={{
                    display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
                    background: 'rgba(5,7,15,.8)',
                  }}
                />
                <figcaption style={{ padding: '13px 15px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {!!f.icon && (
                      <img src={asset(String(f.icon))} alt="" width={22} height={22}
                        style={{ flex: '0 0 auto', imageRendering: 'pixelated' }} />
                    )}
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.25 }}>{t2(f, 'name')}</span>
                  </div>
                  <div style={{
                    marginTop: 6, fontFamily: mono, fontSize: 10.5, lineHeight: 1.5, color: '#8bf0a0',
                  }}>{t2(f, 'trait')}</div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.fg_power}</div>
                    <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.55, color: '#c6d1ec' }}>{t2(f, 'power')}</div>
                  </div>
                  <div style={{ marginTop: 9 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.fg_loot}</div>
                    <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.55, color: '#9aa6c8' }}>{t2(f, 'loot')}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          {fgTips.length > 0 && (
            <>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#ffb347', marginTop: 30,
              }}>// {L.fg_tips}</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 15, marginTop: 14,
              }}>
                {fgTips.map((t, i) => (
                  <div key={i} style={{
                    border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
                    padding: '16px 17px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span style={{
                        fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#8bf0a0',
                        border: '1px solid rgba(139,240,160,.35)', borderRadius: 7, padding: '4px 8px',
                      }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: '#fff', lineHeight: 1.2 }}>{t2(t, 'title')}</span>
                    </div>
                    <p style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.55, color: '#9aa6c8' }}>{t2(t, 'body')}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!!data.frigates?.note && (
            <div style={{
              fontFamily: mono, fontSize: 10.5, lineHeight: 1.6, color: '#57628a', marginTop: 16,
            }}>{data.frigates.note}</div>
          )}
        </div>
      )}
    </section>
  )
}
