import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { daysBetween, fmt, fmtViews } from '../lib/util'
import { LivePip } from '../components/TopBar'
import Thumb from '../components/Thumb'

const mono = "'Space Mono',monospace"

export default function Home() {
  const { state, data, L, lang, nav, t2, date } = useAtlas()

  const acc = useMemo(() => {
    const s = data.stats || {}
    const rev = s.reviews || {}
    const price = s.price || {}

    // featured expedition: live > next > most recent
    let exp = {
      label: L.exp_past, name: '—', dates: '', theme: '', statusLabel: '',
      statusColor: '#c9a8ff', statusBg: 'rgba(168,119,230,.12)', statusBd: 'rgba(168,119,230,.3)',
    }
    const items = data.expeditions?.items || []
    if (items.length) {
      const now = Date.now()
      const cur = items.find((e) => new Date(e.start).getTime() <= now && now <= new Date(e.end).getTime())
      const next = items.find((e) => new Date(e.start).getTime() > now)
      const pick = cur || next || items[items.length - 1]
      const st = new Date(pick.start).getTime(), en = new Date(pick.end).getTime()
      exp.dates = date(pick.start) + ' → ' + date(pick.end)
      exp.theme = t2(pick, 'theme')
      if (cur) {
        const dl = daysBetween(en, now)
        exp = { ...exp, label: L.exp_ongoing, statusColor: '#8bf0a0', statusBg: 'rgba(87,198,106,.12)', statusBd: 'rgba(87,198,106,.34)' }
        exp.statusLabel = lang === 'fr' ? 'Se termine dans ' + dl + ' j' : 'Ends in ' + dl + ' d'
      } else if (next) {
        const dl = daysBetween(st, now)
        exp.label = L.exp_next
        exp.statusLabel = lang === 'fr' ? 'Commence dans ' + dl + ' j' : 'Starts in ' + dl + ' d'
      } else {
        const dl = daysBetween(now, en)
        exp.label = L.exp_past
        exp.statusLabel = lang === 'fr' ? 'Terminée il y a ' + dl + ' j' : 'Ended ' + dl + ' d ago'
      }
      exp.name = '#' + pick.num + ' · ' + pick.name
    }

    const tl = data.timeline?.items || []
    const lt = tl[0] || {}
    const latest = {
      version: lt.version || '', name: t2(lt, 'name') || lt.name || '', date: lt.date || '',
      desc: t2(lt, 'desc') || '', url: lt.url || 'https://www.nomanssky.com/news/',
    }

    const posts = (data.community?.top_week || []).slice(0, 6).map((p, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      title: lang === 'fr' ? (p.title_fr || p.title) : p.title,
      author: (p.author || '').replace('/u/', 'u/'),
      date: date(p.date), url: p.url,
    }))

    const vids = (data.videos?.items || []).slice(0, 4).map((v) => ({
      title: v.title, channel: v.channel, thumb: v.thumbnail, url: v.url, views: fmtViews(v.views),
      date: v.date ? date(v.date) : '',
    }))

    // Hello Games' own announcements lead, then the press — the feed mixes the two
    const news = (data.news?.items || []).slice()
      .sort((a, b) => Number(!!b.is_official) - Number(!!a.is_official))
      .slice(0, 4)
      .map((n) => ({
        title: n.title, source: n.source, excerpt: n.excerpt, date: date(n.date), url: n.url,
        official: !!n.is_official,
      }))

    return {
      peak24: fmt(s.peak_24h), peakAll: fmt(s.peak_all),
      reviewsPct: rev.percent_positive != null ? rev.percent_positive + '%' : '—',
      reviewsDesc: rev.score_desc || '',
      priceFinal: price.final || '—',
      priceDisc: price.discount_percent != null ? price.discount_percent : 0,
      updatedStr: (lang === 'fr' ? 'MAJ ' : 'UPD ') + date(s.updated_at),
      exp, latest, posts, vids, news,
    }
  }, [data, L, lang, t2, date])

  const liveStr = fmt(state.live)
  const cdCell = (v: string, label: string, color: string) => (
    <div className="nms-cd-cell" style={{
      textAlign: 'center', minWidth: 70, border: '1px solid rgba(120,150,220,.16)', borderRadius: 12,
      padding: '12px 8px', background: 'rgba(8,11,22,.55)',
    }}>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 30, color, lineHeight: 1 }}>{v}</div>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.18em', color: '#6b78a0', marginTop: 6 }}>{label}</div>
    </div>
  )

  return (
    <section style={{ animation: 'nmsSecIn .5s both', position: 'relative' }}>
      {/* HERO */}
      <div className="nms-hero nms-pad" style={{
        position: 'relative', padding: '66px 42px 46px', minHeight: '80vh', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div className="nms-hero-grid" style={{
          maxWidth: 1180, margin: '0 auto', width: '100%', display: 'grid',
          gridTemplateColumns: '1.35fr .95fr', gap: 40, alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 11,
              letterSpacing: '.24em', color: '#5fd0e0', animation: 'nmsUp .6s .05s both',
            }}>
              <span style={{ width: 26, height: 1, background: '#5fd0e0', display: 'inline-block' }} />
              {L.hero_kicker}
            </div>
            <h1 style={{
              margin: '16px 0 0', fontWeight: 700, fontSize: 'clamp(52px,7.2vw,104px)', lineHeight: 0.9,
              letterSpacing: '-.02em',
              background: 'linear-gradient(122deg,#ffffff 8%,#ffcf9a 52%,#ff7a1a 96%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              animation: 'nmsUp .7s .12s both',
            }}>NO MAN'S<br />SKY</h1>
            <p style={{
              margin: '22px 0 0', maxWidth: 520, fontSize: 17.5, lineHeight: 1.62, color: '#aab6d6',
              animation: 'nmsUp .7s .22s both',
            }}>{L.hero_sub}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 13, marginTop: 30, animation: 'nmsUp .7s .3s both' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); nav('galaxies') }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 22px', borderRadius: 10,
                background: 'linear-gradient(180deg,#ff8a2e,#f16a12)', color: '#1a0d02', fontWeight: 700,
                fontSize: 14, boxShadow: '0 8px 30px rgba(255,122,26,.34),inset 0 1px 0 rgba(255,255,255,.35)',
              }}>{L.cta_explore} <span style={{ fontFamily: mono }}>↗</span></a>
              <a href="#" onClick={(e) => { e.preventDefault(); nav('direct') }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 22px', borderRadius: 10,
                background: 'rgba(120,150,220,.07)', border: '1px solid rgba(120,160,230,.28)',
                color: '#dbe4ff', fontWeight: 600, fontSize: 14,
              }}>{L.cta_live}</a>
            </div>
          </div>

          {/* LIVE PANEL */}
          <div style={{ position: 'relative', animation: 'nmsUp .8s .34s both' }}>
            <div style={{
              position: 'relative', border: '1px solid rgba(120,160,230,.2)', borderRadius: 18,
              background: 'linear-gradient(180deg,rgba(16,22,44,.72),rgba(9,12,26,.72))',
              backdropFilter: 'blur(8px)', padding: '26px 26px 22px',
              boxShadow: '0 30px 80px -30px rgba(0,0,0,.8)',
            }}>
              <span style={{ position: 'absolute', top: -1, left: -1, width: 16, height: 16, borderTop: '2px solid #ff7a1a', borderLeft: '2px solid #ff7a1a', borderRadius: '5px 0 0 0' }} />
              <span style={{ position: 'absolute', top: -1, right: -1, width: 16, height: 16, borderTop: '2px solid #5fd0e0', borderRight: '2px solid #5fd0e0', borderRadius: '0 5px 0 0' }} />
              <span style={{ position: 'absolute', bottom: -1, left: -1, width: 16, height: 16, borderBottom: '2px solid #5fd0e0', borderLeft: '2px solid #5fd0e0', borderRadius: '0 0 0 5px' }} />
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderBottom: '2px solid #ff7a1a', borderRight: '2px solid #ff7a1a', borderRadius: '0 0 5px 0' }} />

              <div style={{
                display: 'flex', alignItems: 'center', gap: 9, fontFamily: mono, fontSize: 10.5,
                letterSpacing: '.2em', color: '#8bf0a0',
              }}>
                <LivePip />{L.live_now}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(44px,6vw,64px)',
                lineHeight: 1, margin: '10px 0 2px', color: '#fff', letterSpacing: '-.01em',
              }}>{liveStr}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#6b78a0' }}>{acc.updatedStr}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                {[[L.peak24, acc.peak24], [L.peakall, acc.peakAll]].map(([k, v]) => (
                  <div key={k} style={{
                    border: '1px solid rgba(120,150,220,.15)', borderRadius: 10, padding: '11px 12px',
                    background: 'rgba(10,14,28,.5)',
                  }}>
                    <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.16em', color: '#6b78a0' }}>{k}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, marginTop: 3, color: '#e8edfb' }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(120,150,220,.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.16em', color: '#6b78a0' }}>{L.positivity}</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#8bf0a0', marginTop: 2 }}>
                    {acc.reviewsPct} · <span style={{ color: '#aab6d6', fontWeight: 500, fontSize: 13 }}>{acc.reviewsDesc}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.16em', color: '#6b78a0' }}>{L.price}</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#ffb347', marginTop: 2 }}>
                    {acc.priceFinal} <span style={{ color: '#5fd0e0', fontSize: 12 }}>-{acc.priceDisc}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COUNTDOWN */}
        <div style={{ maxWidth: 1180, margin: '44px auto 0', width: '100%', animation: 'nmsUp .8s .42s both' }}>
          <div style={{
            position: 'relative', border: '1px solid rgba(255,122,26,.28)', borderRadius: 16, padding: '20px 26px',
            background: 'linear-gradient(100deg,rgba(255,122,26,.1),rgba(9,12,26,.5) 60%)',
            display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 210 }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.24em', color: '#ffb347' }}>{L.countdown_kicker}</div>
              <div style={{ fontWeight: 700, fontSize: 23, marginTop: 5, color: '#fff' }}>{L.countdown_label}</div>
              <div style={{ fontSize: 13, color: '#9aa6c8', marginTop: 4 }}>{L.countdown_sub}</div>
            </div>
            <div className="nms-cd" style={{ display: 'flex', gap: 10 }}>
              {cdCell(state.cd.d, L.d_days, '#ffb347')}
              {cdCell(state.cd.h, L.d_hrs, '#fff')}
              {cdCell(state.cd.m, L.d_min, '#fff')}
              {cdCell(state.cd.s, L.d_sec, '#5fd0e0')}
            </div>
          </div>
        </div>
      </div>

      {/* HIGHLIGHTS */}
      <div className="nms-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 42px 70px' }}>
        <div className="nms-hl-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <div style={{
            position: 'relative', border: '1px solid rgba(120,150,220,.16)', borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(180deg,rgba(16,22,44,.6),rgba(9,12,26,.6))',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(120% 100% at 90% 0%,rgba(255,122,26,.16),transparent 55%)',
            }} />
            <div style={{ position: 'relative', padding: '24px 26px' }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0' }}>{L.latest_title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 32, color: '#fff', letterSpacing: '-.01em' }}>{acc.latest.name}</div>
                <div style={{ fontFamily: mono, fontSize: 13, color: '#ffb347' }}>v{acc.latest.version}</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{acc.latest.date}</div>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.62, color: '#aab6d6', maxWidth: 640 }}>{acc.latest.desc}</p>
              <a href={acc.latest.url} target="_blank" rel="noopener" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18, fontFamily: mono,
                fontSize: 12, letterSpacing: '.08em', color: '#5fd0e0',
              }}>{L.read_patch} <span>↗</span></a>
            </div>
          </div>

          <div style={{
            position: 'relative', border: '1px solid rgba(168,119,230,.26)', borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(180deg,rgba(30,20,52,.62),rgba(12,10,26,.62))',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(120% 120% at 10% 0%,rgba(168,119,230,.2),transparent 60%)',
            }} />
            <div style={{ position: 'relative', padding: '24px 26px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#c9a8ff' }}>{acc.exp.label}</div>
              <div style={{ fontWeight: 700, fontSize: 26, color: '#fff', marginTop: 12, lineHeight: 1.05 }}>{acc.exp.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#b79ae0', marginTop: 8 }}>{acc.exp.dates}</div>
              <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.55, color: '#aab6d6', flex: 1 }}>{acc.exp.theme}</p>
              <div style={{
                marginTop: 16, display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8,
                padding: '7px 13px', borderRadius: 20, background: acc.exp.statusBg,
                border: '1px solid ' + acc.exp.statusBd, fontFamily: mono, fontSize: 11,
                letterSpacing: '.06em', color: acc.exp.statusColor,
              }}>{acc.exp.statusLabel}</div>
            </div>
          </div>
        </div>

        {/* pulse + videos */}
        <div className="nms-hl-even" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div style={{
            border: '1px solid rgba(120,150,220,.16)', borderRadius: 16,
            background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0' }}>{L.pulse_title}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#6b78a0' }}>r/NoMansSkyTheGame</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {acc.posts.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener" style={{
                  display: 'flex', gap: 13, alignItems: 'flex-start', padding: '10px 8px', borderRadius: 9,
                  borderBottom: '1px solid rgba(120,150,220,.07)',
                }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#3f4a6e', paddingTop: 2 }}>{p.rank}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', color: '#dbe4ff', fontSize: 13.5, lineHeight: 1.4, fontWeight: 500 }}>{p.title}</span>
                    <span style={{ display: 'block', fontFamily: mono, fontSize: 10.5, color: '#6b78a0', marginTop: 3 }}>{p.author} · {p.date}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div style={{
            border: '1px solid rgba(120,150,220,.16)', borderRadius: 16,
            background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0' }}>{L.watch_title}</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {acc.vids.map((v, i) => (
                <a key={i} href={v.url} target="_blank" rel="noopener" style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                  <span style={{
                    position: 'relative', flex: '0 0 108px', height: 61, borderRadius: 8, overflow: 'hidden',
                    background: '#0a0f1f', border: '1px solid rgba(120,150,220,.14)',
                  }}>
                    <Thumb src={v.thumb} />
                    <span style={{
                      position: 'absolute', right: 5, bottom: 5, fontFamily: mono, fontSize: 9, color: '#fff',
                      background: 'rgba(0,0,0,.7)', padding: '1px 5px', borderRadius: 4,
                    }}>{v.views}</span>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      color: '#dbe4ff', fontSize: 13, lineHeight: 1.35, fontWeight: 500, overflow: 'hidden',
                      textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{v.title}</span>
                    <span style={{ display: 'block', fontFamily: mono, fontSize: 10, color: '#6b78a0', marginTop: 4 }}>
                      {v.channel}{v.date ? ' · ' + v.date : ''}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* press */}
        <div style={{
          marginTop: 20, border: '1px solid rgba(120,150,220,.16)', borderRadius: 16,
          background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '22px 24px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0' }}>{L.press_title}</div>
          <div style={{
            marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14,
          }}>
            {acc.news.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener" style={{
                display: 'block', border: '1px solid rgba(120,150,220,.12)', borderRadius: 12,
                padding: '15px 16px', background: 'rgba(10,14,28,.45)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap',
                  fontFamily: mono, fontSize: 10, letterSpacing: '.1em', color: '#ffb347',
                }}>
                  {n.official && (
                    <span style={{
                      color: '#8bf0a0', border: '1px solid rgba(139,240,160,.4)', borderRadius: 4,
                      padding: '1px 5px', fontSize: 8.5, letterSpacing: '.12em',
                    }}>{L.press_official}</span>
                  )}
                  <span>{n.source} · {n.date}</span>
                </div>
                <div style={{ color: '#dbe4ff', fontSize: 14, fontWeight: 600, marginTop: 8, lineHeight: 1.35 }}>{n.title}</div>
                <div style={{
                  color: '#8b97ba', fontSize: 12, marginTop: 7, lineHeight: 1.5, overflow: 'hidden',
                  textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>{n.excerpt}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
