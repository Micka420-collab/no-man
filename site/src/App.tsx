import { useEffect } from 'react'
import { AtlasProvider, useAtlas } from './lib/store'
import BackgroundCanvas from './components/BackgroundCanvas'
import NavRail from './components/NavRail'
import TopBar from './components/TopBar'
import Ticker from './components/Ticker'
import BottomNav from './components/BottomNav'
import SearchOverlay from './components/SearchOverlay'
import DetailModal from './components/DetailModal'

import Home from './sections/Home'
import Live from './sections/Live'
import Progress from './sections/Progress'
import Updates from './sections/Updates'
import Ships from './sections/Ships'
import Fauna from './sections/Fauna'
import Galaxies from './sections/Galaxies'
import Elements from './sections/Elements'
import Multitool from './sections/Multitool'
import Expeditions from './sections/Expeditions'
import War from './sections/War'
import Guides from './sections/Guides'
import Database from './sections/Database'
import Recipes from './sections/Recipes'
import Portal from './sections/Portal'

function Section() {
  const { state } = useAtlas()
  switch (state.tab) {
    case 'accueil': return <Home />
    case 'direct': return <Live />
    case 'progress': return <Progress />
    case 'updates': return <Updates />
    case 'ships': return <Ships />
    case 'fauna': return <Fauna />
    case 'galaxies': return <Galaxies />
    case 'elements': return <Elements />
    case 'multitool': return <Multitool />
    case 'expeditions': return <Expeditions />
    case 'war': return <War />
    case 'guides': return <Guides />
    case 'database': return <Database />
    case 'recipes': return <Recipes />
    case 'portal': return <Portal />
    default: return null
  }
}

function Shell() {
  const { state, patch } = useAtlas()

  // ⌘K / Ctrl-K opens the palette anywhere; Escape closes the palette then the detail sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault()
        patch((s) => ({ seOpen: !s.seOpen, seQ: '', seIdx: 0 }))
        return
      }
      if (e.key === 'Escape') {
        if (state.seOpen) { patch({ seOpen: false }); return }
        if (state.detail) patch({ detail: null })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.seOpen, state.detail, patch])

  // keep <html lang> honest for screen readers and hyphenation
  useEffect(() => { document.documentElement.lang = state.lang }, [state.lang])

  return (
    <div style={{ position: 'relative', height: '100vh', background: '#05070f', overflow: 'hidden' }}>
      <BackgroundCanvas />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(120% 80% at 50% -10%,transparent 55%,rgba(3,5,12,.55) 100%),'
          + 'repeating-linear-gradient(0deg,rgba(255,255,255,.014) 0 1px,transparent 1px 3px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', minHeight: '100vh' }}>
        <NavRail />
        <main id="nms-main" className="nms-scroll nms-main-pad" style={{
          flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto',
        }}>
          <TopBar />
          <Ticker />
          <Section />
        </main>

        {state.seOpen && <SearchOverlay />}
        <DetailModal />
        <BottomNav />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AtlasProvider>
      <Shell />
    </AtlasProvider>
  )
}
