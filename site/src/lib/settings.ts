import { readJSON, writeJSON } from './util'

/**
 * The prototype exposed three authoring props (Ambiance · motion / starDensity,
 * Interface · showTicker). There is no design-tool inspector on the real site, so the
 * same knobs are read from the query string and remembered on the device:
 *   ?motion=calme|vivant   ?stars=1500..9000   ?ticker=0|1
 */
export interface Settings {
  motion: 'vivant' | 'calme'
  starDensity: number
  showTicker: boolean
}

const KEY = 'atlas-terminal-settings'

const DEFAULTS: Settings = { motion: 'vivant', starDensity: 5200, showTicker: true }

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function loadSettings(): Settings {
  const stored = { ...DEFAULTS, ...readJSON<Partial<Settings>>(KEY, {}) }
  const q = new URLSearchParams(window.location.search)

  const motion = q.get('motion')
  if (motion === 'calme' || motion === 'vivant') stored.motion = motion

  const stars = q.get('stars')
  if (stars && !isNaN(Number(stars))) stored.starDensity = clamp(Math.round(Number(stars)), 1500, 9000)

  const ticker = q.get('ticker')
  if (ticker != null) stored.showTicker = ticker !== '0' && ticker !== 'false'

  const out: Settings = {
    motion: stored.motion ?? DEFAULTS.motion,
    starDensity: clamp(stored.starDensity ?? DEFAULTS.starDensity, 1500, 9000),
    showTicker: stored.showTicker ?? DEFAULTS.showTicker,
  }
  writeJSON(KEY, out)
  return out
}
