const mono = "'Space Mono',monospace"

/** The `// KICKER` + big title + intro paragraph shared by every inner section. */
export default function SectionHeader({ kicker, title, intro, kickerColor = '#5fd0e0', introWidth = 680 }: {
  kicker: string
  title: string
  intro: string
  kickerColor?: string
  introWidth?: number
}) {
  return (
    <>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.24em', color: kickerColor }}>// {kicker}</div>
      <h2 style={{
        margin: '12px 0 0', fontWeight: 700, fontSize: 'clamp(30px,4vw,46px)', letterSpacing: '-.01em',
        color: '#fff', lineHeight: 1.02,
      }}>{title}</h2>
      <p style={{ margin: '12px 0 0', maxWidth: introWidth, fontSize: 15, lineHeight: 1.6, color: '#9aa6c8' }}>{intro}</p>
    </>
  )
}
