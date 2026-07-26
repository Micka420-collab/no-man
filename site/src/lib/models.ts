/**
 * Stylised wireframe silhouettes for the holographic analysis panels.
 * (The game's own models are proprietary assets — these are original approximations.)
 */
export interface WireModel { P: [number, number, number][]; E: [number, number][] }

interface Builder {
  pt: (x: number, y: number, z: number) => number
  seg: (a: number, b: number) => void
  box: (cx: number, cy: number, cz: number, w: number, h: number, d: number) => number[]
  ring: (cx: number, cy: number, cz: number, r: number, n: number, rz?: boolean) => number[]
  quad: (a: number[], b: number[], c: number[], d: number[]) => number[]
  tube: (x1: number, x2: number, y: number, r: number, n: number) => number[]
}

function builder(): { model: WireModel } & Builder {
  const P: [number, number, number][] = []
  const E: [number, number][] = []
  const pt = (x: number, y: number, z: number) => { P.push([x, y, z]); return P.length - 1 }
  const seg = (a: number, b: number) => { E.push([a, b]) }
  const box = (cx: number, cy: number, cz: number, w: number, h: number, d: number) => {
    const s: number[] = []
    for (let i = 0; i < 8; i++) {
      s.push(pt(cx + ((i & 1) ? w : -w) / 2, cy + ((i & 2) ? h : -h) / 2, cz + ((i & 4) ? d : -d) / 2))
    }
    ;([[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]] as const)
      .forEach((e) => seg(s[e[0]], s[e[1]]))
    return s
  }
  const ring = (cx: number, cy: number, cz: number, r: number, n: number, rz?: boolean) => {
    const s: number[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283
      s.push(rz ? pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz) : pt(cx, cy + Math.cos(a) * r, cz + Math.sin(a) * r))
    }
    for (let i = 0; i < n; i++) seg(s[i], s[(i + 1) % n])
    return s
  }
  const quad = (a: number[], b: number[], c: number[], d: number[]) => {
    const q = [pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2])]
    for (let i = 0; i < 4; i++) seg(q[i], q[(i + 1) % 4])
    return q
  }
  const tube = (x1: number, x2: number, y: number, r: number, n: number) => {
    const a = ring(x1, y, 0, r, n)
    const b = ring(x2, y, 0, r, n)
    for (let i = 0; i < n; i++) seg(a[i], b[i])
    return b
  }
  return { model: { P, E }, pt, seg, box, ring, quad, tube }
}

const shipCache: Record<string, WireModel> = {}
const toolCache: Record<string, WireModel> = {}

