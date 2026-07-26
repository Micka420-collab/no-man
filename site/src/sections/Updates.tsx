import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"
const MONTHS_FR = ['', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MONTHS_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 2016 → 2026 change log; major milestones burn orange. */
export default function Updates() {
  const { data, L, lang, t2 } = useAtlas()

  const rows = useMemo(() => {
    const items = data.timeline?.items || []
    let lastYear: string | null = null
    return items.map((it) => {
      const p = (it.date || '').split('-')
      const y = p[0] || ''
      const mv = parseInt(p[1], 10) || 0
      const md = (lang === 'fr' ? MONTHS_FR : MONTHS_EN)[mv] || ''
      const yearDiv = y !== lastYear
      lastYear = y
      const major = /\.0$/.test(it.version || '')
        || /NEXT|Beyond|Worlds|Foundation|Origins|Waypoint|Voyagers|Sortie|Initial/i.test(it.name || '')
      return {
        version: it.version, name: t2(it, 'name') || it.name, date: (md + ' ' + y).trim(), year: y, yearDiv,
        desc: t2(it, 'desc'), url: it.url || '', hasUrl: !!it.url,
        dotColor: major ? '#ff7a1a' : '#5fd0e0',
        dotShadow: major ? '0 0 12px #ff7a1a' : '0 0 10px rgba(95,208,224,.7)',
      }
    })
  }, [data, lang, t2])

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1040, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.up_kicker} title={L.up_title} intro={L.up_intro} introWidth={640} />

      <div style={{ position: 'relative', paddingLeft: 30, marginTop: 38 }}>
        <div style={{
          position: 'absolute', left: 10, top: 8, bottom: 8, width: 2,
          background: 'linear-gradient(180deg,#ff7a1a,rgba(95,208,224,.5) 30%,rgba(95,208,224,.06))',
        }} />
        {rows.map((it, i) => (
          <div key={i} style={{ margin: '0 0 14px' }}>
            {it.yearDiv && (
              <div style={{ margin: '20px 0 14px -30px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: mono, fontWeight: 700, fontSize: 12.5, letterSpacing: '.12em', color: '#fff',
                  background: 'rgba(255,122,26,.14)', border: '1px solid rgba(255,122,26,.32)',
                  padding: '4px 13px', borderRadius: 20,
                }}>{it.year}</span>
                <span style={{ flex: 1, height: 1, background: 'rgba(120,150,220,.1)' }} />
              </div>
            )}
            <div style={{
              position: 'relative', border: '1px solid rgba(120,150,220,.14)', borderRadius: 12,
              background: 'linear-gradient(180deg,rgba(16,22,42,.5),rgba(9,12,26,.5))', padding: '15px 18px',
            }}>
              <div style={{
                position: 'absolute', left: -25, top: 19, width: 12, height: 12, borderRadius: '50%',
                background: it.dotColor, boxShadow: it.dotShadow, border: '2px solid #05070f',
              }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{it.name}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: it.dotColor }}>v{it.version}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#6b78a0', letterSpacing: '.06em' }}>{it.date}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: '#aab6d6' }}>{it.desc}</p>
              {it.hasUrl && (
                <a href={it.url} target="_blank" rel="noopener" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontFamily: mono,
                  fontSize: 11, letterSpacing: '.06em', color: '#5fd0e0',
                }}>{L.read_patch} <span>↗</span></a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
