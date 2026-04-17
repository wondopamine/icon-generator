'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { useIconStore } from '@/lib/store'
import { TransformedIcon } from '@/components/transformed-icon'
import { StylePicker } from '@/components/style-picker'
import { ExportPanel } from '@/components/export-panel'

export function IconDetail() {
  const selectedIcon = useIconStore((s) => s.selectedIcon)
  const selectIcon = useIconStore((s) => s.selectIcon)
  const preset = useIconStore((s) => s.preset)
  const setPreset = useIconStore((s) => s.setPreset)
  const roughnessByIcon = useIconStore((s) => s.roughnessByIcon)
  const setRoughness = useIconStore((s) => s.setRoughness)
  const titleByIcon = useIconStore((s) => s.titleByIcon)
  const setTitle = useIconStore((s) => s.setTitle)

  const roughness = selectedIcon ? (roughnessByIcon[selectedIcon] ?? 1) : 1
  const title = selectedIcon ? (titleByIcon[selectedIcon] ?? '') : ''

  return (
    <Sheet
      open={!!selectedIcon}
      onOpenChange={(open) => {
        if (!open) selectIcon(null)
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-6 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="font-mono text-sm">{selectedIcon}</SheetTitle>
          <SheetDescription>
            Pick a style, tune the feel, then export.
          </SheetDescription>
        </SheetHeader>

        {selectedIcon && (
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
            <div className="flex items-center justify-center rounded-lg border bg-card py-10">
              <TransformedIcon
                iconId={selectedIcon}
                preset={preset}
                size={120}
                roughnessMultiplier={roughness}
              />
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Style
              </h3>
              <StylePicker value={preset} onChange={setPreset} />
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="roughness-slider"
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Roughness
                </label>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {roughness.toFixed(2)}×
                </span>
              </div>
              <Slider
                id="roughness-slider"
                value={[roughness]}
                min={0}
                max={2}
                step={0.05}
                onValueChange={(v) => {
                  const n = Array.isArray(v) ? v[0] : (v as number)
                  if (typeof n === 'number' && !Number.isNaN(n)) {
                    setRoughness(selectedIcon, n)
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                Scales the preset&apos;s wobble. 1.00× = default, 0 = clean.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <label
                htmlFor="a11y-title"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Accessible label
              </label>
              <Input
                id="a11y-title"
                placeholder="e.g. Open folder"
                value={title}
                onChange={(e) => setTitle(selectedIcon, e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Embeds a &lt;title&gt; in exported SVG / JSX for screen readers. Leave blank to omit.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Export
              </h3>
              <ExportPanel
                iconId={selectedIcon}
                preset={preset}
                roughnessMultiplier={roughness}
                titleText={title}
              />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
