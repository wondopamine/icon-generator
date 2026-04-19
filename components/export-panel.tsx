'use client'

import { useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Copy, Code2, Share2 } from 'lucide-react'
import { buildSvg } from '@/lib/build-svg'
import { rasterizeSvg } from '@/lib/rasterize-svg'
import type { Preset } from '@/lib/transform'

const noop = () => () => {}

function readCanShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  const probe = new File(['<svg/>'], 'probe.svg', { type: 'image/svg+xml' })
  return navigator.canShare({ files: [probe] })
}

function useCanShareFiles(): boolean {
  return useSyncExternalStore(noop, readCanShareFiles, () => false)
}

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

export function ExportPanel({
  iconId,
  preset,
  roughnessMultiplier = 1,
  titleText,
}: ExportPanelProps) {
  const [busy, setBusy] = useState<null | 'svg' | 'raw' | 'jsx' | 'share'>(null)
  const canShareFiles = useCanShareFiles()
  const trimmedTitle = titleText?.trim() || undefined

  // Single-icon exports rasterize the in-browser render (filter included) so
  // the output matches the app preview pixel-for-pixel in viewers that don't
  // execute SVG filters (Figma, Finder Quick Look, email).
  const buildExport = async () => {
    const svg = await buildSvg(iconId, preset, roughnessMultiplier, trimmedTitle)
    if (!svg) throw new Error('Failed to build SVG')
    return rasterizeSvg(svg, { titleText: trimmedTitle })
  }

  const shareSvg = async () => {
    setBusy('share')
    try {
      const svg = await buildExport()
      const file = new File([svg], `${iconId}-${preset}.svg`, {
        type: 'image/svg+xml',
      })
      await navigator.share({
        files: [file],
        title: trimmedTitle ?? iconId,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('Share failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(null)
    }
  }

  const downloadSvg = async () => {
    setBusy('svg')
    try {
      const svg = await buildExport()
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
      const svg = await buildExport()
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
      const svg = await buildExport()
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
      {canShareFiles && (
        <Button onClick={shareSvg} disabled={!!busy} variant="default">
          <Share2 className="size-4" />
          Share SVG
        </Button>
      )}
      <Button
        onClick={downloadSvg}
        disabled={!!busy}
        variant={canShareFiles ? 'outline' : 'default'}
      >
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
