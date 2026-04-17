'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'
import { ICONS, type IconMeta } from '@/lib/icons'
import { GOLDEN_ICONS, type GoldenIconMeta } from '@/lib/golden'
import { useIconStore, type IconSource } from '@/lib/store'
import { IconCard } from '@/components/icon-card'

const GAP = 12
const GRID_PX = 24

// width breakpoint → column count. Matches the pre-virtualized Tailwind
// grid (grid-cols-3 sm:4 md:5 lg:6 xl:8) so the density is unchanged.
function colsForWidth(w: number): number {
  if (w >= 1280) return 8
  if (w >= 1024) return 6
  if (w >= 768) return 5
  if (w >= 640) return 4
  return 3
}

function matchesSearch(
  icon: { id: string; keywords: string[] },
  query: string,
): boolean {
  if (!query) return true
  const q = query.toLowerCase().trim()
  if (icon.id.includes(q)) return true
  return icon.keywords.some((k) => k.includes(q))
}

export function IconGrid() {
  const search = useIconStore((s) => s.search)
  const setSearch = useIconStore((s) => s.setSearch)
  const selectedIcon = useIconStore((s) => s.selectedIcon)
  const selectIcon = useIconStore((s) => s.selectIcon)
  const preset = useIconStore((s) => s.preset)
  const source = useIconStore((s) => s.source)
  const setSource = useIconStore((s) => s.setSource)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  const filteredLucide = useMemo<IconMeta[]>(
    () => ICONS.filter((i) => matchesSearch(i, search)),
    [search],
  )
  const filteredGolden = useMemo<GoldenIconMeta[]>(
    () => GOLDEN_ICONS.filter((i) => matchesSearch(i, search)),
    [search],
  )
  const filtered = source === 'golden' ? filteredGolden : filteredLucide
  const total = source === 'golden' ? GOLDEN_ICONS.length : ICONS.length

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const active = document.activeElement
      const isTyping =
        active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cols = width > 0 ? colsForWidth(width) : 3
  const cardSize = width > 0 ? (width - GRID_PX * 2 - GAP * (cols - 1)) / cols : 0
  const rowSize = cardSize + GAP
  const rowCount = Math.ceil(filtered.length / cols)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowSize,
    overscan: 4,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b px-6 py-5">
        <Tabs
          value={source}
          onValueChange={(v) => setSource(v as IconSource)}
        >
          <TabsList>
            <TabsTrigger value="lucide">
              Lucide
              <span className="ml-1.5 font-mono text-xs tabular-nums opacity-70">
                {ICONS.length.toLocaleString()}
              </span>
            </TabsTrigger>
            <TabsTrigger value="golden">
              Golden
              <span className="ml-1.5 font-mono text-xs tabular-nums opacity-70">
                {GOLDEN_ICONS.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={`Search ${total.toLocaleString()} icons...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 pr-12 text-sm"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            /
          </kbd>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{filtered.length.toLocaleString()}</span>{' '}
          {filtered.length === 1 ? 'icon' : 'icons'}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {source === 'golden' && GOLDEN_ICONS.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
            <p className="text-base font-semibold text-foreground">No golden icons yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Drop hand-illustrated 24×24 SVGs into{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">public/golden/</code>{' '}
              and register them in{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/golden.ts</code>.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-12 text-center text-sm text-muted-foreground">
            No icons match &ldquo;{search}&rdquo;. Try a different keyword.
          </div>
        ) : source === 'lucide' && cardSize > 0 ? (
          <div
            style={{ height: rowVirtualizer.getTotalSize() + GRID_PX * 2 }}
            className="relative px-6"
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowStart = virtualRow.index * cols
              const rowIcons = (filtered as IconMeta[]).slice(
                rowStart,
                rowStart + cols,
              )
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: GRID_PX,
                    left: GRID_PX,
                    right: GRID_PX,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: GAP,
                  }}
                >
                  {rowIcons.map((icon) => (
                    <IconCard
                      key={icon.id}
                      id={icon.id}
                      preset={preset}
                      selected={selectedIcon === icon.id}
                      onSelect={selectIcon}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
