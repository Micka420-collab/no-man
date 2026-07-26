import { useMemo } from 'react'
import { useAtlas } from '../lib/store'
import { asset } from '../lib/util'
import SectionHeader from '../components/SectionHeader'
import Workshop from '../components/Workshop'

const mono = "'Space Mono',monospace"

export default function Ships() {
  const { state, patch, data, L, t2, openDetail } = useAtlas()

  const ships = useMemo(() => data.ships?.items || [], [data])

  const gallery = useMemo(() => {
    const all = ships.map((it) => ({
      id: it.id,
      name: t2(it, 'name'), bonus: t2(it, 'bonus'), price: t2(it, 'price'),
      find: t2(it, 'find'), build: t2(it, 'build'),
      img: asset(it.image || ''), rarity: it.rarity || 1,
    }))
    const q = (state.shipQ || '').trim().toLowerCase()
    const items = q
      ? all.filter((x) => x.name.toLowerCase().indexOf(q) >= 0
        || x.bonus.toLowerCase().indexOf(q) >= 0
        || x.find.toLowerCase().indexOf(q) >= 0)
      : all
    return { items, count: items.length, total: all.length }
  }, [ships, state.shipQ, t2])

  const ug = data.ships?.upgrade_guide || {}
  const steps = (ug.steps || []).map((st, i) => ({
    num: String(i + 1).padStart(2, '0'), icon: st.icon,
    title: t2(st, 'title'), body: t2(st, 'body'),
  }))

  const curT = ships.find((t) => t.id === state.shType) || ships[0] || {}
  const scN = ({ C: 1, B: 2, A: 3, S: 4 } as Record<string, number>)[state.shClass] || 2

  return (
    <section className="nms-pad" style={{
      animation: 'nmsSecIn .5s both', maxWidth: 1200, margin: '0 auto', padding: '46px 42px 96px',
    }}>
      <SectionHeader kicker={L.sh_kicker} title={L.sh_title} intro={L.sh_intro} introWidth={660} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b78a0', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            value={state.shipQ}
            onChange={(e) => patch({ shipQ: e.target.value })}
            placeholder={L.sh_search}
            style={{
              width: '100%', padding: '11px 14px', paddingLeft: 34, borderRadius: 10,
              border: '1px solid rgba(120,150,220,.2)', background: 'rgba(10,14,28,.6)', color: '#e8edfb',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#6b78a0' }}>{gallery.count} / {gallery.total} {L.sh_types}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18, marginTop: 20,
      }}>
        {gallery.items.map((s) => (
          <div
            key={s.id}
            className="hv-card-gold"
            role="button"
            tabIndex={0}
            onClick={() => openDetail({
              kicker: L.sh_kicker, title: s.name, sub: s.bonus, img: s.img,
              rows: [{ k: L.sh_price, v: s.price }, { k: L.sh_find, v: s.find }, { k: L.sh_build, v: s.build }],
              hasChips: false, chips: [], chipsLabel: '', link: '', linkLabel: '',
            })}
            style={{
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(120,150,220,.15)', borderRadius: 15, overflow: 'hidden',
              background: 'linear-gradient(180deg,rgba(16,22,44,.55),rgba(9,12,26,.55))',
              transition: 'transform .18s,border-color .18s',
            }}
          >
            <div style={{
              position: 'relative', height: 172, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 42%,rgba(56,120,200,.22),transparent 68%)',
              borderBottom: '1px solid rgba(120,150,220,.1)',
            }}>
              <img src={s.img} alt={s.name} loading="lazy" style={{
                maxWidth: '84%', maxHeight: '84%', objectFit: 'contain',
                filter: 'drop-shadow(0 12px 26px rgba(0,0,0,.65))',
              }} />
              <div style={{ position: 'absolute', top: 11, right: 12, display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ fontSize: 10, color: n <= s.rarity ? '#ffb347' : 'rgba(120,150,220,.22)' }}>◆</span>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 17px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{s.name}</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: '#ffcf9a' }}>{s.bonus}</div>
              <div style={{ marginTop: 2 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.sh_price}</div>
                <div style={{ fontSize: 13, color: '#e8c24a', fontWeight: 600, marginTop: 2 }}>{s.price}</div>
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#6b78a0' }}>{L.sh_find}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#9aa6c8', marginTop: 2 }}>{s.find}</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(120,150,220,.1)', paddingTop: 9 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.16em', color: '#ff9a4d' }}>{L.sh_build}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#aab6d6', marginTop: 3 }}>{s.build}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WORKSHOP */}
      <div style={{ marginTop: 36 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#5fd0e0' }}>// {L.shw_kicker}</div>
        <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{L.shw_title}</h3>
        <p style={{ margin: '9px 0 0', maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{L.shw_intro}</p>

        <Workshop
          kind="ship"
          accent="cyan"
          storageKey="atlas-terminal-ship"
          type={state.shType}
          onType={(t) => patch({ shType: t })}
          cls={state.shClass}
          onClass={(c) => patch({ shClass: c })}
          fam={state.shFam}
          onFam={(f) => patch({ shFam: f })}
          types={ships.map((t) => ({ key: t.id, emoji: t.icon || '', label: t2(t, 'name') }))}
          total={30}
          scN={scN}
          holoEmoji={curT.icon || ''}
          holoName={t2(curT, 'name')}
          holoDesc={t2(curT, 'bonus')}
          note={L.shw_note}
        />
      </div>

      {/* OPTIMISATION GUIDE */}
      <div style={{
        position: 'relative', marginTop: 36, border: '1px solid rgba(255,122,26,.24)', borderRadius: 16,
        overflow: 'hidden', background: 'linear-gradient(160deg,rgba(255,122,26,.09),rgba(9,12,26,.5) 55%)',
        padding: '26px 28px',
      }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.22em', color: '#ffb347' }}>// {L.sh_upgrade_kicker}</div>
        <h3 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 24, color: '#fff' }}>{t2(ug, 'title')}</h3>
        <p style={{ margin: '9px 0 0', maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: '#aab6d6' }}>{t2(ug, 'intro')}</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 15, marginTop: 22,
        }}>
          {steps.map((st) => (
            <div key={st.num} style={{
              border: '1px solid rgba(120,150,220,.14)', borderRadius: 12, background: 'rgba(10,14,28,.5)',
              padding: '16px 17px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{
                  fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#ff7a1a',
                  border: '1px solid rgba(255,122,26,.35)', borderRadius: 7, padding: '4px 8px',
                }}>{st.num}</span>
                <span style={{ fontSize: 20 }}>{st.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14.5, color: '#fff', lineHeight: 1.2 }}>{st.title}</span>
              </div>
              <p style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.55, color: '#9aa6c8' }}>{st.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
