import { fmt, useAtlas } from '../lib/store'

const mono = "'Space Mono',monospace"

function LivePip() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 9, height: 9 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#57c66a' }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: '#57c66a',
        animation: 'nmsPulse 2.4s ease-out infinite',
      }} />
    </span>
  )
}

export { LivePip }

export default function TopBar() {
  const { state, L, lang, patch, setLang } = useAtlas()

  return (
    <div className="nms-topbar" style={{
      position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 26px', borderBottom: '1px solid rgba(120,150,220,.12)',
      background: 'rgba(6,8,17,.72)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, fontFamily: mono, fontSize: 11,
        letterSpacing: '.12em', color: '#9aa6c8',
      }}>
        <LivePip />
        <span style={{ color: '#8bf0a0', fontWeight: 700 }}>{fmt(state.live)}</span>
        <span className="nms-live-label" style={{ color: '#6b78a0' }}>{L.live_now}</span>
      </div>
      <div style={{ flex: 1 }} />
      <div className="nms-topbar-tag" style={{
        fontFamily: mono, fontSize: 10.5, letterSpacing: '.14em', color: '#6b78a0',
      }}>{L.build_tag}</div>

      <button
        className="hv-search"
        onClick={() => patch({ seOpen: true, seQ: '', seIdx: 0 })}
        aria-label="Recherche universelle"
        style={{
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px',
          borderRadius: 8, border: '1px solid rgba(120,150,220,.2)', background: 'rgba(120,150,220,.07)',
          color: '#9aa6c8', fontFamily: mono, fontSize: 11, letterSpacing: '.06em',
        }}
      >
        ⌕ <span className="nms-topbar-tag">{L.se_btn}</span>
        <span className="nms-kbd-hint" style={{
          border: '1px solid rgba(120,150,220,.25)', borderRadius: 5, padding: '1px 6px',
          fontSize: 9.5, color: '#6b78a0',
        }}>⌘K</span>
      </button>

      <div style={{
        display: 'flex', border: '1px solid rgba(120,150,220,.2)', borderRadius: 8, overflow: 'hidden',
        fontFamily: mono, fontSize: 11, fontWeight: 700,
      }}>
        <button onClick={() => setLang('fr')} style={{
          border: 0, cursor: 'pointer', padding: '6px 11px',
          background: lang === 'fr' ? '#ff7a1a' : 'transparent',
          color: lang === 'fr' ? '#1a0d02' : '#9aa6c8', letterSpacing: '.08em',
        }}>FR</button>
        <button onClick={() => setLang('en')} style={{
          border: 0, cursor: 'pointer', padding: '6px 11px',
          background: lang === 'en' ? '#ff7a1a' : 'transparent',
          color: lang === 'en' ? '#1a0d02' : '#9aa6c8', letterSpacing: '.08em',
        }}>EN</button>
      </div>
    </div>
  )
}
