import * as THREE from 'three'
import type { PartKey } from '../data/catalogue'

/**
 * Procedural 3D models for the workshop viewers.
 *
 * These are original models built from primitives in the visual language of No Man's Sky
 * (angular fighter wings, boxy haulers, organic living ships, crystalline Sentinel hardware).
 * The game's own meshes are proprietary Hello Games assets and are not used here.
 *
 * Every mesh is tagged with `userData.part` so the workshop can light up the section of the model
 * a technology family belongs to.
 */

export interface Palette {
  /** primary hull colour */
  hull: number
  /** trim / panel accent, driven by the ship or tool class */
  accent: number
  /** engine + emissive glow */
  glow: number
}

interface Ctx {
  group: THREE.Group
  mats: THREE.Material[]
  geos: THREE.BufferGeometry[]
  pal: Palette
}

function makeMats(pal: Palette) {
  const hull = new THREE.MeshStandardMaterial({ color: pal.hull, metalness: 0.78, roughness: 0.34 })
  const panel = new THREE.MeshStandardMaterial({ color: 0x1b2338, metalness: 0.5, roughness: 0.6 })
  const accent = new THREE.MeshStandardMaterial({
    color: pal.accent, metalness: 0.7, roughness: 0.3,
    emissive: new THREE.Color(pal.accent).multiplyScalar(0.18),
  })
  const glass = new THREE.MeshStandardMaterial({
    color: 0x0b1a2a, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.72,
    emissive: 0x0a2740, emissiveIntensity: 0.5,
  })
  const glow = new THREE.MeshStandardMaterial({
    color: pal.glow, emissive: pal.glow, emissiveIntensity: 2.2, metalness: 0, roughness: 1,
  })
  const dark = new THREE.MeshStandardMaterial({ color: 0x0d1220, metalness: 0.4, roughness: 0.75 })
  return { hull, panel, accent, glass, glow, dark }
}

type Mats = ReturnType<typeof makeMats>

function add(ctx: Ctx, geo: THREE.BufferGeometry, mat: THREE.Material, part: PartKey,
  pos: [number, number, number], rot?: [number, number, number], scale?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(pos[0], pos[1], pos[2])
  if (rot) m.rotation.set(rot[0], rot[1], rot[2])
  if (scale) m.scale.set(scale[0], scale[1], scale[2])
  m.userData.part = part
  ctx.group.add(m)
  ctx.geos.push(geo)
  return m
}

/** Angular wing/fin built by extruding a 2D profile. */
function wingGeo(pts: [number, number][], depth = 0.12): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1])
  s.closePath()
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 })
}

/** Rounded organic body of revolution. */
function hullGeo(profile: [number, number][], seg = 24): THREE.LatheGeometry {
  return new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), seg)
}

// ───────────────────────────────── STARSHIPS ─────────────────────────────────

