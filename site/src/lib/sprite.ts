/**
 * Procedural spiral-galaxy sprite: bloomed core, two dense star arms, dust lanes and
 * pink HII regions, drawn once into an offscreen canvas and reused by both the page
 * background and the galactic map. Deterministic (fixed seed) so it never flickers.
 */
let cached: HTMLCanvasElement | null = null
let cachedN = -1

export function galaxySprite(starDensity: number): HTMLCanvasElement {
  const N = Math.round(starDensity)
  if (cached && cachedN === N) return cached

  const S = 680
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const x = c.getContext('2d')!
  const cx = S / 2
  const R = (S / 2) * 0.96

  let seed = 1337
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

  let g = x.createRadialGradient(cx, cx, 0, cx, cx, S / 2)
  g.addColorStop(0, 'rgba(126,110,205,.17)')
  g.addColorStop(0.5, 'rgba(66,88,180,.08)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(0, 0, S, S)

  x.globalCompositeOperation = 'lighter'
  const armAng = (t: number, arm: number, j: number) =>
    3.05 * Math.pow(t, 0.72) * Math.PI + arm * Math.PI + j

  for (let i = 0; i < N; i++) {
    const t = Math.pow(rnd(), 0.62)
    const arm = i % 2
    const spread = (0.05 + 0.13 * t) * (rnd() < 0.5 ? -1 : 1) * rnd() * 2.2
    const ang = armAng(t, arm, spread)
    const rad = (0.05 + 0.95 * t) * R * (0.94 + rnd() * 0.12)
    const px = cx + Math.cos(ang) * rad
    const py = cx + Math.sin(ang) * rad
    const u = rnd()
    let col: string, a: number, sz: number
    if (t < 0.2) { col = u < 0.65 ? '255,226,175' : '255,246,225'; a = 0.32 + 0.4 * rnd(); sz = 0.4 + rnd() * 1.5 }
    else if (u < 0.42) { col = '150,186,255'; a = 0.16 + 0.4 * rnd(); sz = 0.3 + rnd() * 1.4 }
    else if (u < 0.75) { col = '214,228,255'; a = 0.14 + 0.34 * rnd(); sz = 0.3 + rnd() * 1.2 }
    else if (u < 0.92) { col = '255,216,168'; a = 0.12 + 0.3 * rnd(); sz = 0.3 + rnd() * 1.3 }
    else { col = '255,166,196'; a = 0.1 + 0.24 * rnd(); sz = 0.4 + rnd() * 1.6 }
    x.fillStyle = 'rgba(' + col + ',' + a.toFixed(2) + ')'
    x.beginPath()
    x.arc(px, py, sz, 0, 6.283)
    x.fill()
  }

  // pink star-forming regions
  for (let i = 0; i < 24; i++) {
    const t = 0.3 + 0.6 * rnd()
    const arm = i % 2
    const ang = armAng(t, arm, (rnd() - 0.5) * 0.14)
    const rad = (0.05 + 0.95 * t) * R
    const px = cx + Math.cos(ang) * rad
    const py = cx + Math.sin(ang) * rad
    const rr = 3 + rnd() * 8
    g = x.createRadialGradient(px, py, 0, px, py, rr)
    g.addColorStop(0, 'rgba(255,148,190,.4)')
    g.addColorStop(1, 'rgba(255,120,175,0)')
    x.fillStyle = g
    x.beginPath()
    x.arc(px, py, rr, 0, 6.283)
    x.fill()
  }

  // dust lanes carved out of the arms
  x.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 800; i++) {
    const t = 0.2 + 0.72 * rnd()
    const arm = i % 2
    const ang = armAng(t, arm, -0.1 - rnd() * 0.06)
    const rad = (0.05 + 0.95 * t) * R * 0.95
    const px = cx + Math.cos(ang) * rad
    const py = cx + Math.sin(ang) * rad
    x.fillStyle = 'rgba(0,0,0,' + (0.1 + 0.22 * rnd()).toFixed(2) + ')'
    x.beginPath()
    x.arc(px, py, 2 + rnd() * 5, 0, 6.283)
    x.fill()
  }

  // core bloom
  x.globalCompositeOperation = 'lighter'
  g = x.createRadialGradient(cx, cx, 0, cx, cx, R * 0.36)
  g.addColorStop(0, 'rgba(255,250,236,.95)')
  g.addColorStop(0.16, 'rgba(255,230,182,.62)')
  g.addColorStop(0.42, 'rgba(255,192,122,.22)')
  g.addColorStop(1, 'rgba(255,170,90,0)')
  x.fillStyle = g
  x.beginPath()
  x.arc(cx, cx, R * 0.36, 0, 6.283)
  x.fill()
  x.globalCompositeOperation = 'source-over'

  cached = c
  cachedN = N
  return c
}
