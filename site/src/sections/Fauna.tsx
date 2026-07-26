import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { asset } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import type { Creature } from '../types'

const mono = "'Space Mono',monospace"

/** Group a creature by what it yields — drives the filter chips. */
function faunaFam(c: Creature): string {
  const t = (c.harvests || []).map((h) => (h.item_en || '') + ' ' + (h.method_en || '')).join(' ').toLowerCase()
  if (/milk|proto-milk|craw/.test(t)) return 'milk'
  if (/egg|roe/.test(t)) return 'eggs'
  if (/honey|nectar/.test(t)) return 'nectar'
  if (/salty|innard|marrow|rancid|qualia/.test(t)) return 'sea'
  if (/wire|nanite/.test(t)) return 'mech'
  return 'other'
}

const FAM_LABELS: Record<string, Record<string, string>> = {
  fr: { milk: 'Lait', eggs: 'Œufs', nectar: 'Nectar', sea: 'Aquatique', mech: 'Méca', other: 'Autre' },
  en: { milk: 'Milk', eggs: 'Eggs', nectar: 'Nectar', sea: 'Aquatic', mech: 'Mech', other: 'Other' },
}

const CHIP_DEFS = [
  { k: 'all', fr: 'Tout', en: 'All' },
  { k: 'milk', fr: 'Lait', en: 'Milk' },
  { k: 'eggs', fr: 'Œufs', en: 'Eggs' },
  { k: 'nectar', fr: 'Miel & nectar', en: 'Honey & nectar' },
  { k: 'sea', fr: 'Aquatique', en: 'Aquatic' },
  { k: 'mech', fr: 'Mécanique', en: 'Mechanical' },
  { k: 'other', fr: 'Autres', en: 'Other' },
]

export default function Fauna() {
  const { state, patch, data, L, lang, t2, openDetail } = useAtlas()

  const famLabels = FAM_LABELS[lang]

  const { list, total } = useMemo(() => {
    const raw = data.creatures?.creatures || []
    let arr = raw.map((c) => {
      const fm = faunaFam(c)
      return {
        raw: c, type: c.type, name: t2(c, 'name'), example: c.example || '', wiki: c.wiki || '',
        hasWiki: !!c.wiki, emoji: c.emoji || '✦', img: asset(c.image || ''), hasImg: !!c.image,
        fam: fm, famLabel: famLabels[fm],
        harvests: (c.harvests || []).slice(0, 2).map((h) => ({ method: t2(h, 'method'), item: t2(h, 'item') })),
      }
    })
    const q = (state.faunaQ || '').trim().toLowerCase()
    if (state.faunaFam !== 'all') arr = arr.filter((c) => c.fam === state.faunaFam)
    if (q) arr = arr.filter((c) => c.name.toLowerCase().indexOf(q) >= 0 || (c.example || '').toLowerCase().indexOf(q) >= 0)
    const za = state.faunaSort === 'za'
    arr.sort((a, b) => (za ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)))
    return { list: arr, total: raw.length }
  }, [data, state.faunaQ, state.faunaFam, state.faunaSort, t2, famLabels])

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.fa_kicker} title={L.fa_title} intro={L.fa_intro} introWidth={660} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b78a0', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            value={state.faunaQ}
            onChange={(e) => patch({ faunaQ: e.target.value })}
            placeholder={L.fa_search}
            style={{
              width: '100%', padding: '11px 14px', paddingLeft: 34, borderRadius: 10,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => patch({ faunaSort: state.faunaSort === 'za' ? 'az' : 'za' })}
          style={{
            cursor: 'pointer', padding: '10px 15px', borderRadius: 10, border: '1px solid rgba(120,150,220,.2)',
            background: 'rgba(120,150,220,.07)', color: '#dbe4ff', fontFamily: mono, fontSize: 12,
            letterSpacing: '.06em',
          }}
        >↕ {state.faunaSort === 'za' ? 'Z → A' : 'A → Z'}</button>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{list.length} / {total} {L.fa_results}</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {CHIP_DEFS.map((c) => {
          const active = state.faunaFam === c.k
          return (
            <button key={c.k} onClick={() => patch({ faunaFam: c.k })} style={{
              cursor: 'pointer', padding: '7px 14px', borderRadius: 20, fontFamily: mono, fontSize: 11.5,
              letterSpacing: '.04em', color: active ? '#1a0d02' : '#aab6d6',
              background: active ? '#5fd0e0' : 'rgba(120,150,220,.08)',
              border: '1px solid ' + (active ? '#5fd0e0' : 'rgba(120,150,220,.18)'),
            }}>{lang === 'fr' ? c.fr : c.en}</button>
          )
        })}
      </div>

      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b78a0', fontSize: 14 }}>{L.fa_none}</div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(178px,1fr))', gap: 14, marginTop: 20,
      }}>
        {list.map((c) => (
          <div
            key={c.type}
            className="hv-card-cyan"
            role="button"
            tabIndex={0}
            onClick={() => {
              const all = (c.raw.harvests || []).map((h) => t2(h, 'item') + ' — ' + t2(h, 'method'))
              openDetail({
                kicker: L.fa_kicker, title: c.name, sub: c.example ? L.fa_example + ' ' + c.example : '',
                img: c.hasImg ? c.img : '',
                rows: [{ k: lang === 'fr' ? 'FAMILLE' : 'FAMILY', v: c.famLabel }],
                hasChips: all.length > 0, chipsLabel: L.fa_harvest, chips: all,
                link: c.wiki, linkLabel: L.fa_wiki,
              })
            }}
            style={{
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(120,150,220,.14)', borderRadius: 14, overflow: 'hidden',
              background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))',
              transition: 'transform .18s,border-color .18s',
            }}
          >
            <div style={{
              position: 'relative', height: 146,
              background: 'radial-gradient(circle at 50% 45%,rgba(87,150,120,.18),transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderBottom: '1px solid rgba(120,150,220,.1)',
            }}>
              {c.hasImg ? (
                <img src={c.img} alt={c.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  width: 56, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, background: 'rgba(120,150,220,.06)',
                  clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)',
                  border: '1px solid rgba(120,150,220,.18)',
                }}>{c.emoji}</div>
              )}
              <span style={{
                position: 'absolute', top: 9, left: 9, fontFamily: mono, fontSize: 8, letterSpacing: '.1em',
                color: '#8bd0b0', background: 'rgba(6,10,16,.7)', padding: '2px 6px', borderRadius: 5,
              }}>{c.famLabel}</span>
            </div>
            <div style={{ padding: '12px 13px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{c.name}</div>
              {!!c.example && (
                <div style={{ fontFamily: mono, fontSize: 10, color: '#6b78a0', fontStyle: 'italic' }}>{L.fa_example} {c.example}</div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                {c.harvests.map((h, i) => (
                  <span key={i} style={{
                    fontSize: 10.5, color: '#bfe6d4', background: 'rgba(87,198,150,.1)',
                    border: '1px solid rgba(87,198,150,.2)', padding: '3px 8px', borderRadius: 14,
                  }}>{h.item}</span>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              {c.hasWiki && (
                <a
                  href={c.wiki}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: mono, fontSize: 10.5, color: '#5fd0e0', marginTop: 4 }}
                >{L.fa_wiki} ↗</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
