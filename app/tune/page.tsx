import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TuneWorkbench } from '@/components/tune-workbench'

export default function TunePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Tune</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Live parameter workbench for hand-drawn icon styles.
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
        <div className="h-full p-4 sm:p-8">
          <Suspense fallback={<WorkbenchSkeleton />}>
            <TuneWorkbench />
          </Suspense>
        </div>
      </main>
      <footer className="border-t px-6 py-3 text-xs text-muted-foreground sm:px-8">
        Icons derived from{' '}
        <a
          href="https://lucide.dev"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Lucide
        </a>{' '}
        (ISC). Rendered with{' '}
        <a
          href="https://roughjs.com"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          rough.js
        </a>
        . MIT licensed — see{' '}
        <a
          href="https://github.com/wondopamine/icon-generator/blob/main/NOTICE.md"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          NOTICE
        </a>{' '}
        before redistributing exports.
      </footer>
    </div>
  )
}

function WorkbenchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr]">
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
      <div className="h-96 animate-pulse rounded-xl border bg-card" />
    </div>
  )
}
