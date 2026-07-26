import { useEffect, useRef } from 'react'
import { galaxySprite } from '../lib/sprite'
import { prefersReducedMotion } from '../lib/util'
import { useAtlas } from '../lib/store'

/** Fixed full-viewport nebula + twinkling starfield + slowly rotating galaxy. */
export default function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { settings } = useAtlas()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return

    const reduce = prefersReducedMotion() || settings.motion === 'calme'
    let W = 1, H = 1, DPR = 1
    let stars: { x: number; y: number; r: number; b: number; tw: number; ts: number }[] = []
    let raf = 0

    const resize = () => {
      DPR = Math.min(1.6, window.devicePixelRatio || 1)
      W = el.clientWidth || window.innerWidth
      H = el.clientHeight || window.innerHeight
      el.width = Math.round(W * DPR)
      el.height = Math.round(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      const n = Math.min(520, Math.round((W * H) / 6200))
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.25, b: Math.random() * 0.55 + 0.25,
        tw: Math.random() * 6.28, ts: Math.random() * 0.02 + 0.004,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    let rot = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      let g = ctx.createRadialGradient(W * 0.74, H * 0.32, 0, W * 0.74, H * 0.32, Math.max(W, H) * 0.62)
      g.addColorStop(0, 'rgba(168,119,230,.14)')
      g.addColorStop(0.5, 'rgba(56,120,190,.05)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      g = ctx.createRadialGradient(W * 0.16, H * 0.82, 0, W * 0.16, H * 0.82, Math.max(W, H) * 0.5)
      g.addColorStop(0, 'rgba(255,122,26,.075)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      for (const s of stars) {
        let b = s.b
        if (!reduce) { s.tw += s.ts; b = s.b * (0.55 + 0.45 * Math.sin(s.tw)) }
        ctx.globalAlpha = b
        ctx.fillStyle = '#e2ebff'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, 6.283)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const cx = W * 0.76, cy = H * 0.33
      const scale = Math.min(Math.max(W, H) * 0.42, 560)
      const spr = galaxySprite(settings.starDensity)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(1, 0.56)
      ctx.rotate(rot)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.92
      const sw = scale * 2.4
      ctx.drawImage(spr, -sw / 2, -sw / 2, sw, sw)
      ctx.restore()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      if (!reduce) { rot += 0.0006; raf = requestAnimationFrame(draw) }
    }

    if (reduce) draw()
    else raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [settings])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }}
    />
  )
}
