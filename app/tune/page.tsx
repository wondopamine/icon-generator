import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Monitor } from 'lucide-react'
import { TuneWorkbench } from '@/components/tune-workbench'

export default function TunePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Tune</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Live parameter workbench. Drop a craft.do SVG to compare side by side.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to grid</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </header>
      <main className="flex-1">
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center lg:hidden">
          <Monitor className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-foreground">
              Open on desktop to tune
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The workbench has a lot of sliders and a reference-SVG slot — it&apos;s
              cramped on a phone. Switch to a wider screen, or use the grid&apos;s
              detail sheet for the basics (style + roughness + export).
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
            Back to grid
          </Link>
        </div>
        <div className="hidden h-full p-8 lg:block">
          <Suspense fallback={<WorkbenchSkeleton />}>
            <TuneWorkbench />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

function WorkbenchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_280px]">
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
    </div>
  )
}
