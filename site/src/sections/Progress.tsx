import { useAtlas } from '../lib/store'
import { readJSON, writeJSON } from '../lib/util'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"
const KEY = 'atlas-terminal-progress'

/** Traveller's log — the game's six chapters as a checklist, stored on this device. */
export default function Progress() {
  const { data, L, lang, bump, revision } = useAtlas()

  // revision is read so the component re-renders after each localStorage write
  void revision
  const done = new Set(readJSON<string[]>(KEY, []))

  const toggle = (key: string) => {
    const s = new Set(readJSON<string[]>(KEY, []))
    if (s.has(key)) s.delete(key); else s.add(key)
    writeJSON(KEY, Array.from(s))
    bump()
  }

  const cats = (data.progress?.categories || []).map((c) => {
    const items = (c.items || []).map((it) => {
      const key = c.id + '.' + it.id
      const on = done.has(key)
      return {
        key, label: lang === 'fr' ? it.label : (it.label_en || it.label), on,
        mark: on ? '✓' : '', box: on ? '#8bf0a0' : 'transparent',
        bd: on ? '#57c66a' : 'rgba(120,150,220,.32)',
        tcolor: on ? '#71809f' : '#dbe4ff', deco: on ? 'line-through' : 'none',
      }
    })
    const n = items.filter((i) => i.on).length
    const pct = items.length ? Math.round((n * 100) / items.length) : 0
    return {
      id: c.id, icon: c.icon, title: lang === 'fr' ? c.title : (c.title_en || c.title),
      items, n, total: items.length, pct: pct + '%',
    }
  })

  let all = 0, don = 0
  cats.forEach((c) => { all += c.total; don += c.n })
  const overall = all ? Math.round((don * 100) / all) : 0

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1140, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.pg_kicker} title={L.pg_title} intro={L.pg_intro} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 26,
        border: '1px solid rgba(255,122,26,.28)', borderRadius: 14,
        background: 'linear-gradient(90deg,rgba(32,20,8,.4),rgba(9,12,26,.55))', padding: '16px 20px',
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10,
            letterSpacing: '.16em', color: '#ffb347',
          }}>
            <span>{L.pg_overall}</span>
            <span style={{ color: '#fff' }}>{don} / {all} · {overall}%</span>
          </div>
          <div style={{
            height: 8, borderRadius: 5, background: 'rgba(120,150,220,.14)', marginTop: 9, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: overall + '%', borderRadius: 5,
              background: 'linear-gradient(90deg,#ff7a1a,#ffb347)', boxShadow: '0 0 12px rgba(255,122,26,.6)',
              transition: 'width .4s',
            }} />
          </div>
        </div>
        <button className="hv-danger" onClick={() => { writeJSON(KEY, []); bump() }} style={{
          cursor: 'pointer', padding: '9px 15px', borderRadius: 9, border: '1px solid rgba(120,150,220,.25)',
          background: 'rgba(120,150,220,.07)', color: '#9aa6c8', fontFamily: mono, fontSize: 11,
        }}>⟲ {L.pg_reset}</button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 16, marginTop: 18,
      }}>
        {cats.map((c) => (
          <div key={c.id} style={{
            border: '1px solid rgba(120,150,220,.15)', borderRadius: 15,
            background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '17px 19px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', flex: 1 }}>{c.title}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: '#8bf0a0' }}>{c.pct}</span>
            </div>
            <div style={{
              height: 5, borderRadius: 4, background: 'rgba(120,150,220,.14)', marginTop: 10, overflow: 'hidden',
            }}>
              <div style={{ height: '100%', width: c.pct, borderRadius: 4, background: '#57c66a', transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
              {c.items.map((it) => (
                <button key={it.key} className="hv-soft" onClick={() => toggle(it.key)} style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
                  padding: '7px 8px', borderRadius: 8, border: 0, background: 'transparent',
                }}>
                  <span style={{
                    flex: '0 0 17px', width: 17, height: 17, marginTop: 1, borderRadius: 5,
                    border: '1.5px solid ' + it.bd, background: it.box, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: '#0a2012', fontWeight: 700,
                  }}>{it.mark}</span>
                  <span style={{
                    fontSize: 12.5, lineHeight: 1.5, color: it.tcolor, textDecoration: it.deco,
                  }}>{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
