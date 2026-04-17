'use client'

import { useEffect, useState } from 'react'
import { loadIconShapes, getCachedIconShapes } from '@/lib/icon-loader'
import { transformIcon, type Preset, type IconShape } from '@/lib/transform'
import { cn } from '@/lib/utils'

interface TransformedIconProps {
  iconId: string
  preset: Preset
  size?: number
  className?: string
}

const renderCache = new Map<string, string>()
const cacheKey = (iconId: string, preset: Preset) => `${iconId}::${preset}`

function runTransform(iconId: string, preset: Preset, shapes: IconShape[]): string | null {
  try {
    const output = transformIcon({ iconId, shapes, preset })
    renderCache.set(cacheKey(iconId, preset), output)
    return output
  } catch (err) {
    console.warn(`[transformed-icon] transform failed for ${iconId}:`, err)
    return null
  }
}

export function TransformedIcon({
  iconId,
  preset,
  size = 28,
  className,
}: TransformedIconProps) {
  const cached = renderCache.get(cacheKey(iconId, preset))
  const [svg, setSvg] = useState<string | null>(cached ?? null)

  useEffect(() => {
    const key = cacheKey(iconId, preset)
    const hit = renderCache.get(key)
    if (hit) {
      setSvg(hit)
      return
    }

    let cancelled = false
    const cachedShapes = getCachedIconShapes(iconId)

    if (cachedShapes) {
      const result = runTransform(iconId, preset, cachedShapes)
      if (!cancelled) setSvg(result)
      return
    }

    loadIconShapes(iconId).then((shapes) => {
      if (cancelled) return
      if (!shapes) {
        setSvg(null)
        return
      }
      setSvg(runTransform(iconId, preset, shapes))
    })

    return () => {
      cancelled = true
    }
  }, [iconId, preset])

  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {svg ? (
        <span
          style={{ width: size, height: size, display: 'inline-block' }}
          dangerouslySetInnerHTML={{ __html: resize(svg, size) }}
        />
      ) : (
        <span
          className="animate-pulse rounded-sm bg-muted"
          style={{ width: size * 0.8, height: size * 0.8 }}
        />
      )}
    </span>
  )
}

function resize(svgMarkup: string, size: number): string {
  return svgMarkup.replace(
    /<svg([^>]*?)\swidth="[^"]*"([^>]*?)\sheight="[^"]*"([^>]*?)>/,
    `<svg$1 width="${size}"$2 height="${size}"$3>`,
  )
}
