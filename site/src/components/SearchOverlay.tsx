import { useEffect, useMemo, useRef } from 'react'
import { useAtlas } from '../lib/store'
import { asset, norm } from '../lib/util'

interface Entry {
  label: string; kind: string; color: string; bd: string; glyph: string; icon: string; key: string
  go: () => void
}

/** ⌘K universal search across ships, fauna, the 255 galaxies, items, guides, expeditions and updates. */
export default function SearchOverlay() {
  const store = useAtlas()
  const { state, patch, data, L, lang, nav, openDetail, goRecipesFor, selectGalaxy, t2 } = store
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo<Entry[]>(() => {
    const ix: Entry[] = []

    ;(data.ships?.items || []).forEach((sp) => {
      const name = t2(sp, 'name')
      ix.push({
        label: name, kind: L.se_k_ship, color: '#ffb347', bd: 'rgba(255,179,71,.3)', glyph: '▲', icon: '',
        key: norm(name),
        go: () => {
          nav('ships')
          openDetail({
            kicker: L.sh_kicker, title: name, sub: t2(sp, 'bonus'), img: asset(sp.image || ''),
            rows: [
              { k: L.sh_price, v: t2(sp, 'price') },
              { k: L.sh_find, v: t2(sp, 'find') },
              { k: L.sh_build, v: t2(sp, 'build') },
            ],
            hasChips: false, chips: [], chipsLabel: '', link: '', linkLabel: '',
          })
        },
      })
    })

    ;(data.creatures?.creatures || []).forEach((c) => {
      const name = t2(c, 'name')
      const chips = (c.harvests || []).map((h) => t2(h, 'item') + ' — ' + t2(h, 'method'))
      ix.push({
        label: name, kind: L.se_k_fauna, color: '#8bf0a0', bd: 'rgba(139,240,160,.3)', glyph: '❋', icon: '',
        key: norm(name + ' ' + (c.example || '')),
        go: () => {
          nav('fauna')
          openDetail({
            kicker: L.fa_kicker, title: name, sub: c.example ? L.fa_example + ' ' + c.example : '',
            img: asset(c.image || ''), rows: [],
            hasChips: chips.length > 0, chipsLabel: L.fa_harvest, chips,
            link: c.wiki || '', linkLabel: L.fa_wiki,
          })
        },
      })
    })

    ;(data.galaxies?.items || []).forEach((g) => {
      ix.push({
        label: g.name + ' · #' + g.n, kind: L.se_k_gal, color: '#c9a8ff', bd: 'rgba(201,168,255,.3)',
        glyph: '✺', icon: '', key: norm(g.name + ' ' + g.n),
        go: () => { nav('galaxies'); selectGalaxy(g.n) },
      })
    })

    const items = data.recipes?.items || {}
    Object.keys(items).forEach((id) => {
      const it = items[id]
      const nm = (lang === 'fr' ? it.fr : it.en) || it.fr || id
      ix.push({
        label: nm, kind: L.se_k_item, color: '#5fd0e0', bd: 'rgba(95,208,224,.3)', glyph: '',
        icon: it.icon || '', key: norm((it.fr || '') + ' ' + (it.en || '')),
        go: () => goRecipesFor(id),
      })
    })

    ;(data.guide?.guides || []).forEach((g, i) => {
      const nm = (lang === 'fr' ? g.name_fr : g.name_en) || ''
      ix.push({
        label: nm, kind: L.se_k_guide, color: '#ff9a4d', bd: 'rgba(255,154,77,.3)', glyph: '❯', icon: '',
        key: norm(nm),
        go: () => patch({ tab: 'guides', guideTab: 'guides', guideSel: i }),
      })
    })

    ;(data.expeditions?.items || []).forEach((e) => {
      ix.push({
        label: '#' + e.num + ' · ' + e.name, kind: L.se_k_exp, color: '#8bf0a0',
        bd: 'rgba(139,240,160,.3)', glyph: '⬖', icon: '', key: norm(e.name),
        go: () => nav('expeditions'),
      })
    })

    ;(data.timeline?.items || []).forEach((u) => {
      const nm = (u.version || '') + ' · ' + (t2(u, 'name') || u.name || '')
      ix.push({
        label: nm, kind: L.se_k_maj, color: '#6aa9ff', bd: 'rgba(106,169,255,.3)', glyph: '◷', icon: '',
        key: norm(nm),
        go: () => nav('updates'),
      })
    })

    return ix
  }, [data, L, lang, nav, openDetail, goRecipesFor, selectGalaxy, patch, t2])

  const q = norm(state.seQ).trim()
  const results = useMemo(
    () => (q ? index.filter((e) => e.key.indexOf(q) >= 0) : index).slice(0, 12),
    [index, q],
  )

  // focus on open
  useEffect(() => {
    const id = setTimeout(() => { try { inputRef.current?.focus() } catch { /* noop */ } }, 40)
    return () => clearTimeout(id)
  }, [])

  // ↑↓ / Enter while the palette is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        patch((s) => ({ seIdx: Math.min(s.seIdx + 1, Math.max(0, results.length - 1)) }))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        patch((s) => ({ seIdx: Math.max(0, s.seIdx - 1) }))
      } else if (e.key === 'Enter') {
        const r = results[state.seIdx]
        if (r) { r.go(); patch({ seOpen: false }) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, state.seIdx, patch])

  return (
    <div
      onClick={() => patch({ seOpen: false })}
      style={{
        position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(3,5,12,.72)', backdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 20px 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px,100%)', border: '1px solid rgba(120,160,230,.25)', borderRadius: 16,
          background: 'linear-gradient(180deg,rgba(14,19,38,.97),rgba(8,11,24,.97))',
          boxShadow: '0 40px 120px -20px rgba(0,0,0,.9)',
          animation: 'nmsPop .22s cubic-bezier(.2,.9,.3,1) both', overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          borderBottom: '1px solid rgba(120,150,220,.12)',
        }}>
          <span style={{ color: '#5fd0e0', fontSize: 15 }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={state.seQ}
            onChange={(e) => patch({ seQ: e.target.value, seIdx: 0 })}
            placeholder={L.se_ph}
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none', color: '#fff',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 16,
            }}
          />
          <span style={{
            fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#6b78a0',
            border: '1px solid rgba(120,150,220,.2)', padding: '2px 7px', borderRadius: 5,
          }}>ESC</span>
        </div>

        <div className="nms-scroll" style={{ maxHeight: '52vh', overflowY: 'auto', padding: 8 }}>
          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '34px 16px', color: '#6b78a0', fontSize: 13.5 }}>
              {L.se_empty}
            </div>
          )}
          {results.map((r, i) => (
            <a
              key={r.kind + r.label + i}
              href="#"
              className="hv-result"
              onClick={(e) => { e.preventDefault(); r.go(); patch({ seOpen: false }) }}
              onMouseEnter={() => patch({ seIdx: i })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                background: i === state.seIdx ? 'rgba(95,208,224,.1)' : 'transparent',
              }}
            >
              {r.icon
                ? <img src={r.icon} alt="" loading="lazy" style={{ width: 26, height: 26, objectFit: 'contain', flex: '0 0 26px' }} />
                : r.glyph
                  ? <span style={{ width: 26, flex: '0 0 26px', textAlign: 'center', fontSize: 15, color: r.color }}>{r.glyph}</span>
                  : null}
              <span style={{
                flex: 1, minWidth: 0, color: '#e8edfb', fontSize: 14, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{r.label}</span>
              <span style={{
                fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', color: r.color,
                border: '1px solid ' + r.bd, padding: '2px 8px', borderRadius: 12, flex: '0 0 auto',
              }}>{r.kind}</span>
            </a>
          ))}
        </div>

        <div style={{
          padding: '9px 16px', borderTop: '1px solid rgba(120,150,220,.1)',
          fontFamily: "'Space Mono',monospace", fontSize: 9.5, color: '#57628a',
        }}>{L.se_hint}</div>
      </div>
    </div>
  )
}
