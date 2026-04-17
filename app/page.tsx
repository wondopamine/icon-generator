import Link from 'next/link'
import { IconGrid } from '@/components/icon-grid'
import { IconDetail } from '@/components/icon-detail'

export default function Home() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Icon Generator</h1>
          <p className="text-xs text-muted-foreground">
            Hand-drawn, craft-style icons for marketing pages
          </p>
        </div>
        <Link
          href="/tune"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Tune →
        </Link>
      </header>
      <main className="flex flex-1 min-h-0">
        <IconGrid />
      </main>
      <IconDetail />
    </div>
  )
}
