type Attrs = Record<string, string | number | undefined>

export function shapeToPath(tag: string, attrs: Attrs): string | null {
  switch (tag) {
    case 'path':
      return typeof attrs.d === 'string' ? attrs.d : null
    case 'rect': {
      const x = Number(attrs.x ?? 0)
      const y = Number(attrs.y ?? 0)
      const w = Number(attrs.width ?? 0)
      const h = Number(attrs.height ?? 0)
      const rx = Number(attrs.rx ?? 0)
      const ry = Number(attrs.ry ?? rx)
      if (w <= 0 || h <= 0) return null
      if (rx === 0 && ry === 0) {
        return `M${x} ${y} h${w} v${h} h${-w} Z`
      }
      const rX = Math.min(rx, w / 2)
      const rY = Math.min(ry, h / 2)
      return [
        `M${x + rX} ${y}`,
        `h${w - 2 * rX}`,
        `a${rX} ${rY} 0 0 1 ${rX} ${rY}`,
        `v${h - 2 * rY}`,
        `a${rX} ${rY} 0 0 1 ${-rX} ${rY}`,
        `h${-(w - 2 * rX)}`,
        `a${rX} ${rY} 0 0 1 ${-rX} ${-rY}`,
        `v${-(h - 2 * rY)}`,
        `a${rX} ${rY} 0 0 1 ${rX} ${-rY}`,
        'Z',
      ].join(' ')
    }
    case 'circle': {
      const cx = Number(attrs.cx ?? 0)
      const cy = Number(attrs.cy ?? 0)
      const r = Number(attrs.r ?? 0)
      if (r <= 0) return null
      return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`
    }
    case 'ellipse': {
      const cx = Number(attrs.cx ?? 0)
      const cy = Number(attrs.cy ?? 0)
      const rx = Number(attrs.rx ?? 0)
      const ry = Number(attrs.ry ?? 0)
      if (rx <= 0 || ry <= 0) return null
      return `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`
    }
    case 'line':
      return `M${attrs.x1 ?? 0} ${attrs.y1 ?? 0} L${attrs.x2 ?? 0} ${attrs.y2 ?? 0}`
    case 'polyline':
    case 'polygon': {
      const raw = typeof attrs.points === 'string' ? attrs.points : ''
      const pairs = raw.trim().split(/[\s,]+/)
      if (pairs.length < 4) return null
      const parts: string[] = []
      for (let i = 0; i < pairs.length; i += 2) {
        const cmd = i === 0 ? 'M' : 'L'
        parts.push(`${cmd}${pairs[i]} ${pairs[i + 1]}`)
      }
      return parts.join(' ') + (tag === 'polygon' ? ' Z' : '')
    }
    default:
      return null
  }
}
