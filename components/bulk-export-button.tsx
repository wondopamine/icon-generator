'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIconStore } from '@/lib/store'
import { buildLucideZip, lucideIconCount } from '@/lib/bulk-export'

export function BulkExportButton() {
  const preset = useIconStore((s) => s.preset)
  const source = useIconStore((s) => s.source)
  const roughnessByIcon = useIconStore((s) => s.roughnessByIcon)
  const [busy, setBusy] = useState(false)

  const isLucide = source === 'lucide'
  const disabled = busy || !isLucide
  const total = lucideIconCount()

  async function onClick() {
    if (disabled) return
    setBusy(true)
    const toastId = toast.loading(`Exporting 0 / ${total.toLocaleString()}…`)
    try {
      const blob = await buildLucideZip({
        preset,
        roughnessByIcon,
        onProgress: (done, t) => {
          toast.loading(
            `Exporting ${done.toLocaleString()} / ${t.toLocaleString()}…`,
            { id: toastId },
          )
        },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = `icons-lucide-${preset}.zip`
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${filename}`, { id: toastId })
    } catch (err) {
      toast.error('Export failed', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        !isLucide
          ? 'Switch to Lucide to bulk export'
          : `Download all ${total.toLocaleString()} icons as a ZIP`
      }
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      <span className="hidden sm:inline">
        {busy ? 'Exporting…' : 'Export all'}
      </span>
      <span className="sm:hidden">{busy ? '…' : 'Export'}</span>
    </button>
  )
}
