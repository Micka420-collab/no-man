import { useEffect, useRef } from 'react'
import { useAtlas } from '../lib/store'
import { NAV_GROUPS, iconD, shortLabel } from '../i18n/nav'

/** Mobile-only horizontal nav (< 860px) — every section, SVG icon + short label. */
export default function BottomNav() {
  const { state, lang, nav } = useAtlas()
  const items = NAV_GROUPS.flatMap((g) => g.items)
  const barRef = useRef<HTMLElement>(null)

  // 15 sections dans une barre défilable : l'onglet actif doit toujours rester visible,
  // sinon on ne sait plus où on est après un changement de section
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLElement>('[data-active="1"]')
    if (!active) return
    const bl = bar.scrollLeft, br = bl + bar.clientWidth
    const al = active.offsetLeft, ar = al + active.offsetWidth
    if (al < bl + 12 || ar > br - 12) {
      bar.scrollTo({ left: al - bar.clientWidth / 2 + active.offsetWidth / 2, behavior: 'smooth' })
    }
  }, [state.tab])

  return (
    <nav ref={barRef} className="nms-bottomnav" style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, gap: 2, overflowX: 'auto',
      padding: '7px 8px calc(7px + env(safe-area-inset-bottom))',
      background: 'rgba(6,8,17,.94)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(120,150,220,.18)',
    }}>
      {items.map((it) => {
        const active = it.id === state.tab
        return (
          <a
            key={it.id}
            href="#"
            data-active={active ? '1' : undefined}
            onClick={(e) => { e.preventDefault(); nav(it.id) }}
            style={{
              flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 58, padding: '7px 8px', borderRadius: 10,
              color: active ? '#ffffff' : '#aab6d6',
              background: active ? 'rgba(255,122,26,.1)' : 'transparent',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
              stroke={active ? '#ff7a1a' : '#6b78a0'} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d={iconD(it.id)} />
            </svg>
            <span style={{
              fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: '.02em', whiteSpace: 'nowrap',
            }}>{shortLabel(it.id, lang)}</span>
          </a>
        )
      })}
    </nav>
  )
}
