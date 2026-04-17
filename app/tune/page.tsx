import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TuneWorkbench } from '@/components/tune-workbench'

export default function TunePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between border-b px-8 py-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tune</h1>
          <p className="text-sm text-muted-foreground">
            Live parameter workbench. Drop a craft.do SVG to compare side by side.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to grid
        </Link>
      </header>
      <main className="flex-1 p-8">
        <Suspense fallback={<WorkbenchSkeleton />}>
          <TuneWorkbench />
        </Suspense>
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
