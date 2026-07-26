import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"

/** The 22 limited-time expeditions, newest first, colour-coded by live / upcoming / done. */
export default function Expeditions() {
  const { data, L, lang, t2, date } = useAtlas()

  const items = useMemo(() => {
    const now = Date.now()
    return (data.expeditions?.items || []).slice().sort((a, b) => b.num - a.num).map((e) => {
      const st = new Date(e.start).getTime(), en = new Date(e.end).getTime()
      let label: string, color: string, bg: string, bd: string
      if (st <= now && now <= en) {
        label = lang === 'fr' ? 'En cours' : 'Live'
        color = '#8bf0a0'; bg = 'rgba(87,198,106,.14)'; bd = 'rgba(87,198,106,.4)'
      } else if (st > now) {
        label = lang === 'fr' ? 'À venir' : 'Upcoming'
        color = '#c9a8ff'; bg = 'rgba(168,119,230,.14)'; bd = 'rgba(168,119,230,.36)'
      } else {
        label = lang === 'fr' ? 'Terminée' : 'Completed'
        color = '#8b97ba'; bg = 'rgba(120,150,220,.06)'; bd = 'rgba(120,150,220,.16)'
      }
      return {
        num: e.num, numStr: String(e.num).padStart(2, '0'), name: e.name,
        dates: date(e.start) + ' → ' + date(e.end), theme: t2(e, 'theme'),
        label, color, bg, bd,
      }
    })
  }, [data, lang, t2, date])

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.ex_kicker} title={L.ex_title} intro={L.ex_intro} />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16, marginTop: 30,
      }}>
        {items.map((e) => (
          <div key={e.num} style={{
            position: 'relative', border: '1px solid ' + e.bd, borderLeft: '3px solid ' + e.color,
            borderRadius: 13, background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))',
            padding: '18px 20px', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: 14, top: 8, fontFamily: mono, fontWeight: 700, fontSize: 40,
              color: 'rgba(120,150,220,.09)', lineHeight: 1,
            }}>{e.numStr}</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: e.color }}>EXP {e.numStr}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 20, background: e.bg, border: '1px solid ' + e.bd,
                fontFamily: mono, fontSize: 10, letterSpacing: '.06em', color: e.color,
              }}>{e.label}</span>
            </div>
            <div style={{ position: 'relative', fontWeight: 700, fontSize: 20, color: '#fff', marginTop: 9 }}>{e.name}</div>
            <div style={{ position: 'relative', fontFamily: mono, fontSize: 11, color: '#8b97ba', marginTop: 5 }}>{e.dates}</div>
            <p style={{ position: 'relative', margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: '#aab6d6' }}>{e.theme}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