function buildShip(type: string, ctx: Ctx, M: Mats) {
  const g = ctx.group

  const engineGlow = (x: number, y: number, z: number, r = 0.22) => {
    add(ctx, new THREE.CylinderGeometry(r, r * 1.15, 0.5, 16), M.dark, 'engine', [x, y, z], [0, 0, Math.PI / 2])
    const flame = add(ctx, new THREE.CircleGeometry(r * 0.85, 16), M.glow, 'engine', [x - 0.26, y, z], [0, -Math.PI / 2, 0])
    flame.userData.flame = true
  }

  if (type === 'fighter') {
    add(ctx, new THREE.BoxGeometry(3.2, 0.62, 0.9), M.hull, 'hull', [0.1, 0, 0])
    add(ctx, new THREE.ConeGeometry(0.46, 1.5, 4), M.hull, 'hull', [2.2, 0, 0], [0, Math.PI / 4, -Math.PI / 2])
    add(ctx, new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 'hull', [0.55, 0.28, 0])
    // swept, tapered wings with a little dihedral
    const wg = wingGeo([[0, 0], [-0.3, 1.15], [-1.45, 2.05], [-2.0, 1.95], [-1.3, 0.85], [-1.05, 0]], 0.13)
    add(ctx, wg, M.hull, 'wing', [0.35, 0.06, 0.42], [Math.PI / 2, 0, -0.1])
    add(ctx, wg, M.hull, 'wing', [0.35, 0.06, -0.42], [-Math.PI / 2, 0, -0.1])
    // wing weapon pods
    add(ctx, new THREE.BoxGeometry(1.1, 0.2, 0.2), M.panel, 'weapon', [-0.6, 0.02, 1.75])
    add(ctx, new THREE.BoxGeometry(1.1, 0.2, 0.2), M.panel, 'weapon', [-0.6, 0.02, -1.75])
    add(ctx, new THREE.BoxGeometry(1.2, 0.5, 0.55), M.hull, 'core', [-1.15, 0.42, 0])
    add(ctx, new THREE.BoxGeometry(0.1, 0.54, 0.6), M.accent, 'core', [-0.58, 0.42, 0])
    engineGlow(-1.6, 0, 0.32); engineGlow(-1.6, 0, -0.32)
  } else if (type === 'hauler') {
    add(ctx, new THREE.BoxGeometry(3.4, 1.5, 1.5), M.hull, 'hull', [-0.2, 0, 0])
    add(ctx, new THREE.BoxGeometry(1.9, 0.7, 1.25), M.panel, 'hull', [-0.5, 1.05, 0])
    add(ctx, new THREE.BoxGeometry(0.9, 0.8, 0.9), M.hull, 'hull', [1.85, 0.25, 0])
    add(ctx, new THREE.BoxGeometry(0.08, 0.85, 0.95), M.accent, 'hull', [1.42, 0.25, 0])
    add(ctx, new THREE.BoxGeometry(0.5, 0.42, 0.72), M.glass, 'hull', [2.25, 0.3, 0])
    add(ctx, new THREE.BoxGeometry(0.9, 0.36, 0.36), M.panel, 'weapon', [1.1, -0.85, 0.55])
    add(ctx, new THREE.BoxGeometry(0.9, 0.36, 0.36), M.panel, 'weapon', [1.1, -0.85, -0.55])
    add(ctx, new THREE.BoxGeometry(0.7, 0.9, 1.4), M.panel, 'core', [-1.75, 0.15, 0])
    add(ctx, new THREE.BoxGeometry(0.12, 0.95, 1.45), M.accent, 'core', [-1.42, 0.15, 0])
    engineGlow(-2.1, 0.42, 0.45); engineGlow(-2.1, 0.42, -0.45); engineGlow(-2.1, -0.45, 0, 0.26)
  } else if (type === 'explorer') {
    add(ctx, hullGeo([[0, -1.5], [0.36, -1.1], [0.46, 0.2], [0.34, 1.1], [0.1, 1.55], [0, 1.6]], 22),
      M.hull, 'hull', [0.15, 0, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 'hull', [0.75, 0.2, 0])
    const wg = wingGeo([[0, 0], [-0.4, 1.6], [-1.1, 2.2], [-1.35, 1.7], [-0.85, 0.1]], 0.1)
    add(ctx, wg, M.hull, 'wing', [-0.15, 0.2, 0.3], [Math.PI / 2, 0, 0])
    add(ctx, wg, M.hull, 'wing', [-0.15, 0.2, -0.3], [-Math.PI / 2, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.05, 1.3, 0.1), M.accent, 'wing', [-0.75, 1.1, 0.55], [0.4, 0, -0.3])
    add(ctx, new THREE.BoxGeometry(0.05, 1.3, 0.1), M.accent, 'wing', [-0.75, 1.1, -0.65], [-0.4, 0, -0.3])
    // scanner dish
    add(ctx, new THREE.TorusGeometry(0.42, 0.05, 8, 22), M.accent, 'core', [-0.9, 0.95, 0], [0, Math.PI / 2, 0])
    add(ctx, new THREE.SphereGeometry(0.13, 12, 10), M.glow, 'core', [-0.9, 0.95, 0])
    add(ctx, new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), M.panel, 'core', [-0.9, 0.5, 0])
    engineGlow(-1.55, 0, 0, 0.3)
  } else if (type === 'shuttle') {
    add(ctx, new THREE.BoxGeometry(2.7, 1.15, 1.2), M.hull, 'hull', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.8, 0.75, 1.05), M.hull, 'hull', [1.6, 0.1, 0])
    add(ctx, new THREE.BoxGeometry(0.08, 0.8, 1.1), M.accent, 'hull', [1.2, 0.1, 0])
    add(ctx, new THREE.BoxGeometry(0.42, 0.5, 0.9), M.glass, 'hull', [1.9, 0.15, 0])
    add(ctx, new THREE.BoxGeometry(1.5, 0.42, 0.42), M.panel, 'wing', [-0.2, -0.5, 0.85])
    add(ctx, new THREE.BoxGeometry(1.5, 0.42, 0.42), M.panel, 'wing', [-0.2, -0.5, -0.85])
    add(ctx, new THREE.BoxGeometry(0.7, 0.55, 0.55), M.panel, 'core', [-1.05, 0.75, 0])
    add(ctx, new THREE.BoxGeometry(0.1, 0.6, 0.6), M.accent, 'core', [-0.72, 0.75, 0])
    add(ctx, new THREE.BoxGeometry(0.6, 0.22, 0.22), M.panel, 'weapon', [1.2, -0.6, 0.45])
    add(ctx, new THREE.BoxGeometry(0.6, 0.22, 0.22), M.panel, 'weapon', [1.2, -0.6, -0.45])
    engineGlow(-1.45, 0.1, 0.42); engineGlow(-1.45, 0.1, -0.42)
  } else if (type === 'exotic') {
    add(ctx, hullGeo([[0, -1.6], [0.3, -1.2], [0.62, -0.2], [0.55, 0.7], [0.22, 1.4], [0, 1.6]], 26),
      M.hull, 'hull', [0, 0, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.TorusGeometry(0.78, 0.09, 10, 30), M.accent, 'core', [-0.1, 0, 0], [0, Math.PI / 2, 0])
    add(ctx, new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 'hull', [0.6, 0.25, 0])
    const fin = wingGeo([[0, 0], [-0.35, 1.5], [-0.95, 1.25], [-0.7, 0]], 0.09)
    add(ctx, fin, M.hull, 'wing', [-0.3, 0.35, 0.12], [Math.PI / 2, 0, 0])
    add(ctx, fin, M.hull, 'wing', [-0.3, -0.35, 0.12], [Math.PI / 2, 0, Math.PI])
    add(ctx, new THREE.BoxGeometry(0.7, 0.16, 0.16), M.panel, 'weapon', [0.9, 0, 0.55])
    add(ctx, new THREE.BoxGeometry(0.7, 0.16, 0.16), M.panel, 'weapon', [0.9, 0, -0.55])
    engineGlow(-1.7, 0, 0, 0.3)
  } else if (type === 'solar') {
    add(ctx, new THREE.BoxGeometry(2.9, 0.6, 0.8), M.hull, 'hull', [0.1, 0, 0])
    add(ctx, new THREE.ConeGeometry(0.34, 1.1, 6), M.hull, 'hull', [1.95, 0, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.SphereGeometry(0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 'hull', [0.6, 0.24, 0])
    // solar sail
    const sail = wingGeo([[0, 0], [0.9, 2.4], [-1.4, 2.7], [-1.1, 0.2]], 0.05)
    add(ctx, sail, M.accent, 'wing', [0, 0.25, 0.06], [Math.PI / 2, 0, 0])
    add(ctx, new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), M.panel, 'wing', [0.2, 1.4, 0], [0, 0, 0.25])
    const fin = wingGeo([[0, 0], [-0.9, 0.9], [-1.4, 0.7], [-0.8, 0]], 0.08)
    add(ctx, fin, M.panel, 'wing', [-0.4, -0.1, 0.4], [Math.PI / 2, 0, 0])
    add(ctx, fin, M.panel, 'wing', [-0.4, -0.1, -0.4], [-Math.PI / 2, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.7, 0.18, 0.18), M.panel, 'weapon', [1.1, -0.35, 0.35])
    add(ctx, new THREE.BoxGeometry(0.7, 0.18, 0.18), M.panel, 'weapon', [1.1, -0.35, -0.35])
    engineGlow(-1.45, 0, 0, 0.26)
  } else if (type === 'interceptor') {
    add(ctx, new THREE.OctahedronGeometry(0.95, 0), M.hull, 'hull', [0, 0, 0], [0, 0, 0], [1.9, 0.55, 0.85])
    add(ctx, new THREE.ConeGeometry(0.3, 1.3, 4), M.accent, 'hull', [1.9, 0, 0], [0, Math.PI / 4, -Math.PI / 2])
    add(ctx, new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 'hull', [0.5, 0.2, 0])
    // floating sentinel plates
    const plate = new THREE.BoxGeometry(1.4, 0.12, 0.75)
    const p1 = add(ctx, plate, M.accent, 'wing', [-0.35, 0.5, 1.15], [0, 0, 0.22])
    const p2 = add(ctx, plate, M.accent, 'wing', [-0.35, 0.5, -1.15], [0, 0, 0.22])
    const p3 = add(ctx, plate, M.accent, 'wing', [-0.35, -0.5, 1.15], [0, 0, -0.22])
    const p4 = add(ctx, plate, M.accent, 'wing', [-0.35, -0.5, -1.15], [0, 0, -0.22])
    ;[p1, p2, p3, p4].forEach((p, i) => { p.userData.float = 0.09 * (i % 2 ? -1 : 1) })
    add(ctx, new THREE.TorusGeometry(0.5, 0.07, 8, 24), M.glow, 'core', [-0.5, 0, 0], [0, Math.PI / 2, 0])
    add(ctx, new THREE.BoxGeometry(0.9, 0.16, 0.16), M.panel, 'weapon', [1.15, -0.3, 0.5])
    add(ctx, new THREE.BoxGeometry(0.9, 0.16, 0.16), M.panel, 'weapon', [1.15, -0.3, -0.5])
    engineGlow(-1.5, 0, 0.3, 0.2); engineGlow(-1.5, 0, -0.3, 0.2)
  } else if (type === 'living') {
    add(ctx, hullGeo([[0, -1.7], [0.34, -1.35], [0.66, -0.4], [0.72, 0.35], [0.4, 1.2], [0.12, 1.65], [0, 1.7]], 24),
      M.hull, 'hull', [0, 0, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.SphereGeometry(0.24, 18, 14), M.glow, 'core', [0.95, 0.22, 0])
    // organic fins
    const fin = wingGeo([[0, 0], [-0.5, 1.1], [-1.25, 1.5], [-1.1, 0.55], [-0.5, 0]], 0.08)
    add(ctx, fin, M.hull, 'wing', [-0.4, 0.3, 0.35], [Math.PI / 2, 0, 0])
    add(ctx, fin, M.hull, 'wing', [-0.4, 0.3, -0.35], [-Math.PI / 2, 0, 0])
    add(ctx, fin, M.hull, 'wing', [-0.5, -0.35, 0], [Math.PI / 2, 0, Math.PI])
    for (let i = 0; i < 5; i++) {
      add(ctx, new THREE.SphereGeometry(0.07, 8, 8), M.glow, 'hull', [0.55 - i * 0.42, 0.42 - i * 0.03, 0])
    }
    engineGlow(-1.75, 0, 0, 0.28)
  } else if (type === 'freighter') {
    add(ctx, new THREE.BoxGeometry(5.2, 0.75, 1.35), M.hull, 'hull', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(2.6, 0.45, 0.95), M.panel, 'hull', [0.4, 0.6, 0])
    add(ctx, new THREE.BoxGeometry(0.75, 0.85, 0.75), M.accent, 'hull', [-1.5, 1.0, 0])
    add(ctx, new THREE.BoxGeometry(0.45, 0.4, 0.6), M.glass, 'hull', [-1.25, 1.15, 0])
    add(ctx, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), M.panel, 'hull', [-1.5, 1.85, 0])
    for (let i = 0; i < 3; i++) {
      add(ctx, new THREE.BoxGeometry(0.5, 0.5, 1.7), M.panel, 'hull', [1.5 - i * 1.1, -0.55, 0])
    }
    add(ctx, new THREE.ConeGeometry(0.32, 0.9, 4), M.accent, 'hull', [2.9, 0, 0], [0, Math.PI / 4, -Math.PI / 2])
    add(ctx, new THREE.BoxGeometry(0.8, 0.8, 1.6), M.panel, 'core', [-2.4, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.12, 0.85, 1.65), M.accent, 'core', [-2.02, 0, 0])
    engineGlow(-2.95, 0.28, 0.5); engineGlow(-2.95, 0.28, -0.5); engineGlow(-2.95, -0.35, 0, 0.26)
  } else {
    // corvette — modular capital-style frame
    add(ctx, new THREE.BoxGeometry(4.2, 0.7, 1.1), M.hull, 'hull', [0, -0.15, 0])
    add(ctx, new THREE.BoxGeometry(2.8, 0.6, 0.85), M.panel, 'hull', [0.2, 0.5, 0])
    add(ctx, new THREE.BoxGeometry(0.7, 0.6, 0.7), M.accent, 'hull', [-1.1, 1.05, 0])
    add(ctx, new THREE.BoxGeometry(0.42, 0.36, 0.55), M.glass, 'hull', [-0.9, 1.12, 0])
    add(ctx, new THREE.BoxGeometry(1.7, 0.45, 0.42), M.panel, 'wing', [0.5, -0.2, 0.9])
    add(ctx, new THREE.BoxGeometry(1.7, 0.45, 0.42), M.panel, 'wing', [0.5, -0.2, -0.9])
    add(ctx, new THREE.ConeGeometry(0.3, 1.0, 6), M.accent, 'hull', [2.4, -0.15, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.BoxGeometry(0.9, 0.24, 0.24), M.panel, 'weapon', [1.5, 0.55, 0.5])
    add(ctx, new THREE.BoxGeometry(0.9, 0.24, 0.24), M.panel, 'weapon', [1.5, 0.55, -0.5])
    add(ctx, new THREE.BoxGeometry(0.8, 0.7, 1.2), M.panel, 'core', [-1.9, -0.15, 0])
    add(ctx, new THREE.BoxGeometry(0.12, 0.75, 1.25), M.accent, 'core', [-1.52, -0.15, 0])
    engineGlow(-2.4, -0.15, 0.42); engineGlow(-2.4, -0.15, -0.42)
  }

  g.rotation.y = -0.5
}

// ──────────────────────────────── MULTI-TOOLS ────────────────────────────────

function buildTool(type: string, ctx: Ctx, M: Mats) {
  const g = ctx.group

  const muzzle = (x: number, r = 0.14) => {
    add(ctx, new THREE.TorusGeometry(r, 0.035, 8, 18), M.accent, 'barrel', [x, 0, 0], [0, Math.PI / 2, 0])
    const core = add(ctx, new THREE.SphereGeometry(r * 0.55, 12, 10), M.glow, 'barrel', [x, 0, 0])
    core.userData.flame = true
  }
  const grip = (x: number, y = -0.55) => {
    add(ctx, new THREE.BoxGeometry(0.3, 0.75, 0.24), M.dark, 'grip', [x, y, 0], [0, 0, 0.18])
  }
  const scope = (x: number, y = 0.4) => {
    add(ctx, new THREE.CylinderGeometry(0.13, 0.13, 0.62, 14), M.panel, 'scope', [x, y, 0], [0, 0, Math.PI / 2])
    add(ctx, new THREE.CircleGeometry(0.1, 14), M.glow, 'scope', [x + 0.32, y, 0], [0, Math.PI / 2, 0])
  }

  if (type === 'pistol') {
    add(ctx, new THREE.BoxGeometry(1.5, 0.6, 0.34), M.hull, 'barrel', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.55, 0.16, 0.3), M.accent, 'barrel', [0.35, 0.36, 0])
    add(ctx, new THREE.CylinderGeometry(0.12, 0.14, 0.9, 14), M.panel, 'barrel', [1.15, 0.05, 0], [0, 0, Math.PI / 2])
    muzzle(1.62, 0.15)
    grip(-0.35, -0.5)
    scope(0.1, 0.42)
  } else if (type === 'rifle') {
    add(ctx, new THREE.BoxGeometry(2.3, 0.5, 0.3), M.hull, 'barrel', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.8, 0.45, 0.26), M.panel, 'grip', [-1.45, -0.1, 0])
    add(ctx, new THREE.CylinderGeometry(0.1, 0.12, 1.3, 14), M.panel, 'barrel', [1.7, 0.03, 0], [0, 0, Math.PI / 2])
    muzzle(2.4, 0.14)
    grip(-0.35)
    scope(0.25, 0.42)
    add(ctx, new THREE.BoxGeometry(0.45, 0.5, 0.22), M.dark, 'barrel', [-0.05, -0.42, 0])
    add(ctx, new THREE.BoxGeometry(1.4, 0.06, 0.32), M.accent, 'barrel', [0.2, 0.27, 0])
    add(ctx, new THREE.BoxGeometry(0.9, 0.16, 0.5), M.panel, 'barrel', [0.5, 0.3, 0])
  } else if (type === 'experimental') {
    add(ctx, new THREE.BoxGeometry(2.0, 0.66, 0.42), M.hull, 'barrel', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.7, 0.5, 0.36), M.panel, 'grip', [-1.25, -0.05, 0])
    add(ctx, new THREE.CylinderGeometry(0.1, 0.1, 1.0, 12), M.panel, 'barrel', [1.5, 0, 0], [0, 0, Math.PI / 2])
    add(ctx, new THREE.TorusGeometry(0.26, 0.06, 10, 22), M.accent, 'barrel', [2.05, 0, 0], [0, Math.PI / 2, 0])
    muzzle(2.05, 0.12)
    grip(-0.3)
    scope(0.2, 0.48)
    add(ctx, new THREE.BoxGeometry(0.55, 0.22, 0.1), M.accent, 'barrel', [0.2, 0.05, 0.24])
    add(ctx, new THREE.BoxGeometry(0.55, 0.22, 0.1), M.accent, 'barrel', [0.2, 0.05, -0.24])
  } else if (type === 'alien') {
    add(ctx, hullGeo([[0, -1.1], [0.2, -0.85], [0.34, -0.1], [0.3, 0.6], [0.14, 1.05], [0, 1.15]], 20),
      M.hull, 'barrel', [0.2, 0, 0], [0, 0, -Math.PI / 2])
    add(ctx, new THREE.TorusGeometry(0.3, 0.07, 10, 20, Math.PI * 1.4), M.accent, 'barrel', [0.1, 0.35, 0], [Math.PI / 2, 0, 0.6])
    muzzle(1.5, 0.13)
    add(ctx, new THREE.CapsuleGeometry(0.11, 0.5, 6, 10), M.dark, 'grip', [-0.5, -0.5, 0], [0, 0, 0.3])
    add(ctx, new THREE.SphereGeometry(0.11, 12, 10), M.glow, 'scope', [-0.1, 0.42, 0.12])
  } else if (type === 'royal') {
    add(ctx, new THREE.BoxGeometry(2.1, 0.42, 0.28), M.hull, 'barrel', [0, 0.05, 0])
    add(ctx, new THREE.CylinderGeometry(0.08, 0.09, 1.1, 12), M.accent, 'barrel', [1.6, 0.05, 0], [0, 0, Math.PI / 2])
    muzzle(2.2, 0.12)
    grip(-0.5, -0.42)
    // crown fins
    const fin = wingGeo([[0, 0], [-0.3, 0.75], [-0.75, 0.5], [-0.5, 0]], 0.06)
    add(ctx, fin, M.accent, 'scope', [0.35, 0.3, 0.04], [Math.PI / 2, 0, 0])
    add(ctx, fin, M.accent, 'scope', [-0.25, 0.3, 0.04], [Math.PI / 2, 0, 0])
    add(ctx, new THREE.SphereGeometry(0.13, 14, 12), M.glow, 'scope', [0.05, 0.62, 0])
  } else if (type === 'sentinel') {
    add(ctx, new THREE.BoxGeometry(1.9, 0.56, 0.4), M.hull, 'barrel', [0, 0, 0])
    add(ctx, new THREE.BoxGeometry(0.75, 0.44, 0.3), M.panel, 'grip', [-1.2, -0.05, 0])
    add(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.9, 6), M.panel, 'barrel', [1.4, 0, 0], [0, 0, Math.PI / 2])
    muzzle(1.95, 0.15)
    grip(-0.3)
    const plate = new THREE.BoxGeometry(0.7, 0.1, 0.4)
    const a = add(ctx, plate, M.accent, 'scope', [0.1, 0.42, 0.4], [0, 0, 0.15])
    const b = add(ctx, plate, M.accent, 'scope', [0.1, 0.42, -0.4], [0, 0, 0.15])
    a.userData.float = 0.06; b.userData.float = -0.06
    add(ctx, new THREE.TorusGeometry(0.3, 0.05, 8, 20), M.glow, 'barrel', [0.75, 0, 0], [0, Math.PI / 2, 0])
  } else if (type === 'atlantid') {
    add(ctx, new THREE.OctahedronGeometry(0.55, 0), M.hull, 'barrel', [0, 0, 0], [0, 0, 0], [2.3, 1, 0.8])
    add(ctx, new THREE.OctahedronGeometry(0.22, 0), M.accent, 'barrel', [0.75, 0.3, 0])
    muzzle(1.5, 0.16)
    grip(-0.45, -0.48)
    const shard = new THREE.OctahedronGeometry(0.18, 0)
    const s1 = add(ctx, shard, M.glow, 'scope', [0.1, 0.55, 0.3])
    const s2 = add(ctx, shard, M.glow, 'scope', [-0.3, 0.5, -0.3])
    s1.userData.float = 0.08; s2.userData.float = -0.07
  } else {
    // staff
    add(ctx, new THREE.CylinderGeometry(0.075, 0.075, 3.4, 12), M.hull, 'barrel', [0, 0, 0], [0, 0, Math.PI / 2])
    add(ctx, new THREE.TorusGeometry(0.46, 0.06, 10, 26), M.accent, 'scope', [1.5, 0.35, 0], [0, Math.PI / 2, 0])
    add(ctx, new THREE.TorusGeometry(0.26, 0.05, 10, 22), M.accent, 'scope', [1.5, 0.35, 0], [0, Math.PI / 2, 0])
    const orb = add(ctx, new THREE.SphereGeometry(0.16, 16, 12), M.glow, 'scope', [1.5, 0.35, 0])
    orb.userData.flame = true
    add(ctx, new THREE.ConeGeometry(0.12, 0.4, 8), M.accent, 'barrel', [-1.8, 0, 0], [0, 0, Math.PI / 2])
    add(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.35, 10), M.dark, 'grip', [-0.3, 0, 0], [0, 0, Math.PI / 2])
    muzzle(1.9, 0.12)
  }

  g.rotation.y = -0.45
}

