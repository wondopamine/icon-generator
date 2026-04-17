import { dynamicIconImports } from 'lucide-react/dynamic'
import type { IconShape } from '@/lib/transform'

const cache = new Map<string, IconShape[] | null>()
const inflight = new Map<string, Promise<IconShape[] | null>>()

type ImportMap = Record<string, () => Promise<{ __iconNode?: unknown; default: unknown }>>

export async function loadIconShapes(iconId: string): Promise<IconShape[] | null> {
  if (cache.has(iconId)) return cache.get(iconId) ?? null
  const existing = inflight.get(iconId)
  if (existing) return existing

  const importFn = (dynamicIconImports as ImportMap)[iconId]
  if (!importFn) {
    cache.set(iconId, null)
    return null
  }

  const promise = importFn()
    .then((mod) => {
      const nodes = (mod as { __iconNode?: IconShape[] }).__iconNode ?? null
      cache.set(iconId, nodes)
      inflight.delete(iconId)
      return nodes
    })
    .catch(() => {
      cache.set(iconId, null)
      inflight.delete(iconId)
      return null
    })

  inflight.set(iconId, promise)
  return promise
}

export function getCachedIconShapes(iconId: string): IconShape[] | null | undefined {
  return cache.get(iconId)
}
