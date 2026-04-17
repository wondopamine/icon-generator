import Link from 'next/link'
import { TuneWorkbench } from '@/components/tune-workbench'

export default function TunePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tune</h1>
          <p className="text-xs text-muted-foreground">
            Live parameter workbench. Drop a craft.do SVG to compare side by side.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to grid
        </Link>
      </header>
      <main className="flex-1 p-6">
        <TuneWorkbench />
      </main>
    </div>
  )
}
