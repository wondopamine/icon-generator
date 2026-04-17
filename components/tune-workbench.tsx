'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { loadIconShapes } from '@/lib/icon-loader'
import {
  PRESETS,
  transformIconWithConfig,
  type IconShape,
  type Preset,
  type PresetConfig,
  type RenderMode,
} from '@/lib/transform'
import { cn } from '@/lib/utils'

const PICK_ICONS = [
  'pencil',
  'calendar',
  'check',
  'heart',
  'star',
  'zap',
  'home',
  'mail',
  'search',
  'users',
  'file-text',
  'image',
  'music',
  'video',
  'shopping-cart',
  'settings',
  'bell',
  'tag',
  'bookmark',
  'coffee',
] as const

const STORAGE_KEY = 'icon-generator:tune:v2'
const REF_KEY = 'icon-generator:tune:reference:v1'

interface StoredState {
  iconId: string
  config: PresetConfig
  seedOffset: number
}

function loadInitial(): StoredState {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState
        if (parsed?.config && parsed.iconId) return parsed
      }
    } catch {}
  }
  return {
    iconId: 'pencil',
    config: { ...PRESETS.ink, label: 'Custom' },
    seedOffset: 0,
  }
}

function loadReferenceInitial(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REF_KEY)
  } catch {
    return null
  }
}

const VALID_PRESETS: ReadonlySet<Preset> = new Set([
  'ink',
  'pencil',
  'marker',
  'charcoal',
  'sketchy',
])

function isValidPreset(v: string | null): v is Preset {
  return !!v && VALID_PRESETS.has(v as Preset)
}

