import { Loader2, AlertTriangle, Inbox, DatabaseZap } from 'lucide-react'
import { cn } from '@/lib/cn'

export function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Loader2 className="w-7 h-7 text-amber-700 animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-800">Could not load orders</p>
        <p className="text-xs text-gray-500 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-lg text-xs font-semibold transition"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title = 'No orders yet',
  description = 'New orders you add will appear here.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className={cn('w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center')}>
        <Inbox className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 max-w-sm">{description}</p>
      </div>
    </div>
  )
}

export function SetupNotice() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
      <DatabaseZap className="w-5 h-5 text-amber-700 shrink-0" />
      <p>
        <strong>Database not configured.</strong> Add{' '}
        <code className="bg-amber-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
        and{' '}
        <code className="bg-amber-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
        to reach the live orders table.
      </p>
    </div>
  )
}