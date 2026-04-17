import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#0f0f0f',
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: -4,
          fontFamily: 'sans-serif',
          transform: 'rotate(-4deg)',
        }}
      >
        IG
      </div>
    ),
    size,
  )
}
