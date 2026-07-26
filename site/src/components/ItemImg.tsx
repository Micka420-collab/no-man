import { useEffect, useState } from 'react'

interface Props {
  src?: string
  alt?: string
  size: number
  /** shown instead when the image fails to load; nothing is rendered when omitted */
  fallbackSrc?: string
  style?: React.CSSProperties
}

/**
 * An item icon from the Assistant NMS CDN, with a graceful failure.
 *
 * Icon URLs come from the game data and are correct, but the CDN can be unreachable — offline,
 * blocked by a network policy, or simply down. A bare <img> shows the browser's broken-image
 * glyph in that case; this swaps in a locally generated fallback, or renders nothing.
 */
export default function ItemImg({ src, alt = '', size, fallbackSrc, style }: Props) {
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false) }, [src])

  const url = failed ? fallbackSrc : src
  if (!url) return null

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
    />
  )
}
