export function ProgressBar({ value, tone = "indigo" }: { value: number; tone?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${colors[tone] ?? colors.indigo}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">{value}%</span>
    </div>
  );
}
