import { useMemo } from 'react'
import { useAtlas, type SortKey } from '../lib/store'
import { fmt, norm } from '../lib/util'
import SectionHeader from '../components/SectionHeader'

const mono = "'Space Mono',monospace"
const GRID = '52px 1.3fr 1fr 132px 52px'

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
  const { state, patch, L, lang, data, marketMap, itemsMap, favs, toggleFav, goRecipesFor, revision } = store

  const catLabel = (k: string) => (CAT_LABELS[k] || CAT_LABELS.all)[lang === 'fr' ? 0 : 1]

  const all = useMemo(() => {
    const rows: { id: string; cls: string; name: string; icon: string; value: number | null; group: string; key: string }[] = []
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
          minWidth: 680, border: '1px solid rgba(120,150,220,.16)', borderRadius: 14, overflow: 'hidden',
          background: 'rgba(9,12,26,.5)',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: GRID, borderBottom: '1px solid rgba(120,150,220,.14)',
            background: 'rgba(12,17,34,.7)',
          }}>
            <div />
            {col('name', L.db_col_name, 'left')}
            {col('group', L.db_col_group, 'left')}
            {col('value', L.db_col_value, 'right')}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb347', fontSize: 12 }}>★</div>
          </div>

          {rows.map((r) => {
            const fav = favs.has(r.id)
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                className="hv-row"
                onClick={() => { if (r.cls !== 'fish') goRecipesFor(r.id) }}
                style={{
                  cursor: 'pointer', display: 'grid', gridTemplateColumns: GRID, alignItems: 'center',
                  background: 'transparent', borderBottom: '1px solid rgba(120,150,220,.06)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
                  {!!r.icon && <img src={r.icon} alt="" loading="lazy" style={{ width: 30, height: 30, objectFit: 'contain' }} />}
                </span>
                <span style={{
                  padding: '9px 10px', color: '#e8edfb', fontSize: 13.5, fontWeight: 600, minWidth: 0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.name}</span>
                <span style={{
                  padding: '9px 10px', color: '#8b97ba', fontSize: 12, minWidth: 0, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.group}</span>
                <span style={{
                  padding: '9px 10px', textAlign: 'right', fontFamily: mono, fontSize: 12.5, color: '#e8c24a',
                }}>{r.value != null ? fmt(r.value) : '—'} <span style={{ color: '#7a6a3a', fontSize: 9 }}>u</span></span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(r.id) }}
                  aria-label="Favori"
                  style={{
                    cursor: 'pointer', border: 0, background: 'transparent', fontSize: 15,
                    color: fav ? '#ffb347' : 'rgba(120,150,220,.3)', padding: '9px 0',
                  }}
                >★</button>
              </div>
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
