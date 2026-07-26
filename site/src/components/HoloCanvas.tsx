import { useEffect, useRef } from 'react'
import { shipModel, toolModel, type WireModel } from '../lib/models'
import { prefersReducedMotion } from '../lib/util'
import { useAtlas } from '../lib/store'

interface Props {
  /** which model family to draw, and in which accent */
  kind: 'ship' | 'tool'
  type: string
}

/**
 * Rotating wireframe hologram with drag-to-spin, projected orbit rings and a
 * visor-style scan sweep. Cyan lines for starships, amber for multi-tools.
 */
export default function HoloCanvas({ kind, type }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const typeRef = useRef(type)
  const rotRef = useRef(0.7)
  const { settings } = useAtlas()
  typeRef.current = type

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return

    const reduce = prefersReducedMotion() || settings.motion === 'calme'
    const lineRGB = kind === 'ship' ? '95,208,224' : '255,179,71'
    const dotRGB = kind === 'ship' ? '190,240,250' : '255,217,168'
    const scanRGB = kind === 'ship' ? '255,179,71' : '95,208,224'
    const scale = kind === 'ship' ? 0.05 : 0.052

    let drag = false, px = 0, vel = 0, raf = 0

    el.style.cursor = 'grab'
    el.onpointerdown = (ev) => {
      drag = true; px = ev.clientX; el.style.cursor = 'grabbing'
      try { el.setPointerCapture(ev.pointerId) } catch { /* older browsers */ }
    }
    el.onpointermove = (ev) => {
      if (!drag) return
      const dx = ev.clientX - px
      px = ev.clientX
      rotRef.current += dx * 0.011
      vel = dx * 0.011
      if (reduce) draw()
    }
    el.onpointerup = () => { drag = false; el.style.cursor = 'grab' }
    el.onpointerleave = () => { drag = false }

    const draw = () => {
      const DPR = Math.min(2, window.devicePixelRatio || 1)
      const W = el.clientWidth || 400, H = el.clientHeight || 250
      if (el.width !== Math.round(W * DPR)) {
        el.width = Math.round(W * DPR)
        el.height = Math.round(H * DPR)
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2 + 6, sc2 = Math.min(W, H) * scale, tilt = 0.3
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = 'rgba(95,208,224,' + (0.16 - i * 0.045) + ')'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(cx, cy + 62, 58 + i * 26, 13 + i * 6, 0, 0, 6.283)
        ctx.stroke()
      }

      const M: WireModel = kind === 'ship' ? shipModel(typeRef.current) : toolModel(typeRef.current)
      const rot = rotRef.current
      const cosY = Math.cos(rot), sinY = Math.sin(rot), cosT = Math.cos(tilt), sinT = Math.sin(tilt)
      const pr = M.P.map((p) => {
        const x1 = p[0] * cosY + p[2] * sinY, z1 = -p[0] * sinY + p[2] * cosY
        const y2 = p[1] * cosT - z1 * sinT, z2 = p[1] * sinT + z1 * cosT
        const s3 = 17 / (17 + z2 * 0.55)
        return [cx + x1 * s3 * sc2, cy - y2 * s3 * sc2, z2]
      })

      for (const e of M.E) {
        const a = pr[e[0]], b = pr[e[1]]
        const dz = (a[2] + b[2]) / 2
        const al = Math.max(0.16, Math.min(0.95, 0.62 - dz * 0.055))
        ctx.strokeStyle = 'rgba(' + lineRGB + ',' + al.toFixed(2) + ')'
        ctx.lineWidth = dz < 0 ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(' + dotRGB + ',.85)'
      for (const p of pr) {
        if (p[2] < 0) { ctx.beginPath(); ctx.arc(p[0], p[1], 1.1, 0, 6.283); ctx.fill() }
      }

      if (!reduce) {
        const sy = ((performance.now() / 1000) * 46) % (H + 40) - 20
        const g2 = ctx.createLinearGradient(0, sy - 14, 0, sy + 14)
        g2.addColorStop(0, 'rgba(' + scanRGB + ',0)')
        g2.addColorStop(0.5, 'rgba(' + scanRGB + ',' + (kind === 'ship' ? '.07' : '.08') + ')')
        g2.addColorStop(1, 'rgba(' + scanRGB + ',0)')
        ctx.fillStyle = g2
        ctx.fillRect(0, sy - 14, W, 28)
      }

      if (!reduce) {
        if (!drag) { rotRef.current += 0.008 + vel * 0.3; vel *= 0.94 }
        raf = requestAnimationFrame(draw)
      }
    }

    if (reduce) requestAnimationFrame(draw)
    else raf = requestAnimationFrame(draw)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.onpointerdown = null
      el.onpointermove = null
      el.onpointerup = null
      el.onpointerleave = null
    }
  }, [kind, settings])

  return <canvas ref={ref} style={{ width: '100%', height: 250, display: 'block', marginTop: 8 }} />
}
