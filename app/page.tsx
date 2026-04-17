import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { IconGrid } from '@/components/icon-grid'
import { IconDetail } from '@/components/icon-detail'

export default function Home() {
  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between border-b px-8 py-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Icon Generator</h1>
          <p className="text-sm text-muted-foreground">
            Hand-drawn, craft-style icons for marketing pages.
          </p>
        </div>
        <Link
          href="/tune"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          Tune
          <ArrowUpRight className="size-4" />
        </Link>
      </header>
      <main className="flex min-h-0 flex-1">
        <IconGrid />
      </main>
      <IconDetail />
    </div>
  )
}
