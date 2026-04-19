import JSZip from 'jszip'
import { ICONS } from '@/lib/icons'
import { buildSvg } from '@/lib/build-svg'
import type { Preset } from '@/lib/transform'

interface BulkExportOptions {
  preset: Preset
  roughnessByIcon: Record<string, number>
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

const BATCH_SIZE = 25

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function buildLucideZip(opts: BulkExportOptions): Promise<Blob> {
  const { preset, roughnessByIcon, onProgress, signal } = opts
  const zip = new JSZip()
  const total = ICONS.length
  let done = 0

  for (let i = 0; i < total; i += BATCH_SIZE) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const batch = ICONS.slice(i, i + BATCH_SIZE)
    const built = await Promise.all(
      batch.map(async (icon) => {
        const rm = roughnessByIcon[icon.id] ?? 1
        const svg = await buildSvg(icon.id, preset, rm)
        return [icon.id, svg] as const
      }),
    )
    for (const [id, svg] of built) {
      if (svg) zip.file(`${id}.svg`, svg)
    }
    done += batch.length
    onProgress?.(Math.min(done, total), total)
    await yieldToMain()
  }

  return zip.generateAsync({ type: 'blob' })
}

export function lucideIconCount(): number {
  return ICONS.length
}
