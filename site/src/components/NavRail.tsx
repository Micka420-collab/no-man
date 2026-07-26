import { useAtlas } from '../lib/store'
import { NAV_GROUPS, iconD } from '../i18n/nav'

export default function NavRail() {
  const { state, lang, L, nav } = useAtlas()

  return (
    <aside
      className="nms-scroll nms-rail"
      style={{
        width: 256, flex: '0 0 256px', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
        borderRight: '1px solid rgba(120,150,220,.13)',
        background: 'linear-gradient(180deg,rgba(8,11,22,.82),rgba(6,8,17,.72))',
        backdropFilter: 'blur(9px)',
      }}
    >
      <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(120,150,220,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, position: 'relative', flex: '0 0 34px' }}>
            <div style={{
              position: 'absolute', inset: 0, border: '1.5px solid #ff7a1a', transform: 'rotate(45deg)',
              borderRadius: 5, boxShadow: '0 0 14px rgba(255,122,26,.55)',
            }} />
            <div style={{ position: 'absolute', inset: 9, background: '#ffb347', transform: 'rotate(45deg)', borderRadius: 2 }} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 15,
              letterSpacing: '.14em', lineHeight: 1,
            }}>
              ATLAS<span style={{ color: '#ff7a1a' }}>·</span>TERMINAL
            </div>
            <div style={{
              fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: '.2em',
              color: '#6b78a0', marginTop: 3,
            }}>{L.brand_sub}</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '14px 12px 30px' }}>
        {NAV_GROUPS.map((grp) => (
          <div key={grp.fr} style={{ margin: '6px 0 14px' }}>
            <div style={{
              fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: '.24em',
              color: '#57628a', padding: '8px 10px 6px',
            }}>{lang === 'fr' ? grp.fr : grp.en}</div>
            {grp.items.map((it) => {
              const active = it.id === state.tab
              return (
                <a
                  key={it.id}
                  href="#"
                  onClick={(e) => { e.preventDefault(); nav(it.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 9,
                    margin: '1px 0', color: active ? '#ffffff' : '#aab6d6',
                    background: active ? 'rgba(255,122,26,.1)' : 'transparent',
                    border: '1px solid ' + (active ? 'rgba(255,122,26,.28)' : 'transparent'),
                    fontSize: 13.5, fontWeight: 500, position: 'relative',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={active ? '#ff7a1a' : '#6b78a0'} strokeWidth="1.7"
                    strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 16px' }}>
                    <path d={iconD(it.id)} />
                  </svg>
                  <span>{lang === 'fr' ? it.fr : it.en}</span>
                  {active && (
                    <span style={{
                      position: 'absolute', left: 0, top: 8, bottom: 8, width: 2.5,
                      background: '#ff7a1a', borderRadius: 3, boxShadow: '0 0 8px #ff7a1a',
                    }} />
                  )}
                </a>
              )
            })}
          </div>
        ))}
        <div style={{
          margin: '18px 10px 0', paddingTop: 16, borderTop: '1px solid rgba(120,150,220,.1)',
          fontFamily: "'Space Mono',monospace", fontSize: 9.5, lineHeight: 1.7, color: '#4d5678',
        }}>
          <div>{L.unofficial}</div>
          <div style={{ marginTop: 6, color: '#3c4468' }}>DATA · ASSISTANT NMS · WIKI</div>
        </div>
      </nav>
    </aside>
  )
}
