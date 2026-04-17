'use client'

import { memo } from 'react'
import { TransformedIcon } from '@/components/transformed-icon'
import type { Preset } from '@/lib/transform'
import { cn } from '@/lib/utils'

interface IconCardProps {
  id: string
  preset: Preset
  selected: boolean
  onSelect: (id: string) => void
}

function IconCardImpl({ id, preset, selected, onSelect }: IconCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        'group flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'border-primary ring-2 ring-primary',
      )}
      aria-label={id}
      title={id}
    >
      <TransformedIcon iconId={id} preset={preset} size={32} />
      <span className="w-full truncate font-mono text-xs text-muted-foreground group-hover:text-foreground">
        {id}
      </span>
    </button>
  )
}

export const IconCard = memo(IconCardImpl)
