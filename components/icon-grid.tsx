'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { ICONS, type IconMeta } from '@/lib/icons'
import { useIconStore } from '@/lib/store'
import { IconCard } from '@/components/icon-card'

function matchesSearch(icon: IconMeta, query: string): boolean {
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
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(
    () => ICONS.filter((i) => matchesSearch(i, search)),
    [search],
  )

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
      <div className="border-b p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={`Search ${ICONS.length.toLocaleString()} icons... (press /)`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-10"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            /
          </kbd>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? 'icon' : 'icons'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            No icons match &ldquo;{search}&rdquo;. Try a different keyword.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filtered.map((icon) => (
              <IconCard
                key={icon.id}
                id={icon.id}
                preset={preset}
                selected={selectedIcon === icon.id}
                onSelect={selectIcon}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
