import { Bell, Menu, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { NotificationsPanel } from "./NotificationsPanel";
import type { AppNotification } from "../data/activity";

export function Navbar({
  query, onQuery, onMenu, sidebarOpen, viewTitle,
  notifications, notifTab, onNotifTab, onOpenTask, onMarkRead, onMarkAll, onClearNotifs,
  notifOpen, onNotifToggle, onNotifClose,
  onNewTask, onNewProject, onShortcuts, onProfile, onSettings, onSignOut, profileName, profileRole, profileEmail, profileAvatar,
}: {
  query: string; onQuery: (v: string) => void; onMenu: () => void; sidebarOpen: boolean; viewTitle: string;
  notifications: AppNotification[]; notifTab: "all" | "unread"; onNotifTab: (t: "all" | "unread") => void;
  onOpenTask: (id: string) => void; onMarkRead: (id: string) => void; onMarkAll: () => void; onClearNotifs: () => void;
  notifOpen: boolean; onNotifToggle: () => void; onNotifClose: () => void;
  onNewTask: () => void; onNewProject: () => void; onShortcuts: () => void; onSignOut: () => void;
  onProfile: () => void; onSettings: () => void; profileName: string; profileRole: string; profileEmail: string; profileAvatar: string;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-5">
        <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Toggle menu">
          {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-extrabold text-white">F</span>
          <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:block">FlowBoard</span>
          <span className="hidden text-slate-300 sm:block">/</span>
          <span className="truncate text-sm font-medium text-slate-500">{viewTitle}</span>
        </div>

        <div className="mx-auto hidden w-full max-w-sm md:block">
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search projects, tasks…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-12 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white" aria-label="Search" />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-[11px] font-semibold text-slate-400">/</kbd>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <div className="relative">
            <button onClick={() => setCreateOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-700">
              <Plus size={15} /> <span className="hidden sm:inline">New</span>
            </button>
            {createOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} />
                <div className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  <button onClick={() => { setCreateOpen(false); onNewTask(); }} className="block w-full px-3.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">New task <span className="ml-1 text-[11px] text-slate-400">N</span></button>
                  <button onClick={() => { setCreateOpen(false); onNewProject(); }} className="block w-full px-3.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">New project <span className="ml-1 text-[11px] text-slate-400">P</span></button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button onClick={onNotifToggle} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications" aria-expanded={notifOpen}>
              <Bell size={18} />
              {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </button>
            <NotificationsPanel open={notifOpen} tab={notifTab} onTab={onNotifTab} items={notifications} onOpenTask={onOpenTask} onMarkRead={onMarkRead} onMarkAll={onMarkAll} onClear={onClearNotifs} onClose={onNotifClose} />
          </div>

          <div className="relative">
            <button onClick={() => setProfileOpen((v) => !v)} className="ml-0.5" aria-label="Account" aria-expanded={profileOpen}>
              <Avatar avatar={profileAvatar} name={profileName} className="h-8 w-8 text-[11px] hover:ring-2 hover:ring-slate-300" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[13px] font-semibold text-slate-900">{profileName}</p>
                    <p className="truncate text-xs text-slate-500">{profileEmail} · {profileRole}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setProfileOpen(false); onProfile(); }} className="block w-full px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">View profile</button>
                    <button onClick={() => { setProfileOpen(false); onSettings(); }} className="block w-full px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">Display settings</button>
                    <button onClick={() => { setProfileOpen(false); onShortcuts(); }} className="block w-full px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">Keyboard shortcuts</button>
                    <button onClick={() => { setProfileOpen(false); onSignOut(); }} className="block w-full px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">Sign out</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-2 md:hidden">
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search projects, tasks…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-slate-400 focus:bg-white" aria-label="Search mobile" />
        </label>
      </div>
    </header>
  );
}
