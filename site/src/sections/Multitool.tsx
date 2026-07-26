import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import SectionHeader from '../components/SectionHeader'
import Workshop, { CLASS_COLOR } from '../components/Workshop'
import { resolveFamilies } from '../lib/workshopData'

const mono = "'Space Mono',monospace"

const dec = (s: string | undefined) => String(s || '').replace(/&amp;/g, '&')

export default function Multitool() {
  const { state, patch, data, L, lang } = useAtlas()
  const mt = useMemo(() => data.multitool || {}, [data])
  const R = mt.rules || {}
  const SB = R.slots_by_class || { C: 30, B: 40, A: 50, S: 60 }
  const SCB = R.sc_by_class || { C: 1, B: 2, A: 3, S: 4 }

  const classes = ['C', 'B', 'A', 'S'].map((k) => ({
    k, color: CLASS_COLOR[k], slots: SB[k] != null ? SB[k] : '—', sc: SCB[k] != null ? SCB[k] : '—',
  }))

  const types = (mt.types || []).map((t) => ({
    key: t.key, emoji: t.emoji || '',
    name: dec(lang === 'fr' ? t.fr : t.en),
    desc: dec(lang === 'fr' ? t.desc_fr : t.desc_en),
  }))

  const famRows = useMemo(() => resolveFamilies('tool', data.workshop, lang).map((f) => ({
    key: f.key, glyph: f.glyph, color: f.color, name: f.name,
    core: f.core.length, mods: f.mods.length,
  })), [data.workshop, lang])

  const curT = (mt.types || []).find((t) => t.key === state.mtType) || (mt.types || [])[0] || {}
  const total = SB[state.mtClass] || 40
  const scN = SCB[state.mtClass] || 2

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.mt_kicker} title={L.mt_title} intro={L.mt_intro} />

      <Workshop
        kind="tool"
        accent="gold"
        storageKey="atlas-terminal-mt"
        type={state.mtType}
        onType={(t) => patch({ mtType: t })}
        cls={state.mtClass}
        onClass={(c) => patch({ mtClass: c })}
        fam={state.mtFam}
        onFam={(f) => patch({ mtFam: f })}
        types={types.map((t) => ({ key: t.key, emoji: t.emoji, label: t.name }))}
        total={total}
        scN={scN}
        holoEmoji={curT.emoji || ''}
        holoName={dec(lang === 'fr' ? curT.fr : curT.en)}
        holoDesc={dec(lang === 'fr' ? curT.desc_fr : curT.desc_en)}
      />

      <div style={{
        fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347', marginTop: 30,
      }}>{L.mt_rules}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 12,
      }}>
        {classes.map((c) => (
          <div key={c.k} style={{
            border: '1px solid ' + c.color, borderRadius: 13, background: 'rgba(10,14,28,.55)',
            padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 26, color: c.color }}>{c.k}</div>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700, marginTop: 6 }}>
              {c.slots} <span style={{ fontSize: 10.5, fontWeight: 400, color: '#8b97ba' }}>{L.mt_slots}</span>
            </div>
            <div style={{ fontSize: 12, color: '#ffd98a', marginTop: 3 }}>
              ⚡ {c.sc} <span style={{ color: '#8b97ba' }}>{L.mt_sc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="nms-hl-even" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{
          border: '1px solid rgba(240,90,90,.3)', borderRadius: 13, background: 'rgba(240,90,90,.06)',
          padding: '14px 17px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#ff8a8a' }}>⚠ {L.mt_over}</div>
          <div style={{ fontSize: 13, color: '#dbc9c9', marginTop: 6, lineHeight: 1.55 }}>{L.mt_over_txt}</div>
        </div>
        <div style={{
          border: '1px solid rgba(139,240,160,.3)', borderRadius: 13, background: 'rgba(87,198,106,.06)',
          padding: '14px 17px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#8bf0a0' }}>▦ {L.mt_adj}</div>
          <div style={{ fontSize: 13, color: '#c9dbcf', marginTop: 6, lineHeight: 1.55 }}>{L.mt_adj_txt}</div>
        </div>
      </div>

      <div style={{
        fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347', marginTop: 30,
      }}>{L.mt_types}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14, marginTop: 12,
      }}>
        {types.map((t) => (
          <div key={t.key} className="hv-card-gold" style={{
            border: '1px solid rgba(120,150,220,.15)', borderRadius: 14,
            background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))', padding: '16px 18px',
            transition: 'transform .18s,border-color .18s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 21 }}>{t.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 15.5, color: '#fff' }}>{t.name}</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9aa6c8', lineHeight: 1.55, marginTop: 8 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{
        fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#ffb347', marginTop: 30,
      }}>{L.mt_fam}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12, marginTop: 12,
      }}>
        {famRows.map((f) => (
          <div key={f.key} style={{
            border: '1px solid rgba(120,150,220,.14)', borderTop: '3px solid ' + f.color, borderRadius: 12,
            background: 'rgba(10,14,28,.55)', padding: '13px 15px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.color}
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={f.glyph} />
              </svg>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: '#fff' }}>{f.name}</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: '#8b97ba', marginTop: 7 }}>
              {f.core} {L.mt_core}
              {f.mods > 0 && <> · <span style={{ color: f.color }}>{f.mods} {L.mt_mods}</span></>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
