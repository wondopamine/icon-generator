import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 96,
          border: '8px solid #0f0f0f',
          color: '#0f0f0f',
          fontSize: 280,
          fontWeight: 700,
          letterSpacing: -12,
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
