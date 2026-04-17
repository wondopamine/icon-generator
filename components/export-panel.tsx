'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Copy, Code2 } from 'lucide-react'
import { loadIconShapes } from '@/lib/icon-loader'
import { transformIcon, type Preset } from '@/lib/transform'

interface ExportPanelProps {
  iconId: string
  preset: Preset
  roughnessMultiplier?: number
  titleText?: string
}

function pascalCase(id: string): string {
  return id
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

async function buildSvg(
  iconId: string,
  preset: Preset,
  roughnessMultiplier: number,
  titleText: string | undefined,
): Promise<string | null> {
  const shapes = await loadIconShapes(iconId)
  if (!shapes) return null
  return transformIcon({ iconId, shapes, preset, roughnessMultiplier, titleText })
}

export function ExportPanel({
  iconId,
  preset,
  roughnessMultiplier = 1,
  titleText,
}: ExportPanelProps) {
  const [busy, setBusy] = useState<null | 'svg' | 'raw' | 'jsx'>(null)
  const trimmedTitle = titleText?.trim() || undefined

  const downloadSvg = async () => {
    setBusy('svg')
    try {
      const svg = await buildSvg(iconId, preset, roughnessMultiplier, trimmedTitle)
      if (!svg) throw new Error('Failed to build SVG')
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${iconId}-${preset}.svg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${iconId}-${preset}.svg`)
    } catch (err) {
      toast.error('Download failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(null)
    }
  }

  const copyRaw = async () => {
    setBusy('raw')
    try {
      const svg = await buildSvg(iconId, preset, roughnessMultiplier, trimmedTitle)
      if (!svg) throw new Error('Failed to build SVG')
      await navigator.clipboard.writeText(svg)
      toast.success('Copied raw SVG to clipboard')
    } catch (err) {
      toast.error('Copy failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(null)
    }
  }

  const copyJsx = async () => {
    setBusy('jsx')
    try {
      const svg = await buildSvg(iconId, preset, roughnessMultiplier, trimmedTitle)
      if (!svg) throw new Error('Failed to build SVG')
      const componentName = pascalCase(iconId) + 'Icon'
      const res = await fetch('/api/export/jsx', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ svg, componentName }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = (await res.json()) as { jsx: string }
      await navigator.clipboard.writeText(data.jsx)
      toast.success(`Copied <${componentName} /> to clipboard`)
    } catch (err) {
      toast.error('JSX export failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={downloadSvg} disabled={!!busy} variant="default">
        <Download className="size-4" />
        Download SVG
      </Button>
      <Button onClick={copyJsx} disabled={!!busy} variant="outline">
        <Code2 className="size-4" />
        Copy as JSX (React)
      </Button>
      <Button onClick={copyRaw} disabled={!!busy} variant="outline">
        <Copy className="size-4" />
        Copy raw SVG
      </Button>
    </div>
  )
}
