import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { fmt } from '../lib/util'

interface Item { glyph: string; color: string; txt: string }

/** Marquee of live headline numbers — pauses on hover, hidden until data lands. */
export default function Ticker() {
  const { data, loaded, lang, settings, t2 } = useAtlas()

  const items = useMemo<Item[]>(() => {
    if (!loaded) return []
    const fr = lang === 'fr'
    const s = data.stats || {}
    const t: Item[] = []
    t.push({ glyph: '◉', color: '#8bf0a0', txt: (fr ? 'JOUEURS EN JEU · ' : 'PLAYERS IN-GAME · ') + fmt(s.player_count) })
    t.push({ glyph: '▲', color: '#ffb347', txt: (fr ? 'PIC 24 H · ' : '24H PEAK · ') + fmt(s.peak_24h) })
    const lt = (data.timeline?.items || [])[0]
    if (lt) t.push({ glyph: '◇', color: '#5fd0e0', txt: (fr ? 'DERNIÈRE MÀJ · ' : 'LATEST · ') + (lt.version || '') + ' ' + (t2(lt, 'name') || lt.name || '') })
    const now = Date.now()
    const cur = (data.expeditions?.items || []).find(
      (e) => new Date(e.start).getTime() <= now && now <= new Date(e.end).getTime())
    if (cur) t.push({ glyph: '⬖', color: '#c9a8ff', txt: (fr ? 'EXPÉDITION EN COURS · #' : 'EXPEDITION LIVE · #') + cur.num + ' ' + cur.name })
    if (s.reviews?.percent_positive != null) {
      t.push({ glyph: '✦', color: '#8bf0a0', txt: (fr ? 'AVIS POSITIFS · ' : 'POSITIVE REVIEWS · ') + s.reviews.percent_positive + '%' })
    }
    if (s.price?.final) t.push({ glyph: '◈', color: '#ffd98a', txt: (fr ? 'PRIX ACTUEL · ' : 'CURRENT PRICE · ') + s.price.final })
    const hot = (data.community?.top_week || [])[0]
    if (hot) t.push({ glyph: '☄', color: '#ff9a4d', txt: 'r/NoMansSkyTheGame · ' + String(fr ? (hot.title_fr || hot.title) : hot.title).slice(0, 64) })
    t.push({ glyph: '✺', color: '#6aa9ff', txt: fr ? '255 GALAXIES CARTOGRAPHIÉES' : '255 GALAXIES CHARTED' })
    return t
  }, [data, loaded, lang, t2])

  if (!settings.showTicker || !loaded) return null

  const row = (key: string) => items.map((t, i) => (
    <span key={key + i} style={{
      display: 'inline-flex', alignItems: 'center', gap: 9,
      fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#8fa0c4',
    }}>
      <span style={{ color: t.color }}>{t.glyph}</span>{t.txt}
    </span>
  ))

  return (
    <div aria-hidden="true" style={{
      overflow: 'hidden', borderBottom: '1px solid rgba(120,150,220,.1)', background: 'rgba(8,11,22,.55)',
    }}>
      <div className="hv-marquee" style={{
        display: 'inline-flex', alignItems: 'center', gap: 44, whiteSpace: 'nowrap', padding: '8px 0',
        animation: 'nmsMarq 52s linear infinite', willChange: 'transform',
      }}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
