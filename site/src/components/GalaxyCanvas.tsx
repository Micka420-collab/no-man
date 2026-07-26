import { useEffect, useRef } from 'react'
import type { Galaxy, GalaxyHub, Lang } from '../types'
import { galaxySprite } from '../lib/sprite'
import { prefersReducedMotion } from '../lib/util'
import { useAtlas } from '../lib/store'

interface Props {
  galaxies: Galaxy[]
  hubs: Record<string, GalaxyHub>
  selected: number | null
  onSelect: (n: number) => void
  /** increment to snap the view back to the default framing */
  resetToken: number
  lang: Lang
}

const TYPE_COLOR: Record<string, string> = {
  norm: '#6aa9ff', lush: '#57c66a', harsh: '#ff7a4d', empty: '#9a93c4',
}

interface Pt {
  n: number; name: string; ang0: number; rad: number
  col: string; tl: string; hub: boolean; sz: number
}

/**
 * The 255 galaxies laid out on the same logarithmic two-arm spiral as the sprite:
 * wheel to zoom, drag to pan, hover for a tooltip, click to select — selecting
 * animates a flight to that star.
 */
export default function GalaxyCanvas({ galaxies, hubs, selected, onSelect, resetToken, lang }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const view = useRef({ x: 0, y: 0, z: 1 })
  const rotRef = useRef(0)
  const selRef = useRef<number | null>(selected)
  const flyRef = useRef<number | null>(null)
  const drawRef = useRef<(() => void) | null>(null)
  const runningRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  const { settings } = useAtlas()

  onSelectRef.current = onSelect

  // selection → fly to the star (and repaint when animation is off)
  useEffect(() => {
    selRef.current = selected
    if (selected != null) flyRef.current = selected
    if (!runningRef.current) drawRef.current?.()
  }, [selected])

  useEffect(() => {
    if (resetToken === 0) return
    view.current.x = 0
    view.current.y = 0
    view.current.z = 1
    flyRef.current = null
    if (!runningRef.current) drawRef.current?.()
  }, [resetToken])

  useEffect(() => {
    const el = ref.current
    if (!el || !galaxies.length) return
    const ctx = el.getContext('2d')
    if (!ctx) return

    const reduce = prefersReducedMotion() || settings.motion === 'calme'
    const typeLab: Record<string, string> = lang === 'fr'
      ? { norm: 'Standard', lush: 'Luxuriante', harsh: 'Hostile', empty: 'Vide' }
      : { norm: 'Standard', lush: 'Lush', harsh: 'Harsh', empty: 'Empty' }

    const N = galaxies.length || 255
    const FLAT = 0.56
    const pts: Pt[] = galaxies.map((g0, i) => {
      const t = (i + 0.5) / N
      const arm = i % 2
      const h = Math.sin((i + 1) * 12.9898) * 43758.5453
      const fr = h - Math.floor(h)
      return {
        n: g0.n,
        name: g0.name,
        ang0: 3.05 * Math.pow(t, 0.72) * Math.PI + arm * Math.PI + (fr - 0.5) * 0.22,
        rad: 0.06 + 0.94 * t,
        col: TYPE_COLOR[g0.type] || '#6aa9ff',
        tl: typeLab[g0.type] || '',
        hub: !!hubs[g0.n],
        sz: hubs[g0.n] ? 3.6 : 1.9,
      }
    })

    let W = 600, H = 420, DPR = 1, cx = 300, cy = 210, base = 190
    const resize = () => {
      DPR = Math.min(1.8, window.devicePixelRatio || 1)
      W = el.clientWidth || 600
      H = el.clientHeight || 420
      el.width = Math.round(W * DPR)
      el.height = Math.round(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      cx = W / 2
      cy = H / 2
      base = Math.min(W, H) * 0.46
    }
    resize()
    window.addEventListener('resize', resize)

    const V = view.current
    let screen: { n: number; x: number; y: number }[] = []
    let hover: { n: number; x: number; y: number } | null = null
    let dragging = false, moved = 0, px = 0, py = 0, raf = 0

    el.style.cursor = 'grab'
    const hitTest = (mx: number, my: number, rad2: number) => {
      let best: { n: number; x: number; y: number } | null = null
      let bd = 1e9
      for (const s of screen) {
        const dx = s.x - mx, dy = s.y - my, dd = dx * dx + dy * dy
        if (dd < bd) { bd = dd; best = s }
      }
      return best && bd < rad2 ? best : null
    }

    el.onpointerdown = (ev) => {
      dragging = true; moved = 0; px = ev.clientX; py = ev.clientY
      try { el.setPointerCapture(ev.pointerId) } catch { /* older browsers */ }
      el.style.cursor = 'grabbing'
    }
    el.onpointermove = (ev) => {
      const r = el.getBoundingClientRect()
      const mx = ev.clientX - r.left, my = ev.clientY - r.top
      if (dragging) {
        const dx = ev.clientX - px, dy = ev.clientY - py
        px = ev.clientX; py = ev.clientY
        moved += Math.abs(dx) + Math.abs(dy)
        V.x += dx; V.y += dy
        flyRef.current = null
      } else {
        hover = hitTest(mx, my, 225)
        el.style.cursor = hover ? 'pointer' : 'grab'
      }
      if (reduce && !runningRef.current) draw()
    }
    el.onpointerup = (ev) => {
      const wasDrag = moved >= 6
      dragging = false
      el.style.cursor = 'grab'
      if (!wasDrag) {
        const r = el.getBoundingClientRect()
        const hit = hitTest(ev.clientX - r.left, ev.clientY - r.top, 480)
        if (hit) onSelectRef.current(hit.n)
      }
    }
    el.onpointerleave = () => { hover = null; dragging = false }
    el.onwheel = (ev) => {
      ev.preventDefault()
      const r = el.getBoundingClientRect()
      const mx = ev.clientX - r.left - cx, my = ev.clientY - r.top - cy
      const z0 = V.z
      const z1 = Math.max(0.7, Math.min(7, z0 * Math.exp(-ev.deltaY * 0.0011)))
      V.x = mx - (mx - V.x) * (z1 / z0)
      V.y = my - (my - V.y) * (z1 / z0)
      V.z = z1
      flyRef.current = null
      if (reduce && !runningRef.current) draw()
    }

    const world = (p: Pt, rr: number) => {
      const a = p.ang0 + rr
      return { x: Math.cos(a) * p.rad * base, y: Math.sin(a) * p.rad * base * FLAT }
    }

    const draw = () => {
      if (el.clientWidth && (el.clientWidth !== W || el.clientHeight !== H)) resize()
      const rot = rotRef.current

      if (flyRef.current != null) {
        const p = pts.find((q) => q.n === flyRef.current)
        if (!p) flyRef.current = null
        else if (reduce) {
          const w = world(p, rot)
          V.z = Math.max(V.z, 2.6); V.x = -w.x * V.z; V.y = -w.y * V.z
          flyRef.current = null
        } else {
          const w = world(p, rot)
          const tz = Math.max(V.z, 2.6)
          V.z += (tz - V.z) * 0.09
          const dx = -w.x * V.z - V.x, dy = -w.y * V.z - V.y
          V.x += dx * 0.14; V.y += dy * 0.14
          if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6 && Math.abs(tz - V.z) < 0.02) flyRef.current = null
        }
      }

      ctx.clearRect(0, 0, W, H)
      const spr = galaxySprite(settings.starDensity)
      ctx.save()
      ctx.translate(cx + V.x, cy + V.y)
      ctx.scale(V.z, V.z)
      ctx.scale(1, FLAT)
      ctx.rotate(rot)
      ctx.globalCompositeOperation = 'lighter'
      const sw = base * 2.13
      ctx.drawImage(spr, -sw / 2, -sw / 2, sw, sw)
      ctx.restore()
      ctx.globalCompositeOperation = 'source-over'

      screen = []
      const selN = selRef.current
      let selPt: { p: Pt; x: number; y: number } | null = null
      let hovPt: { p: Pt; x: number; y: number } | null = null
      const zoomed = V.z > 1.8
      ctx.shadowBlur = 5

      for (const p of pts) {
        const w = world(p, rot)
        const x = cx + V.x + w.x * V.z, y = cy + V.y + w.y * V.z
        if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue
        screen.push({ n: p.n, x, y })
        const rr = p.sz * (0.75 + 0.35 * Math.sqrt(V.z))
        ctx.globalAlpha = 0.92
        ctx.shadowColor = p.col
        ctx.fillStyle = p.col
        ctx.beginPath()
        ctx.arc(x, y, rr, 0, 6.283)
        ctx.fill()
        if (p.hub) {
          ctx.shadowBlur = 0
          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.arc(x, y, rr * 0.45, 0, 6.283); ctx.fill()
          ctx.strokeStyle = p.col; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.3
          ctx.beginPath(); ctx.arc(x, y, rr + 4, 0, 6.283); ctx.stroke()
          ctx.shadowBlur = 5
        }
        if ((p.hub || zoomed) && V.z > 1.15) {
          ctx.shadowBlur = 0
          ctx.globalAlpha = 0.92
          ctx.fillStyle = '#dfe8ff'
          ctx.font = (p.hub ? 'bold ' : '') + '10px "Space Mono", monospace'
          ctx.fillText(p.name, x + 9, y + 3.5)
          ctx.shadowBlur = 5
        }
        if (p.n === selN) selPt = { p, x, y }
        if (hover && hover.n === p.n) hovPt = { p, x, y }
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1

      if (selPt) {
        const pr = 8 + 2.2 * Math.sin(performance.now() / 300)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8
        ctx.beginPath(); ctx.arc(selPt.x, selPt.y, pr, 0, 6.283); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,255,255,.35)'
        ctx.beginPath(); ctx.arc(selPt.x, selPt.y, pr + 6, 0, 6.283); ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 13px "Space Grotesk", sans-serif'
        ctx.fillText(selPt.p.name, selPt.x + 13, selPt.y - 10)
      }

      if (hovPt && (!selPt || hovPt.p.n !== selPt.p.n)) {
        const p = hovPt.p, x = hovPt.x, y = hovPt.y
        const label = p.name, meta = '#' + p.n + ' · ' + p.tl
        ctx.font = 'bold 12px "Space Grotesk", sans-serif'
        const w1 = ctx.measureText(label).width
        ctx.font = '10px "Space Mono", monospace'
        const w2 = ctx.measureText(meta).width
        const bw = Math.max(w1, w2) + 22, bh = 40
        let bx = x + 14, by = y - bh - 8
        if (bx + bw > W - 6) bx = x - bw - 14
        if (by < 6) by = y + 14
        ctx.fillStyle = 'rgba(7,10,20,.92)'
        ctx.strokeStyle = p.col
        ctx.lineWidth = 1
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 8); else ctx.rect(bx, by, bw, bh)
        ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px "Space Grotesk", sans-serif'
        ctx.fillText(label, bx + 11, by + 16)
        ctx.fillStyle = p.col
        ctx.font = '10px "Space Mono", monospace'
        ctx.fillText(meta, bx + 11, by + 30)
        ctx.strokeStyle = 'rgba(255,255,255,.4)'
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.stroke()
      }

      if (!reduce) {
        rotRef.current = rot + 0.00075 / Math.max(1, V.z * 0.7)
        raf = requestAnimationFrame(draw)
      }
    }

    drawRef.current = draw
    runningRef.current = !reduce
    if (reduce) requestAnimationFrame(() => { resize(); draw() })
    else raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
      runningRef.current = false
      drawRef.current = null
      el.onpointerdown = null
      el.onpointermove = null
      el.onpointerup = null
      el.onpointerleave = null
      el.onwheel = null
    }
  }, [galaxies, hubs, lang, settings])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
}
