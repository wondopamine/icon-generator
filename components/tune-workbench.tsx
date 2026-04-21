'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { loadIconShapes } from '@/lib/icon-loader'
import { buildLucideZipWithConfig, lucideIconCount } from '@/lib/bulk-export'
import { rasterizeSvg } from '@/lib/rasterize-svg'
import {
  PRESETS,
  transformIconWithConfig,
  type IconShape,
  type Preset,
  type PresetConfig,
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

interface StoredState {
  iconId: string
  config: PresetConfig
  seedOffset: number
}

function defaultState(): StoredState {
  return {
    iconId: 'pencil',
    config: { ...PRESETS.ink, label: 'Custom' },
    seedOffset: 0,
  }
}

function readStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed?.config || !parsed.iconId) return null
    return parsed
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

const noop = () => () => {}

function readCanShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  const probe = new File(['<svg/>'], 'probe.svg', { type: 'image/svg+xml' })
  return navigator.canShare({ files: [probe] })
}

function useCanShareFiles(): boolean {
  return useSyncExternalStore(noop, readCanShareFiles, () => false)
}

function pascalCase(id: string): string {
  return id
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

export function TuneWorkbench() {
  const searchParams = useSearchParams()
  const urlIcon = searchParams.get('icon')
  const urlPreset = searchParams.get('preset')

  // Initial state is SSR-safe — URL params + defaults only. localStorage is
  // read after hydration in a useEffect below, so server and client produce
  // identical HTML on first render.
  const [state, setState] = useState<StoredState>(() => {
    const next = defaultState()
    if (urlIcon && urlIcon.trim()) next.iconId = urlIcon.trim()
    if (isValidPreset(urlPreset)) {
      next.config = { ...PRESETS[urlPreset], label: 'Custom' }
    }
    return next
  })
  const [shapes, setShapes] = useState<IconShape[] | null>(null)
  const [exportingAll, setExportingAll] = useState(false)
  const [copying, setCopying] = useState<null | 'jsx' | 'raw' | 'share'>(null)
  const canShareFiles = useCanShareFiles()

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

  // Hydrate from localStorage after mount. URL params win if present;
  // otherwise the stored iconId/config/seed is restored. Runs once — subsequent
  // URL changes are picked up by the trackedUrl sync above.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (hydrated) return
    setHydrated(true)
    const stored = readStoredState()
    if (!stored) return
    setState((s) => ({
      iconId: urlIcon?.trim() || stored.iconId,
      config: isValidPreset(urlPreset) ? s.config : stored.config,
      seedOffset: stored.seedOffset ?? 0,
    }))
  }, [hydrated, urlIcon, urlPreset])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state, hydrated])

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

  // Single-icon exports rasterize filter-mode SVGs so they match the on-screen
  // preview pixel-for-pixel in tools that don't execute SVG filters (Figma,
  // Finder Quick Look, email). Rough-mode presets export as-is since they
  // carry their full character in path data already.
  const buildExportSvg = useCallback(async (): Promise<string | null> => {
    if (!svg) return null
    if (state.config.mode !== 'filter') return svg
    return rasterizeSvg(svg)
  }, [svg, state.config.mode])

  const updateConfig = useCallback((patch: Partial<PresetConfig>) => {
    setState((s) => ({ ...s, config: { ...s.config, ...patch } }))
  }, [])

  const loadPreset = useCallback((name: Preset) => {
    setState((s) => ({ ...s, config: { ...PRESETS[name], label: 'Custom' } }))
  }, [])

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

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [])

  const downloadSvg = useCallback(async () => {
    if (!svg || copying) return
    setCopying('raw')
    try {
      const out = await buildExportSvg()
      if (!out) return
      const blob = new Blob([out], { type: 'image/svg+xml' })
      const filename = `${state.iconId}-${state.config.mode}.svg`
      downloadBlob(blob, filename)
      toast.success(`Downloaded ${filename}`)
    } catch (err) {
      toast.error('Download failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setCopying(null)
    }
  }, [svg, copying, buildExportSvg, state.iconId, state.config.mode, downloadBlob])

  const copyRawSvg = useCallback(async () => {
    if (!svg || copying) return
    setCopying('raw')
    try {
      const out = await buildExportSvg()
      if (!out) return
      await navigator.clipboard.writeText(out)
      toast.success('Copied raw SVG to clipboard')
    } catch (err) {
      toast.error('Copy failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setCopying(null)
    }
  }, [svg, copying, buildExportSvg])

  const copyJsx = useCallback(async () => {
    if (!svg || copying) return
    setCopying('jsx')
    try {
      const out = await buildExportSvg()
      if (!out) return
      const componentName = pascalCase(state.iconId) + 'Icon'
      const res = await fetch('/api/export/jsx', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ svg: out, componentName }),
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
      setCopying(null)
    }
  }, [svg, copying, buildExportSvg, state.iconId])

  const shareSvg = useCallback(async () => {
    if (!svg || copying) return
    setCopying('share')
    try {
      const out = await buildExportSvg()
      if (!out) return
      const filename = `${state.iconId}-${state.config.mode}.svg`
      const file = new File([out], filename, { type: 'image/svg+xml' })
      await navigator.share({ files: [file], title: state.iconId })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('Share failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setCopying(null)
    }
  }, [svg, copying, buildExportSvg, state.iconId, state.config.mode])

  const exportAll = useCallback(async () => {
    if (exportingAll) return
    setExportingAll(true)
    const total = lucideIconCount()
    const toastId = toast.loading(`Exporting 0 / ${total.toLocaleString()}…`)
    try {
      const blob = await buildLucideZipWithConfig({
        config: state.config,
        seedOffset: state.seedOffset,
        onProgress: (done, t) => {
          toast.loading(
            `Exporting ${done.toLocaleString()} / ${t.toLocaleString()}…`,
            { id: toastId },
          )
        },
      })
      const filename = `icons-lucide-custom-${state.config.mode}.zip`
      downloadBlob(blob, filename)
      toast.success(`Downloaded ${filename}`, { id: toastId })
    } catch (err) {
      toast.error('Export failed', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setExportingAll(false)
    }
  }, [exportingAll, state.config, state.seedOffset, downloadBlob])

  const mode = state.config.mode

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const selectIcon = useCallback(
    (id: string) => setState((s) => ({ ...s, iconId: id })),
    [],
  )
  const submitSearch = useCallback(() => {
    const v = searchText.trim()
    if (!v) return
    selectIcon(v)
    setSearchText('')
    setSearchOpen(false)
  }, [searchText, selectIcon])

  const isPickedIcon = (PICK_ICONS as readonly string[]).includes(state.iconId)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr]">
      {/* LEFT column on desktop, appears below preview on mobile: configuration + exports */}
      <div className="order-2 flex flex-col gap-6 sm:order-1">
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6">
          <header className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight">
              Configuration
            </h2>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPreset('pencil')}
              >
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

          <SliderRow
            label="Stroke width"
            value={state.config.strokeWidth}
            min={0.4}
            max={3.5}
            step={0.05}
            onChange={(v) => updateConfig({ strokeWidth: v })}
            editable
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
                editable
              />
              <SliderRow
                label="Edge wobble"
                value={state.config.displacementScale ?? 0.35}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => updateConfig({ displacementScale: v })}
                hint="0 = perfectly clean, 1+ = very organic"
                editable
              />
              <SliderRow
                label="Texture complexity"
                value={state.config.numOctaves ?? 2}
                min={1}
                max={5}
                step={1}
                onChange={(v) => updateConfig({ numOctaves: Math.round(v) })}
                editable
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
                editable
              />
              <SliderRow
                label="Bowing"
                value={state.config.bowing ?? 1.0}
                min={0}
                max={4}
                step={0.05}
                onChange={(v) => updateConfig({ bowing: v })}
                editable
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
        </div>

        <div className="flex flex-col gap-2 rounded-xl border bg-card p-6">
          <header className="flex flex-col gap-1 pb-2">
            <h2 className="text-base font-semibold tracking-tight">
              Export options
            </h2>
            <p className="text-sm text-muted-foreground">
              Download or copy the current icon, or bulk-export the full set.
            </p>
          </header>
          {canShareFiles && (
            <Button
              variant="default"
              size="sm"
              onClick={shareSvg}
              disabled={!svg || !!copying}
            >
              Share SVG
            </Button>
          )}
          <Button
            variant={canShareFiles ? 'outline' : 'default'}
            size="sm"
            onClick={downloadSvg}
            disabled={!svg}
          >
            Download SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyJsx}
            disabled={!svg || !!copying}
          >
            {copying === 'jsx' ? 'Copying…' : 'Copy as JSX (React)'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyRawSvg}
            disabled={!svg || !!copying}
          >
            {copying === 'raw' ? 'Copying…' : 'Copy raw SVG'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAll}
            disabled={exportingAll}
            title={`Download all ${lucideIconCount().toLocaleString()} Lucide icons with the current config`}
          >
            {exportingAll
              ? 'Exporting…'
              : `Export all (${lucideIconCount().toLocaleString()})`}
          </Button>
          <Button variant="ghost" size="sm" onClick={nudgeSeed}>
            Re-roll seed ({state.seedOffset})
          </Button>
          <Button variant="ghost" size="sm" onClick={copyConfig}>
            Copy config
          </Button>
        </div>
      </div>

      {/* RIGHT column on desktop, first on mobile: preview */}
      <div className="order-1 sm:order-2">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="whitespace-nowrap text-base font-semibold tracking-tight">
                Preview —
              </h2>
              <select
                value={isPickedIcon ? state.iconId : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') selectIcon(e.target.value)
                }}
                className="min-w-0 rounded-md border bg-background px-2 py-1 font-mono text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Pick a test icon"
              >
                {!isPickedIcon && (
                  <option value="__custom__">{state.iconId}</option>
                )}
                {PICK_ICONS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  searchOpen
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'hover:bg-accent',
                )}
                aria-label={searchOpen ? 'Close search' : 'Search any Lucide icon'}
                aria-expanded={searchOpen}
              >
                <Search className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              24 px (actual use), 80 px (card), 240 px (detail).
            </p>
            {searchOpen && (
              <Input
                autoFocus
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Any Lucide icon id — e.g. alarm-clock-plus"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                onBlur={submitSearch}
                className="h-9 text-sm"
              />
            )}
          </header>
          <div className="flex flex-wrap items-center justify-around gap-x-6 gap-y-4 py-6 md:justify-start md:gap-8">
            <SvgBox svg={svg} size={24} label="24" />
            <SvgBox svg={svg} size={80} label="80" />
            <SvgBox svg={svg} size={240} label="240" />
          </div>
        </div>
      </div>
    </div>
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
  editable = false,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  hint?: string
  editable?: boolean
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        {editable ? (
          <NumberField
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
          />
        ) : (
          <span className="font-mono text-sm tabular-nums">
            {value.toFixed(2)}
          </span>
        )}
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

function NumberField({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const decimals = step >= 1 ? 0 : 2
  const format = (n: number) => n.toFixed(decimals)
  const [text, setText] = useState(() => format(value))
  const [trackedValue, setTrackedValue] = useState(value)
  if (trackedValue !== value) {
    setTrackedValue(value)
    setText(format(value))
  }
  const commit = () => {
    const n = parseFloat(text)
    if (Number.isNaN(n)) {
      setText(format(value))
      return
    }
    const clamped = Math.max(min, Math.min(max, n))
    if (clamped !== value) onChange(clamped)
    setText(format(clamped))
  }
  return (
    <input
      type="number"
      inputMode="decimal"
      value={text}
      min={min}
      max={max}
      step={step}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
      }}
      className="w-16 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
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
