// Renders an SVG string (filter included) to a raster bitmap at high
// resolution, then wraps the bitmap in a thin SVG <image> container. Produces
// pixel-perfect fidelity in viewers that don't execute SVG filters (Figma,
// Finder Quick Look, email clients) at the cost of losing vector editability.

const DEFAULT_RESOLUTION = 512

export interface RasterizeOptions {
  resolution?: number
  titleText?: string
}

export async function rasterizeSvg(
  filterSvg: string,
  opts: RasterizeOptions = {},
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('rasterizeSvg must run in the browser')
  }
  const resolution = opts.resolution ?? DEFAULT_RESOLUTION
  const blob = new Blob([filterSvg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = resolution
    canvas.height = resolution
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    ctx.drawImage(img, 0, 0, resolution, resolution)
    const dataUrl = canvas.toDataURL('image/png')
    const title = opts.titleText ? `<title>${escapeXml(opts.titleText)}</title>` : ''
    const role = opts.titleText ? ' role="img"' : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"${role}>${title}<image href="${dataUrl}" width="24" height="24"/></svg>`
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('failed to load SVG as image'))
    img.src = src
  })
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
