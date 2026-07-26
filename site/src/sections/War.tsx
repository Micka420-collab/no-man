import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { fmtViews } from '../lib/util'

const mono = "'Space Mono',monospace"

/** The Swarm war bulletin — status, mission dossier, trailer and press coverage. */
export default function War() {
  const { data, L, lang, t2, date } = useAtlas()

  const war = useMemo(() => {
    // war.json is the tracker's own feed; it carries an event only while one is running,
    // so the timeline/expedition derivation below stays the fallback.
    const liveEvent = data.war?.event || null
    const tl = data.timeline?.items || []
    const sw = tl.find((t) => /swarm/i.test(t.name || '')) || tl[0] || {}
    const exps = data.expeditions?.items || []
    const e22 = exps.find((e) => e.num === 22) || exps[exps.length - 1]
    const now = Date.now()
    const st = e22 ? new Date(e22.start).getTime() : 0
    const en = e22 ? new Date(e22.end).getTime() : 0

    let status: string, statusColor: string, statusBg: string
    if (st <= now && now <= en) {
      status = lang === 'fr' ? 'Effort en cours' : 'Effort ongoing'
      statusColor = '#8bf0a0'; statusBg = 'rgba(87,198,106,.14)'
    } else if (now > en) {
      status = lang === 'fr' ? 'Effort résolu' : 'Effort resolved'
      statusColor = '#ff7a4d'; statusBg = 'rgba(255,122,77,.14)'
    } else {
      status = lang === 'fr' ? 'À venir' : 'Upcoming'
      statusColor = '#c9a8ff'; statusBg = 'rgba(168,119,230,.14)'
    }

    const vids = data.videos?.items || []
    const trailer = vids.find((v) => /swarm trailer/i.test(v.title)) || vids.find((v) => /swarm/i.test(v.title))
    const news = (data.news?.items || [])
      .filter((n) => /swarm|hive/i.test((n.title || '') + ' ' + (n.excerpt || '')))
      .slice(0, 4)
      .map((n) => ({ title: n.title, source: n.source, date: date(n.date), url: n.url }))

    return {
      name: liveEvent?.name || sw.name || 'The Swarm',
      version: liveEvent?.version || sw.version || '6.4',
      desc: (liveEvent ? t2(liveEvent, 'desc') : '') || t2(sw, 'desc'),
      dates: e22 ? date(e22.start) + ' → ' + date(e22.end) : '',
      status: liveEvent?.status_fr && lang === 'fr' ? liveEvent.status_fr : (liveEvent?.status || status),
      statusColor, statusBg,
      trailer: trailer
        ? { title: trailer.title, url: trailer.url, thumb: trailer.thumbnail, views: fmtViews(trailer.views) }
        : null,
      news,
    }
  }, [data, lang, t2, date])

  const dossier = [
    { n: 'I', color: '#ff7a4d', bd: 'rgba(255,122,77,.22)', bdIcon: 'rgba(255,122,77,.4)', bg: 'rgba(16,12,20,.5)', t: L.wr_p1_t, b: L.wr_p1_b },
    { n: 'II', color: '#c9a8ff', bd: 'rgba(168,119,230,.24)', bdIcon: 'rgba(168,119,230,.4)', bg: 'rgba(18,14,26,.5)', t: L.wr_p2_t, b: L.wr_p2_b },
    { n: 'III', color: '#5fd0e0', bd: 'rgba(95,208,224,.24)', bdIcon: 'rgba(95,208,224,.4)', bg: 'rgba(12,18,26,.5)', t: L.wr_p3_t, b: L.wr_p3_b },
  ]

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1140, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.24em', color: '#ff8a4d' }}>// {L.wr_kicker}</div>

      <div style={{
        position: 'relative', marginTop: 16, border: '1px solid rgba(255,122,77,.3)', borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(135deg,rgba(255,90,40,.14),rgba(120,30,80,.1) 45%,rgba(9,12,26,.5) 80%)',
        padding: '30px 30px 28px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(90% 120% at 85% 0%,rgba(255,122,26,.2),transparent 60%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <h2 style={{
              margin: 0, fontWeight: 700, fontSize: 'clamp(38px,6vw,62px)', letterSpacing: '-.02em',
              lineHeight: 0.95, background: 'linear-gradient(120deg,#fff,#ff9a4d)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>{war.name}</h2>
            <span style={{ fontFamily: mono, fontSize: 15, color: '#ff9a4d' }}>v{war.version}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px', borderRadius: 20,
              background: war.statusBg, border: '1px solid ' + war.statusColor, fontFamily: mono,
              fontSize: 11, letterSpacing: '.06em', color: war.statusColor,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: war.statusColor }} />
              {war.status}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: 20,
              background: 'rgba(10,14,28,.5)', border: '1px solid rgba(120,150,220,.2)', fontFamily: mono,
              fontSize: 11, color: '#9aa6c8',
            }}>{war.dates}</span>
          </div>
          <p style={{ margin: '18px 0 0', maxWidth: 760, fontSize: 16, lineHeight: 1.62, color: '#d4ddf2' }}>{war.desc}</p>
        </div>
      </div>

      <div style={{
        fontFamily: mono, fontSize: 10.5, letterSpacing: '.22em', color: '#5fd0e0', margin: '30px 0 0',
      }}>// {L.wr_dossier}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginTop: 14,
      }}>
        {dossier.map((d) => (
          <div key={d.n} style={{
            border: '1px solid ' + d.bd, borderRadius: 14, background: d.bg, padding: '20px 20px',
          }}>
            <div style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: mono, fontWeight: 700, color: d.color, border: '1px solid ' + d.bdIcon, borderRadius: 9,
            }}>{d.n}</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#fff', marginTop: 14 }}>{d.t}</div>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#aab6d6' }}>{d.b}</p>
          </div>
        ))}
      </div>

      <div className="nms-hl-2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 22 }}>
        {war.trailer && (
          <a href={war.trailer.url} target="_blank" rel="noopener" style={{
            display: 'block', border: '1px solid rgba(120,150,220,.16)', borderRadius: 15, overflow: 'hidden',
            background: 'rgba(9,12,26,.5)',
          }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0f1f' }}>
              <img src={war.trailer.thumb} alt="" loading="lazy" style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle,rgba(0,0,0,.25),rgba(0,0,0,.5))',
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,122,26,.92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0d02',
                  fontSize: 22, boxShadow: '0 8px 30px rgba(255,122,26,.5)',
                }}>▶</div>
              </div>
              <span style={{
                position: 'absolute', right: 10, bottom: 10, fontFamily: mono, fontSize: 10, color: '#fff',
                background: 'rgba(0,0,0,.7)', padding: '2px 7px', borderRadius: 5,
              }}>{war.trailer.views}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{
                fontFamily: mono, fontSize: 9.5, letterSpacing: '.18em', color: '#ff8a4d',
              }}>{L.wr_watch}</div>
              <div style={{
                color: '#fff', fontSize: 14.5, fontWeight: 600, marginTop: 6, lineHeight: 1.35,
              }}>{war.trailer.title}</div>
            </div>
          </a>
        )}

        <div style={{
          border: '1px solid rgba(120,150,220,.16)', borderRadius: 15,
          background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '18px 20px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0' }}>{L.wr_press}</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
            {war.news.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener" style={{
                display: 'block', padding: '11px 0', borderBottom: '1px solid rgba(120,150,220,.07)',
              }}>
                <div style={{
                  fontFamily: mono, fontSize: 9.5, letterSpacing: '.08em', color: '#ffb347',
                }}>{n.source} · {n.date}</div>
                <div style={{
                  color: '#dbe4ff', fontSize: 13, fontWeight: 600, marginTop: 5, lineHeight: 1.35,
                }}>{n.title}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
