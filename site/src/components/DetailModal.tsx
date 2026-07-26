import { useAtlas } from '../lib/store'

/** Shared detail sheet for a starship or a creature (also opened from ⌘K results). */
export default function DetailModal() {
  const { state, closeDetail } = useAtlas()
  const d = state.detail
  if (!d) return null

  return (
    <div
      onClick={closeDetail}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(3,5,12,.7)', backdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nms-scroll"
        style={{
          position: 'relative', width: 'min(720px,100%)', maxHeight: '86vh', overflowY: 'auto',
          border: '1px solid rgba(120,160,230,.25)', borderRadius: 18,
          background: 'linear-gradient(180deg,rgba(14,19,38,.97),rgba(8,11,24,.97))',
          boxShadow: '0 40px 120px -20px rgba(0,0,0,.9)',
          animation: 'nmsPop .24s cubic-bezier(.2,.9,.3,1) both',
        }}
      >
        <button
          onClick={closeDetail}
          aria-label="Fermer"
          className="hv-close"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2, cursor: 'pointer', width: 30, height: 30,
            borderRadius: 9, border: '1px solid rgba(120,150,220,.25)', background: 'rgba(10,14,28,.75)',
            color: '#9aa6c8', fontSize: 13,
          }}
        >✕</button>

        {!!d.img && (
          <div style={{
            height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 45%,rgba(56,120,200,.22),transparent 70%)',
            borderBottom: '1px solid rgba(120,150,220,.12)',
          }}>
            <img src={d.img} alt={d.title} style={{
              maxWidth: '88%', maxHeight: '88%', objectFit: 'contain',
              filter: 'drop-shadow(0 16px 34px rgba(0,0,0,.7))',
            }} />
          </div>
        )}

        <div style={{ padding: '22px 26px 26px' }}>
          <div style={{
            fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#5fd0e0',
          }}>{d.kicker}</div>
          <div style={{ fontWeight: 700, fontSize: 28, color: '#fff', marginTop: 8, lineHeight: 1.1 }}>{d.title}</div>
          {!!d.sub && (
            <div style={{ fontSize: 14, color: '#ffcf9a', marginTop: 8, lineHeight: 1.5 }}>{d.sub}</div>
          )}

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 18,
          }}>
            {d.rows.map((r, i) => (
              <div key={i} style={{
                border: '1px solid rgba(120,150,220,.14)', borderRadius: 11, background: 'rgba(10,14,28,.5)',
                padding: '12px 14px',
              }}>
                <div style={{
                  fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '.16em', color: '#6b78a0',
                }}>{r.k}</div>
                <div style={{ fontSize: 13.5, color: '#dbe4ff', marginTop: 5, lineHeight: 1.5 }}>{r.v}</div>
              </div>
            ))}
          </div>

          {d.hasChips && (
            <>
              <div style={{
                fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '.16em',
                color: '#8bf0a0', marginTop: 16,
              }}>{d.chipsLabel}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {d.chips.map((c, i) => (
                  <span key={i} style={{
                    fontSize: 11.5, color: '#bfe6d4', background: 'rgba(87,198,150,.1)',
                    border: '1px solid rgba(87,198,150,.22)', padding: '4px 10px', borderRadius: 14,
                  }}>{c}</span>
                ))}
              </div>
            </>
          )}

          {!!d.link && (
            <a href={d.link} target="_blank" rel="noopener" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18,
              fontFamily: "'Space Mono',monospace", fontSize: 12, color: '#5fd0e0',
            }}>{d.linkLabel} ↗</a>
          )}
        </div>
      </div>
    </div>
  )
}
