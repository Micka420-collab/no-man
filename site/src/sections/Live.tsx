import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { fmt } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import { LivePip } from '../components/TopBar'
import type { RedditPost } from '../types'

const mono = "'Space Mono',monospace"

export default function Live() {
  const { state, data, L, lang, date } = useAtlas()

  const live = useMemo(() => {
    const pts = (data.stats_history?.points || []).map((p) => p.players)
    let spark: {
      hasData: boolean; path?: string; area?: string; endX?: number; endY?: number; min?: string; max?: string
    } = { hasData: false }
    if (pts.length > 1) {
      const W = 560, H = 92, pad = 8
      const mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts)
      const rng = mx - mn || 1
      const xs = pts.map((_, i) => +((i / (pts.length - 1)) * W).toFixed(1))
      const ys = pts.map((v) => +(H - pad - ((v - mn) / rng) * (H - 2 * pad)).toFixed(1))
      let path = 'M' + xs[0] + ' ' + ys[0]
      for (let i = 1; i < xs.length; i++) path += ' L' + xs[i] + ' ' + ys[i]
      spark = {
        hasData: true, path, area: path + ' L' + W + ' ' + H + ' L0 ' + H + ' Z',
        endX: xs[xs.length - 1], endY: ys[ys.length - 1], min: fmt(mn), max: fmt(mx),
      }
    }

    // deterministic daily challenge, identical for every Traveller
    const now = new Date()
    const dayIdx = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000)
    const ch = data.challenges?.items || []
    let chal: { icon: string; text: string; diffLabel: string; stars: { color: string }[] } | null = null
    if (ch.length) {
      const c = ch[((dayIdx % ch.length) + ch.length) % ch.length]
      const dl = (lang === 'fr' ? ['', 'Facile', 'Moyen', 'Difficile'] : ['', 'Easy', 'Medium', 'Hard'])[c.diff] || ''
      chal = {
        icon: c.icon, text: lang === 'fr' ? c.fr : c.en, diffLabel: dl,
        stars: [1, 2, 3].map((n) => ({ color: n <= c.diff ? '#ffb347' : 'rgba(120,150,220,.25)' })),
      }
    }

    const hot = data.community?.hot || []
    const rally = hot.length
      ? {
        title: (lang === 'fr' ? (hot[0].title_fr || hot[0].title) : hot[0].title).replace(/\*\*/g, ''),
        url: hot[0].url,
      }
      : null

    const feed = (arr: RedditPost[] | undefined, n: number) => (arr || []).slice(0, n).map((p) => ({
      title: lang === 'fr' ? (p.title_fr || p.title) : p.title,
      author: (p.author || '').replace('/u/', 'u/'),
      date: date(p.date), url: p.url,
    }))

    const cm = data.community || {}
    const ach = (data.achievements?.items || []).slice().sort((a, b) => b.percent - a.percent).slice(0, 10)
      .map((a) => ({
        name: lang === 'fr' ? a.name : (a.name_en || a.name),
        desc: lang === 'fr' ? a.desc : (a.desc_en || a.desc),
        pct: a.percent + '%', bar: Math.max(3, a.percent) + '%',
      }))

    const patch = (data.official?.items || []).slice(0, 7)
      .map((p) => ({ title: p.title, date: p.date, excerpt: p.excerpt, url: p.url }))

    const s = data.stats || {}
    return {
      spark, chal, rally,
      communaute: feed(cm.top_week, 9), coords: feed(cm.coordinates, 8), french: feed(cm.french, 7),
      ach, patch,
      peak24: fmt(s.peak_24h), peakAll: fmt(s.peak_all),
      reviewsPct: s.reviews?.percent_positive != null ? s.reviews.percent_positive + '%' : '—',
      updatedStr: (lang === 'fr' ? 'MAJ ' : 'UPD ') + date(s.updated_at),
    }
  }, [data, lang, date])

  const feedCard = (title: string, color: string, sub: string, rows: { title: string; author: string; date: string; url: string }[], size = 12.5) => (
    <div style={{
      border: '1px solid rgba(120,150,220,.15)', borderRadius: 15,
      background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color }}>{title}</div>
        <div style={{ fontFamily: mono, fontSize: 9.5, color: '#6b78a0' }}>{sub}</div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {rows.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noopener" style={{
            display: 'block', padding: '9px 0', borderBottom: '1px solid rgba(120,150,220,.07)',
          }}>
            <span style={{ display: 'block', color: '#dbe4ff', fontSize: size, lineHeight: 1.4 }}>{p.title}</span>
            <span style={{ display: 'block', fontFamily: mono, fontSize: 10, color: '#6b78a0', marginTop: 3 }}>{p.author} · {p.date}</span>
          </a>
        ))}
      </div>
    </div>
  )

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.dr_kicker} title={L.dr_title} intro={L.dr_intro} />

      <div className="nms-hl-2" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginTop: 30 }}>
        <div style={{
          border: '1px solid rgba(120,150,220,.16)', borderRadius: 16,
          background: 'linear-gradient(180deg,rgba(16,22,44,.6),rgba(9,12,26,.6))', padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9, fontFamily: mono, fontSize: 10.5,
              letterSpacing: '.2em', color: '#8bf0a0',
            }}><LivePip />{L.live_now}</div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#6b78a0' }}>{L.dr_players}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(38px,6vw,56px)', lineHeight: 1, color: '#fff' }}>{fmt(state.live)}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#6b78a0' }}>{live.updatedStr}</div>
          </div>

          {live.spark.hasData && (
            <>
              <svg viewBox="0 0 560 92" preserveAspectRatio="none" style={{ width: '100%', height: 96, marginTop: 12, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="nmsSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#38c6d9" stopOpacity="0.34" />
                    <stop offset="1" stopColor="#38c6d9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={live.spark.area} fill="url(#nmsSpark)" />
                <path
                  d={live.spark.path}
                  pathLength={600}
                  fill="none"
                  stroke="#5fd0e0"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ strokeDasharray: 600, animation: 'nmsDash 1.9s .15s cubic-bezier(.3,.8,.3,1) both' }}
                />
                <circle cx={live.spark.endX} cy={live.spark.endY} r="4" fill="#8bf0a0" />
              </svg>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10,
                color: '#6b78a0', marginTop: 2,
              }}>
                <span>{L.dr_min} {live.spark.min}</span>
                <span>{L.dr_max} {live.spark.max}</span>
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginTop: 14 }}>
            {[[L.peak24, live.peak24, '#e8edfb'], [L.peakall, live.peakAll, '#e8edfb'], [L.positivity, live.reviewsPct, '#8bf0a0']].map(([k, v, c]) => (
              <div key={k} style={{
                border: '1px solid rgba(120,150,220,.14)', borderRadius: 9, padding: '9px 10px',
                background: 'rgba(10,14,28,.5)',
              }}>
                <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.14em', color: '#6b78a0' }}>{k}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: c, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(168,119,230,.26)', borderRadius: 16,
          background: 'linear-gradient(180deg,rgba(30,20,52,.62),rgba(12,10,26,.62))', padding: '22px 24px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.2em', color: '#c9a8ff' }}>{L.dr_challenge}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <div style={{ fontSize: 38, lineHeight: 1 }}>{live.chal?.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>{live.chal?.text}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {(live.chal?.stars || []).map((st, i) => (
                <span key={i} style={{ fontSize: 13, color: st.color }}>◆</span>
              ))}
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.08em', color: '#b79ae0' }}>{live.chal?.diffLabel}</div>
          </div>
        </div>
      </div>

      {live.rally && (
        <a href={live.rally.url} target="_blank" rel="noopener" style={{
          display: 'flex', alignItems: 'center', gap: 16, marginTop: 18,
          border: '1px solid rgba(255,122,26,.3)', borderRadius: 14, padding: '16px 20px',
          background: 'linear-gradient(100deg,rgba(255,122,26,.14),rgba(9,12,26,.5) 65%)',
        }}>
          <span style={{ fontSize: 26, flex: '0 0 auto' }}>🎉</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'block', fontFamily: mono, fontSize: 10, letterSpacing: '.18em', color: '#ffb347',
            }}>{L.countdown_label}</span>
            <span style={{
              display: 'block', color: '#fff', fontSize: 14.5, fontWeight: 600, marginTop: 4, lineHeight: 1.4,
            }}>{live.rally.title}</span>
          </span>
          <span style={{ color: '#5fd0e0', fontFamily: mono }}>↗</span>
        </a>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16, marginTop: 18,
      }}>
        {feedCard(L.dr_community, '#5fd0e0', 'r/NoMansSkyTheGame', live.communaute, 13)}
        {feedCard(L.dr_coords, '#ffb347', 'r/NMSCoordinateExchange', live.coords)}
        {feedCard(L.dr_french, '#8bf0a0', 'r/NoMansSkyFrance', live.french)}
      </div>

      <div className="nms-hl-even" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div style={{
          border: '1px solid rgba(120,150,220,.15)', borderRadius: 15,
          background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '20px 22px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0' }}>{L.dr_ach}</div>
          <div style={{ fontSize: 11.5, color: '#6b78a0', marginTop: 5 }}>{L.dr_ach_sub}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {live.ach.map((a, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ color: '#dbe4ff', fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#8bf0a0' }}>{a.pct}</span>
                </div>
                <div style={{
                  height: 5, borderRadius: 5, background: 'rgba(120,150,220,.12)', marginTop: 5, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: a.bar, background: 'linear-gradient(90deg,#38c6d9,#8bf0a0)', borderRadius: 5,
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#7f8bb0', marginTop: 4 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(120,150,220,.15)', borderRadius: 15,
          background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '20px 22px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347' }}>{L.dr_patch}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {live.patch.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener" style={{
                display: 'block', padding: '11px 0', borderBottom: '1px solid rgba(120,150,220,.07)',
              }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 600 }}>{p.title}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: '#6b78a0' }}>{p.date}</span>
                </span>
                <span style={{
                  display: '-webkit-box', fontSize: 11.5, color: '#8b97ba', marginTop: 5, lineHeight: 1.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{p.excerpt}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
