'use client'

import { PRESETS, type Preset } from '@/lib/transform'
import { cn } from '@/lib/utils'

interface StylePickerProps {
  value: Preset
  onChange: (preset: Preset) => void
}

const ORDER: Preset[] = ['ink', 'pencil', 'marker', 'charcoal', 'sketchy']
const DESCRIPTIONS: Record<Preset, string> = {
  ink: 'Clean shape, organic edge',
  pencil: 'Soft gray, more texture',
  marker: 'Bold navy, broad stroke',
  charcoal: 'Jagged, dusty texture',
  sketchy: 'Wobbly hand-sketch',
}

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Style preset"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {ORDER.map((p) => {
        const cfg = PRESETS[p]
        const active = value === p
        return (
          <button
            key={p}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            <span className="text-sm font-semibold text-foreground">
              {cfg.label}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {DESCRIPTIONS[p]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
