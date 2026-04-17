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
  roughnessMultiplier?: number
}

const renderCache = new Map<string, string>()
const cacheKey = (iconId: string, preset: Preset, roughness: number) =>
  `${iconId}::${preset}::${roughness.toFixed(3)}`

function runTransform(
  iconId: string,
  preset: Preset,
  shapes: IconShape[],
  roughnessMultiplier: number,
): string | null {
  try {
    const output = transformIcon({ iconId, shapes, preset, roughnessMultiplier })
    renderCache.set(cacheKey(iconId, preset, roughnessMultiplier), output)
    return output
  } catch (err) {
    console.warn(`[transformed-icon] transform failed for ${iconId}:`, err)
    return null
  }
}

// Resolve the transformed SVG synchronously when data is already available
// in-memory (render cache or cached iconNode). Returns null if an async load
// is required.
function resolveSync(
  iconId: string,
  preset: Preset,
  roughnessMultiplier: number,
): string | null {
  const key = cacheKey(iconId, preset, roughnessMultiplier)
  const hit = renderCache.get(key)
  if (hit) return hit
  const shapes = getCachedIconShapes(iconId)
  if (shapes) return runTransform(iconId, preset, shapes, roughnessMultiplier)
  return null
}

export function TransformedIcon({
  iconId,
  preset,
  size = 28,
  className,
  roughnessMultiplier = 1,
}: TransformedIconProps) {
  // Re-resolve synchronously on every render — the renderCache Map keeps this
  // O(1) after first paint. Avoids useEffect→setState for cache hits.
  const syncSvg = resolveSync(iconId, preset, roughnessMultiplier)
  // Dummy state just to trigger a re-render when async load resolves.
  const [, setTick] = useState(0)

  useEffect(() => {
    if (syncSvg) return
    let cancelled = false
    loadIconShapes(iconId).then((shapes) => {
      if (cancelled || !shapes) return
      runTransform(iconId, preset, shapes, roughnessMultiplier)
      setTick((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [iconId, preset, syncSvg, roughnessMultiplier])

  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {syncSvg ? (
        <span
          style={{ width: size, height: size, display: 'inline-block' }}
          dangerouslySetInnerHTML={{ __html: resize(syncSvg, size) }}
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