export function shipModel(type: string): WireModel {
  if (shipCache[type]) return shipCache[type]
  const { model, pt, seg, box, ring, quad } = builder()

  if (type === 'fighter') {
    box(1.5, 0, 0, 10, 2.2, 2)
    const n2 = pt(8.5, 0, 0); seg(n2, pt(6.5, 0.9, 0)); seg(n2, pt(6.5, -0.9, 0))
    box(3, 1.3, 0, 2.6, 1, 1.3)
    quad([0, 0.1, 1], [-3.4, 0.5, 5.4], [-5.6, 0.3, 4.8], [-1.8, 0, 1])
    quad([0, 0.1, -1], [-3.4, 0.5, -5.4], [-5.6, 0.3, -4.8], [-1.8, 0, -1])
    seg(pt(-5, 0.4, 5.1), pt(-2.4, 0.4, 5.6))
    seg(pt(-5, 0.4, -5.1), pt(-2.4, 0.4, -5.6))
  } else if (type === 'hauler') {
    box(-0.5, 0, 0, 10, 4, 3.4); box(-1.5, 2.7, 0, 6, 1.6, 2.6); box(5.2, 0.5, 0, 2.2, 1.8, 1.7)
    ring(-5.6, 1, 1.2, 0.75, 5); ring(-5.6, 1, -1.2, 0.75, 5); ring(-5.6, -1, 0, 0.9, 5)
  } else if (type === 'explorer') {
    box(1, 0, 0, 7, 2, 1.8)
    const n2 = pt(6, 0, 0); seg(n2, pt(4.5, 0.8, 0))
    const s1 = pt(-1.5, 1, 0.9), t1 = pt(-3, 3.4, 3); seg(s1, t1)
    const s2 = pt(-1.5, 1, -0.9), t2 = pt(-3, 3.4, -3); seg(s2, t2)
    const s3 = pt(-1.5, -1, 0.9), t3 = pt(-3.5, -2.8, 2.6); seg(s3, t3)
    const s4 = pt(-1.5, -1, -0.9), t4 = pt(-3.5, -2.8, -2.6); seg(s4, t4)
    seg(t1, t2); seg(t3, t4); ring(-2.6, 2.6, 0, 1.4, 7, true)
    seg(pt(-2.6, 2.6, 0), pt(-2.6, 4.6, 0))
  } else if (type === 'shuttle') {
    let prev: number[] | null = null
    ;([[-5, 1.7], [-2, 1.9], [1, 1.9], [4, 1.6], [5.6, 1.1]] as const).forEach((q) => {
      const cur = ring(q[0], 0, 0, q[1], 6)
      if (prev) for (let i = 0; i < 6; i++) seg(prev[i], cur[i])
      prev = cur
    })
    box(-1, -2.1, 1.7, 5, 1.2, 1); box(-1, -2.1, -1.7, 5, 1.2, 1); box(-4.5, 2, 0, 2, 1, 1)
  } else if (type === 'exotic') {
    let prev: number[] = []
    ;([[-5, 0.5], [-3.2, 1.5], [-1, 2.1], [1.4, 1.9], [3.6, 1.2], [5.4, 0.5]] as const).forEach((q) => {
      const cur = ring(q[0], 0, 0, q[1], 7)
      if (prev.length) for (let i = 0; i < 7; i++) seg(prev[i], cur[i])
      prev = cur
    })
    const m = pt(6.6, 0, 0); prev.forEach((i2) => seg(i2, m))
    quad([-0.5, 2, 0], [-2, 4.8, 0], [-3.6, 1.7, 0], [-2, 1.9, 0]); ring(-5, 0.5, 0, 0.9, 5, true)
  } else if (type === 'solar') {
    box(0.5, 0, 0, 8, 2.2, 1.8)
    const n2 = pt(5.6, 0.2, 0); seg(n2, pt(4.5, 0.9, 0))
    quad([1, 0.9, 0.9], [4.2, 4.4, 3.8], [-0.8, 4.7, 4.2], [-2.6, 1.1, 1.1])
    quad([1, 0.9, -0.9], [4.2, 4.4, -3.8], [-0.8, 4.7, -4.2], [-2.6, 1.1, -1.1])
    seg(pt(0, 1, 1), pt(1.6, 4.5, 4)); seg(pt(0, 1, -1), pt(1.6, 4.5, -4)); ring(-4.6, 0, 0, 0.8, 5)
  } else if (type === 'interceptor') {
    box(0.5, 0.4, 0, 7, 2.4, 2.4); ring(3.4, -0.9, 0, 1.05, 6)
    quad([-0.8, 0.2, 1.2], [-4.4, 2.4, 4.6], [-5.6, 1.7, 4.1], [-2.6, -0.1, 1.2])
    quad([-0.8, 0.2, -1.2], [-4.4, 2.4, -4.6], [-5.6, 1.7, -4.1], [-2.6, -0.1, -1.2])
    box(-6.6, 2.9, 4.9, 1, 1, 1); box(-6.6, 2.9, -4.9, 1, 1, 1)
    const s2 = pt(7.2, 0.4, 0), s3 = pt(9, 0.4, 0); seg(s2, s3)
  } else if (type === 'living') {
    let prev: number[] = []
    for (let i = 0; i < 6; i++) {
      const x = -5 + i * 2.1, r = 1.9 - Math.abs(i - 2) * 0.32, y = Math.sin(i * 0.9) * 0.6
      const cur = ring(x, y, 0, Math.max(0.5, r), 7)
      if (prev.length) for (let j2 = 0; j2 < 7; j2++) seg(prev[j2], cur[j2])
      prev = cur
    }
    const m = pt(7.4, 0.5, 0); prev.forEach((i2) => seg(i2, m))
    seg(pt(-5, 0.6, 0.5), pt(-7, 2, 1.2))
    seg(pt(-5, 0.4, -0.5), pt(-7.2, 1.4, -1.4))
    seg(pt(-5, -0.6, 0), pt(-7, -1.6, 0.4))
  } else if (type === 'freighter') {
    box(0, 0, 0, 17, 2.4, 3); box(1, 1.8, 0, 8, 1.2, 1.8); box(-4.5, 3, 0, 2.4, 1.8, 1.6)
    ring(-8.8, 0.6, 1, 0.65, 5); ring(-8.8, 0.6, -1, 0.65, 5); ring(-8.8, -0.7, 0, 0.75, 5)
    seg(pt(-4.5, 3.9, 0), pt(-4.5, 5.2, 0))
    const n2 = pt(9.4, 0, 0); seg(n2, pt(8.5, 1, 0)); seg(n2, pt(8.5, -1, 0))
  } else if (type === 'corvette') {
    box(0, -0.6, 0, 12, 2, 2.8); box(0.5, 1.3, 0, 8, 1.8, 2.2); box(-3.2, 2.9, 0, 2, 1.4, 1.4)
    box(2, -0.6, 2.3, 5, 1.4, 1); box(2, -0.6, -2.3, 5, 1.4, 1)
    ring(-6.2, -0.4, 1, 0.6, 5); ring(-6.2, -0.4, -1, 0.6, 5)
    seg(pt(-3.2, 3.6, 0), pt(-3.2, 4.8, 0))
  } else {
    box(0, 0, 0, 9, 2.6, 2.2)
  }

  shipCache[type] = model
  return model
}

