import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { IconGrid } from '@/components/icon-grid'
import { IconDetail } from '@/components/icon-detail'
import { BulkExportButton } from '@/components/bulk-export-button'

export default function Home() {
  return (
    <div
      className="flex h-dvh w-full flex-col bg-background"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <header className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            Icon Generator
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Hand-drawn, craft-style icons for marketing pages.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BulkExportButton />
          <Link
            href="/tune"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            Tune
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>
      <main className="flex min-h-0 flex-1">
        <IconGrid />
      </main>
      <AttributionFooter />
      <IconDetail />
    </div>
  )
}

function AttributionFooter() {
  return (
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
      . This tool is MIT licensed — see{' '}
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
  )
}
