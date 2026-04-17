// Curated golden hand-illustrated icons.
//
// Drop SVG files into public/golden/ and register them here. Files should be
// 24x24 viewBox, stroke-based, already styled the way you want them to ship
// (no runtime transform is applied).

export interface GoldenIconMeta {
  id: string
  keywords: string[]
  file: string
}

export const GOLDEN_ICONS: GoldenIconMeta[] = []

const svgCache = new Map<string, string>()

export async function fetchGoldenSvg(file: string): Promise<string | null> {
  const cached = svgCache.get(file)
  if (cached) return cached
  try {
    const res = await fetch(`/golden/${file}`)
    if (!res.ok) return null
    const text = await res.text()
    svgCache.set(file, text)
    return text
  } catch {
    return null
  }
}