export function toolModel(type: string): WireModel {
  if (toolCache[type]) return toolCache[type]
  const { model, pt, seg, box, ring, tube } = builder()

  if (type === 'pistol') {
    box(0, 0, 0, 7, 3.2, 2.2); box(-1.2, -3.2, 0, 2.2, 3.6, 1.6); box(0.5, 2.2, 0, 3, 1, 1)
    tube(3.5, 7.5, 0.3, 0.8, 6); ring(7.5, 0.3, 0, 1.1, 6)
  } else if (type === 'rifle') {
    box(0, 0, 0, 11, 2.8, 2); box(-7.2, -0.6, 0, 3.4, 2.2, 1.6); box(-1.8, -2.9, 0, 1.8, 3, 1.4)
    tube(5.5, 11, 0.2, 0.65, 6); ring(11, 0.2, 0, 0.95, 6); tube(-2.2, 0.8, 2.5, 0.8, 5)
  } else if (type === 'experimental') {
    box(0, 0, 0, 9.5, 3, 2.1); box(-6.5, -0.5, 0, 3, 2, 1.5); box(-1.5, -2.9, 0, 1.8, 2.8, 1.4)
    tube(4.7, 9.5, 0, 0.55, 5); ring(10.6, 0, 0, 1.15, 7); ring(10.6, 0, 0, 0.45, 5)
    const a = pt(1, 1.5, 0), b2 = pt(2.2, 4.6, 0); seg(a, b2); ring(2.2, 4.6, 0, 0.55, 5, true)
    box(0.5, 0, 1.9, 3, 1.6, 1); box(0.5, 0, -1.9, 3, 1.6, 1)
  } else if (type === 'alien') {
    let prev: number[] = []
    for (let i = 0; i < 7; i++) {
      const x = -6.5 + i * 2.2, r = 2 - Math.abs(i - 2.4) * 0.34, y = Math.sin(i * 0.85) * 0.7
      const cur = ring(x, y, 0, Math.max(0.55, r), 7)
      if (prev.length) for (let j2 = 0; j2 < 7; j2++) seg(prev[j2], cur[j2])
      prev = cur
    }
    const t1 = pt(-4.2, 2.6, 0.8), t2 = pt(-2.6, 1.6, 0.4); seg(t1, t2)
    const t3 = pt(-1, 3, -0.7), t4 = pt(0, 1.7, -0.3); seg(t3, t4)
    const m = pt(8.6, 0.4, 0); prev.forEach((i2) => seg(i2, m))
  } else if (type === 'royal') {
    box(0, 0.2, 0, 10, 2.2, 1.5); box(-2, -2.6, 0, 1.8, 2.8, 1.3)
    tube(5, 9.5, 0.2, 0.5, 5); ring(9.5, 0.2, 0, 0.8, 6)
    const f1 = pt(-4, 1.3, 0), f2 = pt(-1.5, 4.8, 0), f3 = pt(1.8, 1.3, 0), f4 = pt(0.4, 3.4, 0)
    seg(f1, f2); seg(f2, f3); seg(f1, f4); seg(f4, f3); seg(f2, f4)
  } else if (type === 'sentinel') {
    box(0, 0, 0, 8.5, 3, 2.3); box(-5.5, -0.5, 0, 2.6, 2.2, 1.7); box(-1, -3, 0, 1.8, 3, 1.4)
    ring(3, 0, 0, 1.5, 4); ring(3, 0, 0, 2.1, 4)
    box(6.2, 1.9, 1.5, 1.2, 1.2, 1.2); box(6.8, -1.4, -1.3, 1.1, 1.1, 1.1); box(7.9, 0.5, 0.2, 1.3, 1.3, 1.3)
    const s2 = pt(9.4, 0, 0), s3 = pt(11, 0, 0); seg(s2, s3)
  } else if (type === 'atlantid') {
    const tip = pt(9, 0, 0), tail = pt(-8, 0, 0)
    const mid = [pt(0, 2.4, 0), pt(0, 0, 2.4), pt(0, -2.4, 0), pt(0, 0, -2.4)]
    mid.forEach((m, i2) => { seg(tip, m); seg(tail, m); seg(m, mid[(i2 + 1) % 4]) })
    const t2 = pt(4.5, 0, 0)
    ;[pt(2, 1.3, 0), pt(2, -1.3, 0)].forEach((m) => seg(t2, m))
    const c1 = pt(-2, -3.4, 0.8), c2 = pt(-3.4, -2.2, 0.5), c3 = pt(-1.2, -2.3, 0.9)
    seg(c1, c2); seg(c2, c3); seg(c3, c1)
  } else if (type === 'staff') {
    tube(-10, 6.5, 0, 0.32, 4); ring(-10, 0, 0, 0.55, 4); ring(6.5, 0, 0, 0.6, 5)
    ring(8.4, 1.1, 0, 2.5, 9, true); ring(8.4, 1.1, 0, 1.6, 7, true); ring(8.4, 1.1, 0, 0.5, 5, true)
    const b1 = pt(6.5, 0, 0), b2 = pt(7.2, -1.6, 0), b3 = pt(8.6, -1.3, 0)
    seg(b1, b2); seg(b2, b3)
  } else {
    box(0, 0, 0, 9, 3, 2)
  }

  toolCache[type] = model
  return model
}
