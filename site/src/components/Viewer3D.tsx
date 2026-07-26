import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { buildModel, disposeModel } from '../lib/meshes'
import type { PartKey } from '../data/catalogue'
import { prefersReducedMotion } from '../lib/util'
import { useAtlas } from '../lib/store'

interface Props {
  kind: 'ship' | 'tool'
  type: string
  /** hull accent, driven by the C/B/A/S class */
  accent: string
  /** parts that carry an installed technology — they pulse */
  activeParts: PartKey[]
  /** solid shading, or the holographic wireframe look */
  mode: 'solid' | 'holo'
  height?: number
}

const CLASS_GLOW = 0x66e0ff

/**
 * Real-time 3D bench viewer: orbit by dragging, wheel to zoom, auto-rotate when idle.
 * Parts belonging to installed technology families pulse, so a build reads on the model itself.
 *
 * The renderer and scene live for the lifetime of the component; swapping archetype or class
 * only rebuilds the model. (Recreating the WebGLRenderer on every change would burn through the
 * browser's WebGL context budget after a dozen clicks.)
 */
export default function Viewer3D({ kind, type, accent, activeParts, mode, height = 300 }: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const activeRef = useRef<PartKey[]>(activeParts)
  const modeRef = useRef(mode)
  const { settings } = useAtlas()

  const sceneRef = useRef<THREE.Scene | null>(null)
  const pivotRef = useRef<THREE.Group | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const distRef = useRef(9)
  const fitRef = useRef({ h: 2, w: 4 })
  const drawRef = useRef<(() => void) | null>(null)
  const applyModeRef = useRef<(() => void) | null>(null)
  const frameRef = useRef<(() => void) | null>(null)
  const zoomRef = useRef<((dir: number) => void) | null>(null)
  const resetRef = useRef<(() => void) | null>(null)

  activeRef.current = activeParts
  modeRef.current = mode

  // ── renderer + scene: created once per mount ────────────────────────────
  useEffect(() => {
    const el = mount.current
    if (!el) return

    const reduce = prefersReducedMotion() || settings.motion === 'calme'
    let W = el.clientWidth || 400
    const H = height

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(W, H, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    Object.assign(renderer.domElement.style, {
      width: '100%', height: height + 'px', display: 'block', touchAction: 'pan-y', cursor: 'grab',
    })
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)

    // A generated room environment gives the metal real reflections — no external HDR needed.
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture
    // the generated room is a bright studio — dial it back so it reads as reflection, not floodlight
    scene.environmentIntensity = 0.3

    scene.add(new THREE.HemisphereLight(0x8ab4ff, 0x0a0f1c, 0.28))
    const key = new THREE.DirectionalLight(0xffffff, 1.7)
    key.position.set(4, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    key.shadow.camera.left = -6; key.shadow.camera.right = 6
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6
    key.shadow.bias = -0.0015
    key.shadow.radius = 3
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xff9a4d, 1.1)
    rim.position.set(-5, 1.5, -3)
    scene.add(rim)
    const fill = new THREE.PointLight(0x5fd0e0, 14, 22)
    fill.position.set(-2, -2.5, 3)
    scene.add(fill)

    // hangar rings under the model
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x5fd0e0, transparent: true, opacity: 0.14, side: THREE.DoubleSide,
    })
    const ringGeos: THREE.BufferGeometry[] = []
    const rings: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const g = new THREE.RingGeometry(2.2 + i * 0.9, 2.26 + i * 0.9, 64)
      const m = new THREE.Mesh(g, ringMat)
      m.rotation.x = -Math.PI / 2
      m.position.y = -1.85
      ringGeos.push(g)
      scene.add(m)
      rings.push(m)
    }

    // contact shadow under the model
    const shadowGeo = new THREE.PlaneGeometry(24, 24)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.38 })
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    const pivot = new THREE.Group()
    scene.add(pivot)
    pivotRef.current = pivot

    // bloom so engine cores and muzzle glow actually read as light
    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    composer.setSize(W, H)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.92)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    const computeDist = () => {
      const halfV = Math.tan((camera.fov * Math.PI) / 360)
      const distV = fitRef.current.h / 2 / halfV
      const distW = fitRef.current.w / 2 / (halfV * camera.aspect)
      return Math.max(2.5, Math.max(distV, distW) * 1.16)
    }

    /**
     * Fit to the model's real projected extents. A bounding *sphere* badly under-fills
     * elongated shapes — a rifle would only use ~28% of the frame.
     */
    frameRef.current = () => {
      const model = modelRef.current
      if (!model) return
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      fitRef.current = {
        h: Math.max(0.5, size.y),
        w: Math.max(0.5, Math.sqrt(size.x * size.x + size.z * size.z)),
      }
      distRef.current = computeDist()
      const ringBase = Math.max(1.4, fitRef.current.w * 0.46)
      const floor = -size.y / 2 - 0.45
      rings.forEach((ring, i) => {
        ring.position.y = floor
        ring.scale.setScalar((ringBase + i * ringBase * 0.42) / 2.2)
      })
      shadowPlane.position.y = floor - 0.02
    }

    applyModeRef.current = () => {
      const model = modelRef.current
      if (!model) return
      const holo = modeRef.current === 'holo'
      shadowPlane.visible = !holo
      model.traverse((o) => {
        if (o.userData.edge) { o.visible = !holo; return }
        if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = !holo }
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const mat = m.material as THREE.MeshStandardMaterial
        if (!mat || !('wireframe' in mat)) return
        mat.wireframe = holo
        if (holo) {
          mat.userData.savedColor ??= mat.color.getHex()
          mat.userData.savedEmissive ??= mat.emissive.getHex()
          mat.color.set(0x5fd0e0)
          mat.emissive.set(0x2e6f80)
          mat.transparent = true
          mat.opacity = 0.85
        } else if (mat.userData.savedColor != null) {
          mat.color.setHex(mat.userData.savedColor)
          mat.emissive.setHex(mat.userData.savedEmissive)
          mat.transparent = false
          mat.opacity = 1
        }
        mat.needsUpdate = true
      })
    }

    let yaw = -0.6, pitch = 0.26, zoom = 1
    let drag = false, px = 0, py = 0, vel = 0
    const dom = renderer.domElement

    dom.onpointerdown = (ev) => {
      drag = true; px = ev.clientX; py = ev.clientY; dom.style.cursor = 'grabbing'
      try { dom.setPointerCapture(ev.pointerId) } catch { /* older browsers */ }
    }
    dom.onpointermove = (ev) => {
      if (!drag) return
      const dx = ev.clientX - px, dy = ev.clientY - py
      px = ev.clientX; py = ev.clientY
      yaw += dx * 0.01
      pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.008))
      vel = dx * 0.01
      if (reduce) draw()
    }
    const endDrag = () => { drag = false; dom.style.cursor = 'grab' }
    dom.onpointerup = endDrag
    dom.onpointerleave = endDrag
    // Plain wheel keeps scrolling the page — a small embedded viewer must not trap the scroll.
    // Ctrl/⌘ + wheel zooms, and the ± buttons cover touch and discoverability.
    dom.onwheel = (ev) => {
      if (!ev.ctrlKey && !ev.metaKey) return
      ev.preventDefault()
      zoom = Math.max(0.55, Math.min(2.2, zoom * Math.exp(ev.deltaY * 0.0012)))
      if (reduce) draw()
    }
    zoomRef.current = (dir) => {
      zoom = Math.max(0.55, Math.min(2.2, zoom * (dir > 0 ? 0.82 : 1.22)))
      if (reduce) draw()
    }
    resetRef.current = () => {
      yaw = -0.6; pitch = 0.26; zoom = 1
      if (reduce) draw()
    }

    const resize = () => {
      W = el.clientWidth || 400
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H, false)
      composer.setSize(W, H)
      bloom.setSize(W, H)
      distRef.current = computeDist()
      if (reduce) draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let raf = 0
    let running = true
    let lastMode = modeRef.current

    function draw() {
      const t = performance.now() / 1000
      if (modeRef.current !== lastMode) { applyModeRef.current?.(); lastMode = modeRef.current }
      if (!reduce && !drag) { yaw += 0.0045 + vel * 0.25; vel *= 0.93 }

      const r = distRef.current * zoom
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * r,
        Math.sin(pitch) * r + 0.35,
        Math.cos(yaw) * Math.cos(pitch) * r,
      )
      camera.lookAt(0, 0, 0)

      const act = activeRef.current
      modelRef.current?.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh || m.userData.edge) return
        const part = m.userData.part as PartKey | undefined
        const mat = m.material as THREE.MeshStandardMaterial
        if (!mat || mat.emissiveIntensity === undefined) return
        if (m.userData.flame) {
          mat.emissiveIntensity = reduce ? 2.2 : 1.9 + Math.sin(t * 3.1) * 0.5
        } else if (part && act.includes(part)) {
          mat.emissiveIntensity = reduce ? 0.9 : 0.55 + Math.sin(t * 2.4) * 0.35
        } else if (mat.emissiveIntensity > 0) {
          mat.emissiveIntensity = 0.18
        }
        if (m.userData.float && !reduce) {
          m.position.y = (m.userData.baseY ??= m.position.y) + Math.sin(t * 1.4) * m.userData.float
        }
      })

      rings.forEach((ring, i) => {
        ring.rotation.z = reduce ? 0 : t * (0.05 + i * 0.02) * (i % 2 ? -1 : 1)
      })

      composer.render()
      if (!reduce && running) raf = requestAnimationFrame(draw)
    }
    drawRef.current = draw

    // don't burn frames while the bench is scrolled out of view
    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting
      if (visible && !running) { running = true; if (!reduce) raf = requestAnimationFrame(draw) }
      else if (!visible && running) { running = false; if (raf) cancelAnimationFrame(raf) }
    }, { threshold: 0.01 })
    io.observe(el)

    if (reduce) draw()
    else raf = requestAnimationFrame(draw)

    return () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      dom.onpointerdown = null; dom.onpointermove = null
      dom.onpointerup = null; dom.onpointerleave = null; dom.onwheel = null
      if (modelRef.current) { disposeModel(modelRef.current); modelRef.current = null }
      ringGeos.forEach((g) => g.dispose())
      ringMat.dispose()
      shadowGeo.dispose()
      shadowMat.dispose()
      composer.dispose()
      envRT.texture.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (dom.parentNode === el) el.removeChild(dom)
      pivotRef.current = null
      drawRef.current = null
      frameRef.current = null
      applyModeRef.current = null
    }
  }, [height, settings])

  // ── model swap: archetype or class changed ──────────────────────────────
  useEffect(() => {
    const pivot = pivotRef.current
    if (!pivot) return
    if (modelRef.current) {
      pivot.remove(modelRef.current)
      disposeModel(modelRef.current)
    }
    const model = buildModel(kind, type, {
      hull: 0x76839b, accent: new THREE.Color(accent).getHex(), glow: CLASS_GLOW,
    })
    model.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.userData.edge) o.castShadow = true })
    modelRef.current = model
    pivot.add(model)
    frameRef.current?.()
    applyModeRef.current?.()
    drawRef.current?.()
  }, [kind, type, accent])

  const btn: React.CSSProperties = {
    cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(120,150,220,.25)', background: 'rgba(6,9,18,.75)',
    color: '#9aa6c8', fontFamily: "'Space Mono',monospace", fontSize: 12, lineHeight: 1,
  }

  return (
    <div ref={mount} style={{ width: '100%', height, position: 'relative' }}>
      <div style={{
        position: 'absolute', right: 6, bottom: 6, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2,
      }}>
        <button className="hv-close" style={btn} aria-label="Zoom avant" onClick={() => zoomRef.current?.(1)}>+</button>
        <button className="hv-close" style={btn} aria-label="Zoom arrière" onClick={() => zoomRef.current?.(-1)}>−</button>
        <button className="hv-close" style={btn} aria-label="Recadrer" onClick={() => resetRef.current?.()}>⟲</button>
      </div>
    </div>
  )
}