/**
 * Panel lines. Overlaying edge segments on every solid turns a pile of primitives into
 * something that reads as engineered hardware — the same trick the game's hard-surface art uses.
 */
function addPanelLines(ctx: Ctx) {
  const lineMat = new THREE.LineBasicMaterial({ color: 0x0a1220, transparent: true, opacity: 0.55 })
  ctx.mats.push(lineMat)
  const meshes: THREE.Mesh[] = []
  ctx.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh) })
  meshes.forEach((m) => {
    if (m.userData.flame) return
    const eg = new THREE.EdgesGeometry(m.geometry, 32)
    const seg = new THREE.LineSegments(eg, lineMat)
    seg.userData.edge = true
    ctx.geos.push(eg)
    m.add(seg)
  })
}

/** Build the model for a type; caller owns disposal via {@link disposeModel}. */
export function buildModel(kind: 'ship' | 'tool', type: string, pal: Palette): THREE.Group {
  const group = new THREE.Group()
  const ctx: Ctx = { group, mats: [], geos: [], pal }
  const M = makeMats(pal)
  ctx.mats.push(M.hull, M.panel, M.accent, M.glass, M.glow, M.dark)
  if (kind === 'ship') buildShip(type, ctx, M)
  else buildTool(type, ctx, M)
  addPanelLines(ctx)
  group.userData.mats = ctx.mats
  group.userData.geos = ctx.geos
  return group
}

export function disposeModel(group: THREE.Group) {
  const geos = (group.userData.geos || []) as THREE.BufferGeometry[]
  const mats = (group.userData.mats || []) as THREE.Material[]
  geos.forEach((g) => g.dispose())
  mats.forEach((m) => m.dispose())
  group.clear()
}
