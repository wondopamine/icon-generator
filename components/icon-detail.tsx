'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIconStore } from '@/lib/store'
import { TransformedIcon } from '@/components/transformed-icon'
import { StylePicker } from '@/components/style-picker'
import { ExportPanel } from '@/components/export-panel'

export function IconDetail() {
  const selectedIcon = useIconStore((s) => s.selectedIcon)
  const selectIcon = useIconStore((s) => s.selectIcon)
  const preset = useIconStore((s) => s.preset)
  const setPreset = useIconStore((s) => s.setPreset)

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
            Pick a style, preview, then export.
          </SheetDescription>
        </SheetHeader>

        {selectedIcon && (
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
            <div className="flex items-center justify-center rounded-lg border bg-card py-10">
              <TransformedIcon
                iconId={selectedIcon}
                preset={preset}
                size={120}
              />
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Style
              </h3>
              <StylePicker value={preset} onChange={setPreset} />
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Export
              </h3>
              <ExportPanel iconId={selectedIcon} preset={preset} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
