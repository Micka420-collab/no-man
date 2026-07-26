import type { Lang } from '../types'

const BASE = import.meta.env.BASE_URL

/** Repo-relative asset path ("assets/ships/x.webp" or "ships/x.webp") → servable URL. */
export function asset(path: string): string {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return BASE + 'assets/' + path.replace(/^\/?assets\//, '')
}

export function dataUrl(name: string): string {
  return BASE + 'data/' + name + '.json'
}

/** 12 345 → "12 345" (narrow no-break space, as in the design). */
export function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function fmtViews(n: number | null | undefined): string {
  const v = n || 0
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(v)
}

/** Bilingual field lookup: L2(o, 'name') → o.name_fr | o.name_en | o.name. */
export function L2(o: unknown, base: string, lang: Lang): string {
  if (!o || typeof o !== 'object') return ''
  const r = o as Record<string, unknown>
  const v = r[base + '_' + lang] ?? r[base + '_fr'] ?? r[base]
  return v == null ? '' : String(v)
}

export function fmtDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(dt)
  } catch {
    return iso
  }
}

export function daysBetween(a: number, b: number): number {
  return Math.round((a - b) / 86400000)
}

/** "#ff7a1a" + alpha → "rgba(255,122,26,alpha)". */
export function hexA(hex: string | undefined, a: number): string {
  const h = String(hex || '#8a96a8').replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}

/** Accent- and case-insensitive search key. */
export function norm(x: unknown): string {
  return String(x ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function prefersReducedMotion(): boolean {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

/** SVG crystal placeholder for raw substances with no CDN icon. */
export function rawIconFallback(_id: string, color?: string): string {
  const col = color || '#5fd0e0'
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>" +
    "<path d='M20 3 31 14 26 36 14 36 9 14Z' fill='" + col + "' opacity='.25' stroke='" + col + "' stroke-width='1.5'/>" +
    "<path d='M20 3V36M9 14H31' stroke='" + col + "' stroke-width='1' opacity='.5'/></svg>"
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode) — builds simply aren't persisted */
  }
}
