import { useEffect, useState } from 'react'

interface Props {
  src?: string
  alt?: string
}

/**
 * A video thumbnail that degrades into a starfield placeholder.
 *
 * Thumbnails are hosted by YouTube, so they can fail for reasons that have nothing to do with the
 * site — a removed video, an offline viewer, a network policy that blocks the host. A bare <img>
 * leaves the browser's broken-image glyph sitting inside the card; this keeps the card looking
 * deliberate and lets the title and play button carry it.
 */
export default function Thumb({ src, alt = '' }: Props) {
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false) }, [src])

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  return (
    <div aria-hidden="true" style={{
      width: '100%', height: '100%',
      background:
        'radial-gradient(120% 90% at 20% 10%,rgba(95,208,224,.18),transparent 60%),'
        + 'radial-gradient(90% 80% at 85% 90%,rgba(255,122,26,.16),transparent 62%),'
        + 'linear-gradient(160deg,#0d1428,#070a16)',
    }} />
  )
}
