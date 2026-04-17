export const runtime = 'nodejs'

interface Payload {
  svg: string
  componentName: string
}

export async function POST(req: Request) {
  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.svg || typeof body.svg !== 'string') {
    return Response.json({ error: 'Missing svg' }, { status: 400 })
  }

  const componentName = sanitizeComponentName(body.componentName)

  try {
    const jsx = svgToJsx(body.svg, componentName)
    return Response.json({ jsx })
  } catch (err) {
    return Response.json(
      {
        error: 'Transform failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

function sanitizeComponentName(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) return 'Icon'
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '')
  if (cleaned.length === 0) return 'Icon'
  const first = cleaned[0].toUpperCase()
  return first + cleaned.slice(1)
}

const ATTR_MAP: Record<string, string> = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
}

function kebabToCamel(markup: string): string {
  return markup.replace(/\s([a-z-]+)=/g, (match, name: string) => {
    const mapped = ATTR_MAP[name]
    return mapped ? ` ${mapped}=` : match
  })
}

// Extract inner markup of <svg>...</svg>, with attrs camelCased. Strips
// width/height/xmlns/role on the root and any inline <title> child — those
// are reintroduced by the generated component from its title prop.
function extractInner(svg: string): { inner: string; rootAttrs: string } {
  const match = svg
    .trim()
    .match(/^<svg([^>]*)>([\s\S]*?)<\/svg>\s*$/)
  if (!match) {
    throw new Error('Input is not a complete <svg> element')
  }
  const rootAttrs = match[1]
    .replace(/\s(width|height|xmlns|role|aria-label)="[^"]*"/g, '')
    .trim()
  const innerRaw = match[2].replace(/<title>[\s\S]*?<\/title>/g, '')
  const inner = kebabToCamel(innerRaw)
  return { inner, rootAttrs: kebabToCamel(rootAttrs) }
}

function svgToJsx(svg: string, componentName: string): string {
  const { inner, rootAttrs } = extractInner(svg)
  const extraAttrs = rootAttrs ? ` ${rootAttrs}` : ''
  return `import type { SVGProps } from 'react'

interface ${componentName}Props extends SVGProps<SVGSVGElement> {
  size?: number | string
  title?: string
}

export function ${componentName}({ size = 24, title, ...props }: ${componentName}Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}${extraAttrs}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      ${inner.trim()}
    </svg>
  )
}
`
}
