'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'
import { ICONS, type IconMeta } from '@/lib/icons'
import { GOLDEN_ICONS, type GoldenIconMeta } from '@/lib/golden'
import { useIconStore, type IconSource } from '@/lib/store'
import { IconCard } from '@/components/icon-card'

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

      <ScrollArea className="flex-1">
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
        ) : source === 'lucide' ? (
          <div className="grid grid-cols-3 gap-3 p-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {(filtered as IconMeta[]).map((icon) => (
              <IconCard
                key={icon.id}
                id={icon.id}
                preset={preset}
                selected={selectedIcon === icon.id}
                onSelect={selectIcon}
              />
            ))}
          </div>
        ) : null}
      </ScrollArea>
    </div>
  )
}
