import { Bell } from "lucide-react";
import type { AppNotification } from "../data/activity";

const dot: Record<AppNotification["kind"], string> = {
  overdue: "bg-rose-500",
  "due-soon": "bg-amber-500",
  assigned: "bg-indigo-500",
  completed: "bg-emerald-500",
  progress: "bg-blue-500",
};

export function NotificationsPanel({
  open,
  tab,
  onTab,
  items,
  onOpenTask,
  onMarkRead,
  onMarkAll,
  onClear,
  onClose,
}: {
  open: boolean;
  tab: "all" | "unread";
  onTab: (t: "all" | "unread") => void;
  items: AppNotification[];
  onOpenTask: (taskId: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const visible = tab === "all" ? items : items.filter((n) => !n.read);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="fade absolute right-0 top-11 z-50 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl modal-rise" role="dialog" aria-label="Notifications">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={onMarkAll} className="font-medium text-indigo-600 hover:text-indigo-800">Mark all read</button>
            <span className="text-slate-200">|</span>
            <button onClick={onClear} className="font-medium text-slate-500 hover:text-slate-800">Clear</button>
          </div>
        </div>
        <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
          {(["all", "unread"] as const).map((t) => (
            <button key={t} onClick={() => onTab(t)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tab === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {t}{t === "unread" ? ` (${items.filter((n) => !n.read).length})` : ""}
            </button>
          ))}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Bell size={18} /></span>
              <p className="mt-3 text-sm font-semibold text-slate-800">You're all caught up</p>
              <p className="mt-1 text-xs text-slate-500">New assignments, due dates and completions will show up here.</p>
            </div>
          ) : (
            visible.map((n) => (
              <div key={n.id} className={`flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50 ${n.read ? "" : "bg-indigo-50/40"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.kind]}`} />
                <button className="min-w-0 flex-1 text-left" onClick={() => { if (n.taskId) onOpenTask(n.taskId); }}>
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{n.title}</span>
                    {!n.read && <span className="rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">New</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-slate-600">{n.body}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{n.time}</span>
                </button>
                {!n.read && (
                  <button onClick={() => onMarkRead(n.id)} className="h-fit shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-white">Mark read</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
