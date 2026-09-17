import { Inbox, SearchX } from "lucide-react";

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
          <div className="mt-4 h-2 w-full rounded bg-slate-200" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
            <div className="h-6 w-16 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, onReset, action }: { title: string; hint: string; onReset?: () => void; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Inbox size={22} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {action.label}
        </button>
      )}
      {onReset && (
        <button onClick={onReset} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Clear filters
        </button>
      )}
    </div>
  );
}

export function NoSearchResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <SearchX className="text-slate-400" size={28} />
      <h3 className="mt-3 font-semibold text-slate-900">No matches found</h3>
      <p className="mt-1 text-sm text-slate-500">Try a different keyword or reset filters.</p>
      <button onClick={onReset} className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
        Reset search
      </button>
    </div>
  );
}