export function TuneWorkbench() {
  const searchParams = useSearchParams()
  const urlIcon = searchParams.get('icon')
  const urlPreset = searchParams.get('preset')

  const [state, setState] = useState<StoredState>(() => {
    const base = loadInitial()
    const next = { ...base }
    if (urlIcon && urlIcon.trim()) next.iconId = urlIcon.trim()
    if (isValidPreset(urlPreset)) {
      next.config = { ...PRESETS[urlPreset], label: 'Custom' }
    }
    return next
  })
  const [shapes, setShapes] = useState<IconShape[] | null>(null)

  // Sync from URL on subsequent navigations (e.g. /tune?icon=A → /tune?icon=B
  // without remount). Written as a derived-from-props update during render,
  // not inside a useEffect, to avoid cascading renders.
  const [trackedUrl, setTrackedUrl] = useState({
    icon: urlIcon,
    preset: urlPreset,
  })
  if (trackedUrl.icon !== urlIcon || trackedUrl.preset !== urlPreset) {
    setTrackedUrl({ icon: urlIcon, preset: urlPreset })
    if (urlIcon && urlIcon.trim() && urlIcon !== state.iconId) {
      setState((s) => ({ ...s, iconId: urlIcon.trim() }))
    }
    if (isValidPreset(urlPreset)) {
      setState((s) => ({
        ...s,
        config: { ...PRESETS[urlPreset], label: 'Custom' },
      }))
    }
  }

  // Reset shapes to null when iconId changes. This runs during render (not in
  // useEffect) so it doesn't trigger the set-state-in-effect lint.
  const [trackedIconId, setTrackedIconId] = useState(state.iconId)
  if (trackedIconId !== state.iconId) {
    setTrackedIconId(state.iconId)
    setShapes(null)
  }
  const [referenceSvg, setReferenceSvg] = useState<string | null>(
    loadReferenceInitial,
  )
  const refFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  useEffect(() => {
    let cancelled = false
    loadIconShapes(state.iconId).then((s) => {
      if (!cancelled) setShapes(s)
    })
    return () => {
      cancelled = true
    }
  }, [state.iconId])

  const svg = useMemo(() => {
    if (!shapes) return null
    return transformIconWithConfig({
      iconId: state.iconId,
      shapes,
      config: state.config,
      seedOffset: state.seedOffset,
    })
  }, [shapes, state])

  const updateConfig = useCallback((patch: Partial<PresetConfig>) => {
    setState((s) => ({ ...s, config: { ...s.config, ...patch } }))
  }, [])

  const loadPreset = useCallback((name: Preset) => {
    setState((s) => ({ ...s, config: { ...PRESETS[name], label: 'Custom' } }))
  }, [])

  const setMode = useCallback(
    (mode: RenderMode) => {
      if (state.config.mode === mode) return
      // When switching modes, fill in sensible defaults for the other side
      if (mode === 'filter') {
        updateConfig({
          mode: 'filter',
          baseFrequency: state.config.baseFrequency ?? 0.85,
          numOctaves: state.config.numOctaves ?? 2,
          displacementScale: state.config.displacementScale ?? 0.35,
        })
      } else {
        updateConfig({
          mode: 'rough',
          roughness: state.config.roughness ?? 1.0,
          bowing: state.config.bowing ?? 1.2,
          disableMultiStroke: state.config.disableMultiStroke ?? false,
        })
      }
    },
    [state.config, updateConfig],
  )

  const nudgeSeed = useCallback(() => {
    setState((s) => ({ ...s, seedOffset: s.seedOffset + 1 }))
  }, [])

  const copyConfig = useCallback(() => {
    const { label, ...keep } = state.config
    void label
    const snippet = Object.entries(keep)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
      .join('\n')
    const full = `{\n${snippet}\n}`
    navigator.clipboard.writeText(full).then(
      () => toast.success('Config copied — paste into stroke-renderer.ts'),
      () => toast.error('Copy failed'),
    )
  }, [state.config])

  const handleRefFile = useCallback((file: File) => {
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      toast.error('Reference must be an SVG file')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      if (!text.includes('<svg')) {
        toast.error('Not a valid SVG')
        return
      }
      setReferenceSvg(text)
      try {
        localStorage.setItem(REF_KEY, text)
      } catch {}
      toast.success('Reference loaded')
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleRefFile(file)
    },
    [handleRefFile],
  )

  const clearReference = useCallback(() => {
    setReferenceSvg(null)
    try {
      localStorage.removeItem(REF_KEY)
    } catch {}
  }, [])

  const mode = state.config.mode

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_280px]">
      {/* LEFT: controls */}
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight">Parameters</h2>
          <p className="text-sm text-muted-foreground">
            Live-update. Saved to localStorage.
          </p>
        </header>

        <section className="flex flex-col gap-2.5">
          <FieldLabel>Start from</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => loadPreset('ink')}>
              Ink
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadPreset('pencil')}>
              Pencil
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPreset('sketchy')}
            >
              Sketchy
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <FieldLabel>Render mode</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={mode === 'filter'}
              onClick={() => setMode('filter')}
              title="Filter"
              desc="Clean shape, organic edge (Craft-like)"
            />
            <ModeButton
              active={mode === 'rough'}
              onClick={() => setMode('rough')}
              title="Rough"
              desc="Distorted shape (wobbly)"
            />
          </div>
        </section>

        <SliderRow
          label="Stroke width"
          value={state.config.strokeWidth}
          min={0.4}
          max={3.5}
          step={0.05}
          onChange={(v) => updateConfig({ strokeWidth: v })}
        />

        {mode === 'filter' && (
          <>
            <SliderRow
              label="Edge texture grain"
              value={state.config.baseFrequency ?? 0.85}
              min={0.1}
              max={3}
              step={0.05}
              onChange={(v) => updateConfig({ baseFrequency: v })}
              hint="Higher = finer grain"
            />
            <SliderRow
              label="Edge wobble"
              value={state.config.displacementScale ?? 0.35}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => updateConfig({ displacementScale: v })}
              hint="0 = perfectly clean, 1+ = very organic"
            />
            <SliderRow
              label="Texture complexity"
              value={state.config.numOctaves ?? 2}
              min={1}
              max={5}
              step={1}
              onChange={(v) => updateConfig({ numOctaves: Math.round(v) })}
            />
          </>
        )}

        {mode === 'rough' && (
          <>
            <SliderRow
              label="Roughness"
              value={state.config.roughness ?? 1.0}
              min={0}
              max={4}
              step={0.05}
              onChange={(v) => updateConfig({ roughness: v })}
            />
            <SliderRow
              label="Bowing"
              value={state.config.bowing ?? 1.0}
              min={0}
              max={4}
              step={0.05}
              onChange={(v) => updateConfig({ bowing: v })}
            />
            <section className="flex items-center justify-between pt-1">
              <FieldLabel as="span">Multi-stroke overlay</FieldLabel>
              <input
                type="checkbox"
                checked={!(state.config.disableMultiStroke ?? false)}
                onChange={(e) =>
                  updateConfig({ disableMultiStroke: !e.target.checked })
                }
                className="size-4 accent-primary"
              />
            </section>
          </>
        )}

        <section className="flex flex-col gap-2.5">
          <FieldLabel>Stroke color</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.config.color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border"
              aria-label="Pick stroke color"
            />
            <Input
              value={state.config.color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t pt-5">
          <Button variant="outline" size="sm" onClick={nudgeSeed}>
            Re-roll seed ({state.seedOffset})
          </Button>
          <Button variant="default" size="sm" onClick={copyConfig}>
            Copy config
          </Button>
        </section>
      </div>

      {/* CENTER: preview */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold tracking-tight">
                Preview —{' '}
                <span className="font-mono text-muted-foreground">
                  {state.iconId}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                24 px (actual use), 80 px (card), 240 px (detail).
              </p>
            </div>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {mode}
            </span>
          </header>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-8 py-6">
            <SvgBox svg={svg} size={24} label="24" />
            <SvgBox svg={svg} size={80} label="80" />
            <SvgBox svg={svg} size={240} label="240" />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold tracking-tight">Test icons</h2>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-10">
            {PICK_ICONS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setState((s) => ({ ...s, iconId: id }))}
                className={cn(
                  'rounded-md border p-2 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  state.iconId === id
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                title={id}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="mt-1">
            <Input
              placeholder="or type any Lucide id and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.currentTarget.value || '').trim()
                  if (v) setState((s) => ({ ...s, iconId: v }))
                }
              }}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: reference */}
      <div
        className="flex flex-col gap-4 rounded-xl border bg-card p-6"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight">Reference</h2>
          <p className="text-sm text-muted-foreground">
            Drop a craft.do SVG here. Persists in localStorage.
          </p>
        </header>
        {referenceSvg ? (
          <>
            <div className="flex flex-col items-center gap-4">
              <SvgBox svg={referenceSvg} size={80} label="80" />
              <SvgBox svg={referenceSvg} size={240} label="240" />
            </div>
            <Button variant="ghost" size="sm" onClick={clearReference}>
              Clear reference
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => refFileInputRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Click or drop an .svg file
          </button>
        )}
        <input
          ref={refFileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleRefFile(f)
            e.currentTarget.value = ''
          }}
        />
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:bg-accent',
      )}
    >
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {desc}
      </span>
    </button>
  )
}

function FieldLabel({
  children,
  as = 'label',
}: {
  children: React.ReactNode
  as?: 'label' | 'span'
}) {
  const Tag = as
  return (
    <Tag className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </Tag>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="font-mono text-sm tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => {
          const n = Array.isArray(v) ? v[0] : (v as number)
          if (typeof n === 'number' && !Number.isNaN(n)) onChange(n)
        }}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </section>
  )
}

function SvgBox({
  svg,
  size,
  label,
}: {
  svg: string | null
  size: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center justify-center rounded-lg border bg-background"
        style={{
          width: size + 24,
          height: size + 24,
        }}
      >
        {svg ? (
          <span
            style={{ width: size, height: size, display: 'inline-block' }}
            dangerouslySetInnerHTML={{ __html: resize(svg, size) }}
          />
        ) : (
          <span className="size-4 animate-pulse rounded bg-muted" />
        )}
      </div>
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function resize(markup: string, size: number): string {
  return markup.replace(
    /<svg([^>]*?)\swidth="[^"]*"([^>]*?)\sheight="[^"]*"([^>]*?)>/,
    `<svg$1 width="${size}"$2 height="${size}"$3>`,
  )
}
