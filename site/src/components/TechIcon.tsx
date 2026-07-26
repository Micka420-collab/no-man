import { useEffect, useState } from 'react'

interface Props {
  /** the game's item icon URL, from the workshop dataset */
  icon?: string
  /** 24×24 stroke path drawn when no real icon is available */
  glyph: string
  color: string
  size: number
  title?: string
}

/**
 * The game's real item icon, with the locally drawn technology glyph as the fallback.
 *
 * Icon URLs come from the game data, so they are correct by construction; the fallback covers the
 * offline case and any CDN hiccup, and means a missing image never renders as a broken icon.
 */
export default function TechIcon({ icon, glyph, color, size, title }: Props) {
  const [failed, setFailed] = useState(false)

  // a new icon gets a fresh chance to load
  useEffect(() => { setFailed(false) }, [icon])

  const src = !failed ? icon : undefined

  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={title}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', flex: '0 0 auto' }}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: '0 0 auto', display: 'block' }}
    >
      {!!title && <title>{title}</title>}
      <path d={glyph} />
    </svg>
  )
}
