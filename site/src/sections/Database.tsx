import { Fragment, useEffect, useMemo, useState } from 'react'
import { useAtlas, type SortKey } from '../lib/store'
import { fmt, norm } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import ItemImg from '../components/ItemImg'

const mono = "'Space Mono',monospace"
const GRID = '52px 1.3fr 1fr 132px 52px'
const GRID_NARROW = '42px 1fr 96px 34px'

/** True sous `bp` px — pour les mises en page que le CSS seul ne peut pas replier (grilles inline). */
function useNarrow(bp = 640): boolean {
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.innerWidth <= bp)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`)
    const on = () => setN(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [bp])
  return n
}

/**
 * Unit shown after a value. Everything catalogued today is priced in credits, but the data names
 * the currency per item, so the label follows it rather than being hardcoded.
 */
const UNIT: Record<string, string> = { Credits: 'u', Nanites: '⬡', Quicksilver: '✦' }

const CAT_LABELS: Record<string, [string, string]> = {
  all: ['Tout', 'All'],
  raw: ['Matériaux bruts', 'Raw materials'],
  products: ['Produits & tech', 'Products & tech'],
  trade: ['Marchandises', 'Trade goods'],
  curiosities: ['Curiosités', 'Curiosities'],
  cooking: ['Cuisine', 'Cooking'],
  fish: ['Poissons', 'Fish'],
}

function dbClass(id: string): string {
  if (/^raw/.test(id)) return 'raw'
  if (/^cook/.test(id)) return 'cooking'
  if (/^cur/.test(id)) return 'curiosities'
  if (/^trade/.test(id)) return 'trade'
  return 'products'
}

/** Every tradeable item with its real icon and value — filter, sort, search, pin favourites. */
export default function Database() {
  const store = useAtlas()
  const { state, patch, L, lang, data, marketMap, itemsMap, favs, toggleFav, goRecipesFor, revision, rcDesc } = store
  // mobile : la table à 5 colonnes ne tient pas — on replie la catégorie sous le nom,
  // pour que la valeur et l'étoile restent TOUJOURS visibles sans scroll horizontal
  const narrow = useNarrow()
  const gridCols = narrow ? GRID_NARROW : GRID

  // ligne dépliée : description réelle du jeu (« à quoi ça sert ») + résumé d'usage
  const [open, setOpen] = useState<string | null>(null)
  const usage = useMemo(() => {
    if (!open) return null
    const rec = data.recipes || {}
    const all = (rec.refiner || []).concat(rec.cooking || [])
    let prod = 0, used = 0
    all.forEach((rr) => {
      if ((rr.o || [])[0] === open) prod++
      if ((rr.i || []).some((x) => x[0] === open)) used++
    })
    return { prod, used }
  }, [open, data])

  const catLabel = (k: string) => (CAT_LABELS[k] || CAT_LABELS.all)[lang === 'fr' ? 0 : 1]

  const all = useMemo(() => {
    const rows: { id: string; cls: string; name: string; icon: string; value: number | null; unit: string; group: string; key: string }[] = []
    const seen: Record<string, 1> = {}
    Object.keys(itemsMap).forEach((id) => {
      seen[id] = 1
      const it = itemsMap[id]
      const cls = dbClass(id)
      const m = marketMap[id]
      rows.push({
        id, cls,
        name: (lang === 'fr' ? it.fr : it.en) || it.fr || id,
        icon: it.icon || m?.icon || '',
        value: m?.value != null ? m.value : (it.v != null ? it.v : null),
        unit: UNIT[m?.currency || 'Credits'] || 'u',
        group: (m ? (lang === 'fr' ? m.group_fr : m.group_en) : '') || catLabel(cls),
        key: '',
      })
    })
    Object.keys(marketMap).forEach((id) => {
      if (seen[id]) return
      const m = marketMap[id]
      const cls = m.cat || dbClass(id)
      rows.push({
        id, cls,
        name: (lang === 'fr' ? m.name_fr : m.name_en) || id,
        icon: m.icon || '',
        value: m.value != null ? m.value : null,
        unit: UNIT[m.currency || 'Credits'] || 'u',
        group: (lang === 'fr' ? m.group_fr : m.group_en) || catLabel(cls),
        key: '',
      })
    })
    // market.json also carries the 225 catchable fish, which live nowhere else in the UI
    const qualityFr: Record<string, string> = {
      Legendary: 'Légendaire', Epic: 'Épique', Rare: 'Rare', Uncommon: 'Peu commun', Common: 'Commun',
    }
    ;(data.market?.fish || []).forEach((f, i) => {
      const id = 'fish' + i
      if (seen[id]) return
      const quality = f.quality || ''
      rows.push({
        id, cls: 'fish',
        name: (lang === 'fr' ? f.name_fr : f.name_en) || f.name_en,
        icon: f.icon || '',
        value: f.value != null ? f.value : null,
        unit: 'u',
        group: [lang === 'fr' ? (qualityFr[quality] || quality) : quality, f.size].filter(Boolean).join(' · ')
          || catLabel('fish'),
        key: '',
      })
    })
    rows.forEach((r) => { r.key = norm(r.name) })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsMap, marketMap, data, lang])

  const counts: Record<string, number> = { all: all.length }
  all.forEach((r) => { counts[r.cls] = (counts[r.cls] || 0) + 1 })

  const list = useMemo(() => {
    const q = norm(state.dbQ).trim()
    let out = all
    if (state.dbCat !== 'all') out = out.filter((r) => r.cls === state.dbCat)
    if (state.dbFavOnly) out = out.filter((r) => favs.has(r.id))
    if (q) out = out.filter((r) => r.key.indexOf(q) >= 0)
    const k = state.dbSortK, dir = state.dbSortD
    return out.slice().sort((a, b) => {
      if (k === 'value') {
        const av = a.value == null ? -1 : a.value
        const bv = b.value == null ? -1 : b.value
        return (av - bv) * dir
      }
      return String(a[k]).localeCompare(String(b[k])) * dir
    })
    // revision keeps the favourites filter in sync with localStorage writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, state.dbCat, state.dbQ, state.dbFavOnly, state.dbSortK, state.dbSortD, favs, revision])

  const rows = list.slice(0, state.dbLimit)

  const col = (kk: SortKey, label: string, align: 'left' | 'right') => {
    const a = state.dbSortK === kk
    return (
      <button
        onClick={() => {
          if (state.dbSortK === kk) patch((s) => ({ dbSortD: (-s.dbSortD) as 1 | -1 }))
          else patch({ dbSortK: kk, dbSortD: kk === 'value' ? -1 : 1 })
        }}
        style={{
          textAlign: align, cursor: 'pointer', border: 0, background: 'transparent', padding: '11px 10px',
          fontFamily: mono, fontSize: 10, letterSpacing: '.14em', color: a ? '#5fd0e0' : '#6b78a0',
        }}
      >{label} {a ? (state.dbSortD === 1 ? '▲' : '▼') : ''}</button>
    )
  }

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1140, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.db_kicker} title={L.db_title} intro={L.db_intro} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
        {['all', 'raw', 'products', 'trade', 'curiosities', 'cooking', 'fish'].map((k) => {
          const a = state.dbCat === k
          return (
            <button key={k} onClick={() => patch({ dbCat: k, dbLimit: 80 })} style={{
              cursor: 'pointer', padding: '7px 14px', borderRadius: 20, fontFamily: mono, fontSize: 11.5,
              letterSpacing: '.04em', color: a ? '#1a0d02' : '#aab6d6',
              background: a ? '#5fd0e0' : 'rgba(120,150,220,.08)',
              border: '1px solid ' + (a ? '#5fd0e0' : 'rgba(120,150,220,.18)'),
            }}>{catLabel(k)} <span style={{ opacity: 0.6, fontSize: 10 }}>{fmt(counts[k] || 0)}</span></button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b78a0', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            value={state.dbQ}
            onChange={(e) => patch({ dbQ: e.target.value, dbLimit: 80 })}
            placeholder={L.db_search}
            style={{
              width: '100%', padding: '11px 14px', paddingLeft: 34, borderRadius: 10,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => patch((s) => ({ dbFavOnly: !s.dbFavOnly, dbLimit: 80 }))}
          style={{
            cursor: 'pointer', padding: '10px 15px', borderRadius: 10,
            border: '1px solid ' + (state.dbFavOnly ? '#ffb347' : 'rgba(255,179,71,.3)'),
            background: state.dbFavOnly ? '#ffb347' : 'rgba(255,179,71,.08)',
            color: state.dbFavOnly ? '#1a0d02' : '#ffb347',
            fontFamily: mono, fontSize: 12, letterSpacing: '.04em',
          }}
        >★ {L.db_favs} ({favs.size})</button>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{fmt(list.length)} {L.db_items}</div>
      </div>

      <div className="nms-scroll" style={{ marginTop: 20, overflowX: 'auto' }}>
        <div style={{
          minWidth: narrow ? 0 : 680, border: '1px solid rgba(120,150,220,.16)', borderRadius: 14, overflow: 'hidden',
          background: 'rgba(9,12,26,.5)',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid rgba(120,150,220,.14)',
            background: 'rgba(12,17,34,.7)',
          }}>
            <div />
            {col('name', L.db_col_name, 'left')}
            {!narrow && col('group', L.db_col_group, 'left')}
            {col('value', L.db_col_value, 'right')}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb347', fontSize: 12 }}>★</div>
          </div>

          {rows.map((r) => {
            const fav = favs.has(r.id)
            const isOpen = open === r.id
            const desc = r.cls === 'fish' ? '' : rcDesc(r.id)
            return (
              <Fragment key={r.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={r.cls === 'fish' ? undefined : isOpen}
                  className="hv-row"
                  onClick={() => { if (r.cls !== 'fish') setOpen(isOpen ? null : r.id) }}
                  style={{
                    cursor: 'pointer', display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center',
                    background: isOpen ? 'rgba(95,208,224,.05)' : 'transparent',
                    borderBottom: isOpen ? 'none' : '1px solid rgba(120,150,220,.06)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
                    <ItemImg src={r.icon} size={narrow ? 26 : 30} />
                  </span>
                  <span style={{ padding: '9px 10px', minWidth: 0 }}>
                    <span style={{
                      display: 'block', color: '#e8edfb', fontSize: 13.5, fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{r.name}</span>
                    {narrow && (
                      <span style={{
                        display: 'block', color: '#8b97ba', fontSize: 10.5, marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{r.group}</span>
                    )}
                  </span>
                  {!narrow && (
                    <span style={{
                      padding: '9px 10px', color: '#8b97ba', fontSize: 12, minWidth: 0, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{r.group}</span>
                  )}
                  <span style={{
                    padding: narrow ? '9px 4px' : '9px 10px', textAlign: 'right', fontFamily: mono,
                    fontSize: narrow ? 11.5 : 12.5, color: '#e8c24a',
                  }}>{r.value != null ? fmt(r.value) : '—'} <span style={{ color: '#7a6a3a', fontSize: 9 }}>{r.unit}</span></span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(r.id) }}
                    aria-label="Favori"
                    style={{
                      cursor: 'pointer', border: 0, background: 'transparent', fontSize: 15,
                      color: fav ? '#ffb347' : 'rgba(120,150,220,.3)', padding: '9px 0',
                    }}
                  >★</button>
                </div>
                {isOpen && (
                  <div style={{
                    borderBottom: '1px solid rgba(120,150,220,.06)', background: 'rgba(95,208,224,.04)',
                    padding: narrow ? '4px 14px 15px 14px' : '4px 14px 15px 62px', animation: 'nmsPop .2s both',
                  }}>
                    <div style={{
                      fontFamily: mono, fontSize: 9.5, letterSpacing: '.18em', color: '#ffb347',
                    }}>// {L.rc_desc_h}</div>
                    <p style={{ margin: '7px 0 0', color: '#c6d1ec', fontSize: 13, lineHeight: 1.6, maxWidth: 820 }}>
                      {desc || L.db_no_desc}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 11 }}>
                      {usage && (
                        <span style={{ fontFamily: mono, fontSize: 11, color: '#9aa6c8' }}>
                          {usage.prod} {L.rc_prod_n} · {usage.used} {L.rc_used_n}
                        </span>
                      )}
                      {usage != null && (usage.prod > 0 || usage.used > 0) && (
                        <button
                          className="hv-cyan-border"
                          onClick={(e) => { e.stopPropagation(); goRecipesFor(r.id) }}
                          style={{
                            cursor: 'pointer', padding: '6px 13px', borderRadius: 9,
                            border: '1px solid rgba(95,208,224,.35)', background: 'rgba(95,208,224,.08)',
                            color: '#5fd0e0', fontFamily: mono, fontSize: 11, letterSpacing: '.05em',
                          }}
                        >{L.db_open_rec}</button>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '46px 20px', color: '#6b78a0', fontSize: 14 }}>{L.db_none}</div>
      )}

      {list.length > state.dbLimit && (
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="hv-cyan-border" onClick={() => patch((s) => ({ dbLimit: s.dbLimit + 140 }))} style={{
            cursor: 'pointer', padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(120,150,220,.25)',
            background: 'rgba(120,150,220,.08)', color: '#dbe4ff', fontFamily: mono, fontSize: 12,
            letterSpacing: '.06em',
          }}>+ {fmt(list.length - state.dbLimit)} {L.db_more}</button>
        </div>
      )}

      <div style={{ fontFamily: mono, fontSize: 10.5, color: '#57628a', marginTop: 16 }}>{L.db_hint}</div>
    </section>
  )
}
