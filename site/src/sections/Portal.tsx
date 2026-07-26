import { useAtlas } from '../lib/store'
import { fmt } from '../lib/util'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"
const HEX = '0123456789ABCDEF'

const hx = (n: number, w: number) => n.toString(16).toUpperCase().padStart(w, '0')

/**
 * "The Dial of 16" — offline decoding of a 12-glyph portal address into planet index,
 * system id, voxel coordinates, a copyable signal-booster code and distance from the centre.
 */
export default function Portal() {
  const { state, patch, L, lang } = useAtlas()
  const g = state.pg

  const decoded = (() => {
    if (g.length !== 12) return null
    const val = (a: number, b: number) => { let v = 0; for (let i = a; i <= b; i++) v = v * 16 + g[i]; return v }
    const p = g[0], sys = val(1, 3), y = val(4, 5), z = val(6, 8), x = val(9, 11)
    const gX = (x + 0x801) & 0xFFF, gY = (y + 0x81) & 0xFF, gZ = (z + 0x801) & 0xFFF
    const boost = hx(gX, 4) + ':' + hx(gY, 4) + ':' + hx(gZ, 4) + ':' + hx(sys, 4)
    const sx = x > 0x7FF ? x - 0x1000 : x
    const sy = y > 0x7F ? y - 0x100 : y
    const sz = z > 0x7FF ? z - 0x1000 : z
    const ly = Math.sqrt(sx * sx + sy * sy + sz * sz) * 400
    const dist = ly >= 1000
      ? (ly / 1000).toFixed(1) + (lang === 'fr' ? ' k al' : ' kly')
      : Math.round(ly) + (lang === 'fr' ? ' al' : ' ly')
    return {
      addr: g.map((i) => HEX[i]).join(''), planet: String(p), sysDec: fmt(sys), sysHex: '0x' + hx(sys, 3),
      x: String(sx), y: String(sy), z: String(sz), boost, dist: '≈ ' + dist,
    }
  })()

  const onPaste = (raw: string) => {
    const v = raw.trim().toUpperCase().replace(/\s/g, '')
    if (/^[0-9A-F]{12}$/.test(v)) {
      patch({ pg: v.split('').map((c) => HEX.indexOf(c)), ptCopied: false })
      return true
    }
    if (/^[0-9A-F]{4}:[0-9A-F]{4}:[0-9A-F]{4}:[0-9A-F]{4}$/.test(v)) {
      const P = v.split(':').map((x) => parseInt(x, 16))
      const px = (P[0] - 0x801 + 0x1000) & 0xFFF
      const py = (P[1] - 0x81 + 0x100) & 0xFF
      const pz = (P[2] - 0x801 + 0x1000) & 0xFFF
      const sy = P[3] & 0xFFF
      const str = '1' + hx(sy, 3) + hx(py, 2) + hx(pz, 3) + hx(px, 3)
      patch({ pg: str.split('').map((c) => HEX.indexOf(c)), ptCopied: false })
      return true
    }
    return false
  }

  const infoBox = (label: string, value: string, note?: string, valueColor = '#fff', noteMono = false) => (
    <div style={{
      border: '1px solid rgba(120,150,220,.14)', borderRadius: 11, background: 'rgba(10,14,28,.5)',
      padding: '12px 14px',
    }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: valueColor, marginTop: 4 }}>{value}</div>
      {!!note && (
        <div style={{
          fontSize: 10.5, color: '#57628a', marginTop: 2, fontFamily: noteMono ? mono : undefined,
        }}>{note}</div>
      )}
    </div>
  )

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1140, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.pt_kicker} title={L.pt_title} intro={L.pt_intro} />

      <div className="nms-hl-even" style={{
        display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 20, marginTop: 28, alignItems: 'start',
      }}>
        <div style={{
          border: '1px solid rgba(255,122,26,.28)', borderRadius: 16,
          background: 'linear-gradient(180deg,rgba(32,20,8,.4),rgba(9,12,26,.6))', padding: '20px 22px',
        }}>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347',
          }}>{L.pt_addr} · {g.length} / 12</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const filled = i < g.length
              return (
                <div key={i} style={{
                  width: 33, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid ' + (filled ? 'rgba(255,122,26,.5)' : 'rgba(120,150,220,.18)'),
                  borderRadius: 8,
                  background: filled ? 'rgba(255,122,26,.1)' : 'rgba(10,14,28,.5)',
                  fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 19,
                  color: filled ? '#ffd9a8' : '#3c4468',
                }}>{filled ? HEX[g[i]] : '·'}</div>
              )
            })}
          </div>

          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#6b78a0', marginTop: 20,
          }}>{L.pt_pad}</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 7, marginTop: 10, maxWidth: 430,
          }}>
            {HEX.split('').map((ch, i) => (
              <button
                key={ch}
                className="hv-glyph"
                aria-label={'Glyphe ' + ch}
                onClick={() => { if (state.pg.length < 12) patch((s) => ({ pg: s.pg.concat(i), ptCopied: false })) }}
                style={{
                  cursor: 'pointer', opacity: g.length >= 12 ? 0.35 : 1, aspectRatio: '1', borderRadius: 9,
                  border: '1px solid rgba(255,122,26,.35)', background: 'rgba(255,122,26,.07)', color: '#ffb347',
                  fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 17,
                }}
              >{ch}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <button className="hv-cyan-border" onClick={() => patch((s) => ({ pg: s.pg.slice(0, -1), ptCopied: false }))} style={{
              cursor: 'pointer', padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(120,150,220,.25)',
              background: 'rgba(120,150,220,.07)', color: '#dbe4ff', fontFamily: mono, fontSize: 11,
            }}>⌫ {L.pt_back}</button>
            <button className="hv-danger" onClick={() => patch({ pg: [], ptCopied: false })} style={{
              cursor: 'pointer', padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(120,150,220,.25)',
              background: 'rgba(120,150,220,.07)', color: '#dbe4ff', fontFamily: mono, fontSize: 11,
            }}>✕ {L.pt_clear}</button>
          </div>

          <input
            type="text"
            onChange={(e) => { if (onPaste(e.target.value)) e.target.value = '' }}
            placeholder={L.pt_paste}
            style={{
              width: '100%', marginTop: 14, padding: '10px 13px', borderRadius: 9,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: mono, fontSize: 11.5, outline: 'none',
            }}
          />
          <div style={{ fontSize: 11.5, color: '#57628a', marginTop: 12, lineHeight: 1.6 }}>{L.pt_note}</div>
        </div>

        <div>
          {!decoded ? (
            <div style={{
              border: '1px dashed rgba(120,150,220,.28)', borderRadius: 16, padding: '38px 24px',
              textAlign: 'center', color: '#6b78a0', fontSize: 13.5, lineHeight: 1.6,
            }}>◬<br />{L.pt_wait}</div>
          ) : (
            <div style={{
              border: '1px solid rgba(95,208,224,.32)', borderRadius: 16, background: 'rgba(9,12,26,.62)',
              padding: '20px 22px', animation: 'nmsPop .25s both',
            }}>
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0',
              }}>// {L.pt_res}</div>
              <div style={{
                fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '.22em',
                color: '#ffd9a8', marginTop: 10,
              }}>{decoded.addr}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                {infoBox(L.pt_planet, decoded.planet, L.pt_planet_note)}
                {infoBox(L.pt_system, decoded.sysDec, decoded.sysHex, '#fff', true)}
              </div>

              <div style={{
                border: '1px solid rgba(120,150,220,.14)', borderRadius: 11, background: 'rgba(10,14,28,.5)',
                padding: '12px 14px', marginTop: 10,
              }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.pt_pos}</div>
                <div style={{
                  display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 7, fontFamily: mono, fontSize: 15,
                }}>
                  <span style={{ color: '#5fd0e0' }}>X <b style={{ color: '#fff' }}>{decoded.x}</b></span>
                  <span style={{ color: '#8bf0a0' }}>Y <b style={{ color: '#fff' }}>{decoded.y}</b></span>
                  <span style={{ color: '#c9a8ff' }}>Z <b style={{ color: '#fff' }}>{decoded.z}</b></span>
                </div>
              </div>

              <div style={{
                border: '1px solid rgba(232,194,74,.3)', borderRadius: 11, background: 'rgba(232,194,74,.06)',
                padding: '12px 14px', marginTop: 10, display: 'flex', alignItems: 'center', gap: 12,
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#b9a05a' }}>{L.pt_sig}</div>
                  <div style={{
                    fontFamily: mono, fontSize: 15.5, fontWeight: 700, color: '#ffd98a', marginTop: 4,
                  }}>{decoded.boost}</div>
                </div>
                <button
                  className="hv-copy"
                  onClick={() => {
                    try { navigator.clipboard.writeText(decoded.boost) } catch { /* clipboard blocked */ }
                    patch({ ptCopied: true })
                  }}
                  style={{
                    cursor: 'pointer', padding: '8px 15px', borderRadius: 9,
                    border: '1px solid rgba(232,194,74,.45)', background: 'rgba(232,194,74,.12)',
                    color: '#ffd98a', fontFamily: mono, fontSize: 11,
                  }}
                >{state.ptCopied ? L.pt_copied : L.pt_copy}</button>
              </div>

              <div style={{
                border: '1px solid rgba(120,150,220,.14)', borderRadius: 11, background: 'rgba(10,14,28,.5)',
                padding: '12px 14px', marginTop: 10,
              }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.pt_dist}</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#8bf0a0', marginTop: 4 }}>{decoded.dist}</div>
                <div style={{ fontSize: 10.5, color: '#57628a', marginTop: 2 }}>{L.pt_dist_note}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
