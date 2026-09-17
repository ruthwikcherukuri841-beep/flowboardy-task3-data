import { Check, RotateCcw, X } from "lucide-react";
import { accents, type AccentKey, type Density } from "../theme";

export type LegalKind = "terms" | "privacy" | "cookies" | "about" | "status" | null;

export function SettingsModal({
  accent, onAccent, density, onDensity, showCompleted, onShowCompleted, onReset, onClose,
}: {
  accent: AccentKey; onAccent: (a: AccentKey) => void;
  density: Density; onDensity: (d: Density) => void;
  showCompleted: boolean; onShowCompleted: (v: boolean) => void;
  onReset: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Display settings">
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-base font-bold text-slate-900">Display & preferences</h2><p className="text-[13px] text-slate-500">Saved automatically to your FlowBoard account.</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Accent color</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(accents) as AccentKey[]).map((k) => (
            <button key={k} onClick={() => onAccent(k)} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[13px] font-medium ${accent === k ? "border-slate-900 bg-slate-50 text-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <span className="h-4 w-4 rounded-full" style={{ background: accents[k].swatch }} />
              {accents[k].label}
              {accent === k && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Density</p>
        <div className="grid grid-cols-2 gap-2">
          {(["comfortable", "compact"] as Density[]).map((d) => (
            <button key={d} onClick={() => onDensity(d)} className={`rounded-xl border px-3 py-2 text-[13px] font-semibold capitalize ${density === d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{d}</button>
          ))}
        </div>

        <button onClick={() => onShowCompleted(!showCompleted)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-left hover:bg-slate-50">
          <span><span className="block text-[13px] font-semibold text-slate-800">Show completed tasks</span><span className="block text-xs text-slate-500">Hide done items to focus on active work.</span></span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${showCompleted ? "bg-emerald-500" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${showCompleted ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>

        <div className="mt-4 flex justify-between">
          <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw size={14} /> Reset to defaults</button>
          <button onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">Done</button>
        </div>
      </div>
    </div>
  );
}

export function Footer({
  onNav, onLegal, onShortcuts, onSettings, onNewProject,
}: {
  onNav: (v: "dashboard" | "projects" | "tasks" | "profile") => void;
  onLegal: (k: Exclude<LegalKind, null>) => void;
  onShortcuts: () => void;
  onSettings: () => void;
  onNewProject: () => void;
}) {
  return (
    <footer className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-extrabold text-white">F</span>
            <span className="text-sm font-bold text-slate-900">FlowBoard</span>
          </div>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-slate-500">Project and task tracking for software teams. Focus. Track. Ship.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems operational
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Product</p>
          <ul className="mt-2 space-y-1 text-[13px]">
            <li><button onClick={() => onNav("dashboard")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Overview</button></li>
            <li><button onClick={() => onNav("projects")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Projects</button></li>
            <li><button onClick={() => onNav("tasks")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Tasks</button></li>
            <li><button onClick={() => onNav("profile")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Profile</button></li>
            <li><button onClick={onNewProject} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">New project</button></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Resources</p>
          <ul className="mt-2 space-y-1 text-[13px]">
            <li><button onClick={onShortcuts} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Keyboard shortcuts</button></li>
            <li><button onClick={onSettings} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Display settings</button></li>
            <li><button onClick={() => onLegal("about")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">About</button></li>
            <li><button onClick={() => onLegal("status")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Status</button></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="inline-block rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">GitHub repository</a></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Legal</p>
          <ul className="mt-2 space-y-1 text-[13px]">
            <li><button onClick={() => onLegal("terms")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Terms of Service</button></li>
            <li><button onClick={() => onLegal("privacy")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Privacy Policy</button></li>
            <li><button onClick={() => onLegal("cookies")} className="rounded px-1 py-0.5 font-medium text-slate-600 hover:text-slate-900">Cookie Notice</button></li>
          </ul>
        </nav>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 sm:px-6">
        <span>© 2026 FlowBoard · v0.2.0 · Crafted for focused teams</span>
        <span>Hosted · your data is saved to FlowBoard</span>
      </div>
    </footer>
  );
}
