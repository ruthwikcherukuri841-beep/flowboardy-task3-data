import { useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, Camera, ChevronRight, Copy, FolderKanban, ListChecks, Lock, MapPin, Share2, Trophy } from "lucide-react";
import { accents, type AccentKey } from "../theme";
import type { Project, Task } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./Progress";
import { TaskCard } from "./TaskCard";

type Browse = "all" | "todo" | "in-progress" | "done" | "review";

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ProfilePage({
  self, name, role, email, bio, location, memberSince, userId, accent, avatar,
  projects, tasks, compact,
  onAvatar, onSave, onOpenTask, onOpenProject, onBrowseTasks, onToast, onSignOut, onViewSelf, onOpenAssignee,
}: {
  self: boolean;
  name: string; role: string; email: string; bio: string; location: string; memberSince?: string; userId: string;
  accent: AccentKey; avatar: string;
  projects: Project[]; tasks: Task[]; compact: boolean;
  onAvatar?: (dataUrl: string) => void;
  onSave?: (name: string, role: string, bio: string, location: string) => void;
  onOpenTask?: (id: string) => void;
  onOpenProject?: (id: string) => void;
  onBrowseTasks?: (s: Browse) => void;
  onToast?: (m: string) => void;
  onSignOut?: () => void;
  onViewSelf?: () => void;
  onOpenAssignee?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [r, setR] = useState(role);
  const [b, setB] = useState(bio);
  const [l, setL] = useState(location);
  const [tab, setTab] = useState<Browse>("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mine = useMemo(() => tasks.filter((t) => t.assignee === userId), [tasks, userId]);
  const done = mine.filter((t) => t.status === "done").length;
  const inProg = mine.filter((t) => t.status === "in-progress").length;
  const todo = mine.filter((t) => t.status === "todo").length;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const overdue = mine.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr);
  const rate = mine.length ? Math.round((done / mine.length) * 100) : 0;
  const myProjects = useMemo(() => projects.filter((p) => p.members.includes(userId)), [projects, userId]);
  const visible = mine.filter((t) => tab === "all" || t.status === tab);
  const focus = overdue[0] ?? mine.find((t) => t.status !== "done");

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onAvatar) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) { onToast?.("Please choose a PNG, JPG, WebP or GIF photo"); return; }
    if (file.size > 6 * 1024 * 1024) { onToast?.("Photo must be 6MB or smaller"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await onAvatar(String(reader.result));
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => { setUploading(false); onToast?.("Could not read that image"); };
    reader.readAsDataURL(file);
  };

  const week = useMemo(() => {
    const days: { label: string; iso: string; count: number }[] = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ label: d.toLocaleDateString("en-US", { weekday: "narrow" }), iso, count: 0 });
    }
    for (const t of mine) {
      const k = (t.createdAt ?? "").slice(0, 10);
      const day = days.find((x) => x.iso === k);
      if (day) day.count += 1;
    }
    return days;
  }, [mine]);
  const maxCount = Math.max(1, ...week.map((d) => d.count));
  const weekTotal = week.reduce((sum, d) => sum + d.count, 0);

  const solid = accents[accent].solid;

  const share = async () => {
    const link = `${window.location.origin}#/u/${userId}`;
    try {
      await navigator.clipboard.writeText(link);
      onToast?.("Profile link copied to clipboard");
    } catch {
      onToast?.(link);
    }
  };

  return (
    <section>
      {/* Public view of another member: only info that belongs to them is shown. */}
      {!self ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="hero-animated h-24" style={{ background: `linear-gradient(135deg, ${solid}, ${solid}99, ${solid})` }} />
          <div className="px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-end gap-3.5">
                <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white shadow-md" style={{ transform: "translateY(-18px)" }}>
                  <Avatar avatar={avatar} name={name} className="h-full w-full rounded-2xl text-xl font-extrabold" />
                </span>
                <div className="pb-1">
                  <h1 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-slate-900">
                    {name}
                    <BadgeCheck size={17} className="text-sky-500" aria-label="Verified member" />
                  </h1>
                  <p className="text-[13px] text-slate-500">{role} · <span className="inline-flex translate-y-[-1px] items-center gap-1"><MapPin size={12} className="text-slate-400" />{location}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                  <Share2 size={14} /> Share
                </button>
                {onViewSelf && (
                  <button onClick={onViewSelf} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">
                    <ArrowLeft size={14} /> Your profile
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{bio}</p>
            <dl className="mt-2 grid gap-3 rounded-xl bg-slate-50 p-4 text-[13px] sm:grid-cols-3">
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Role</dt><dd className="mt-0.5 font-semibold text-slate-800">{role}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Email</dt><dd className="mt-0.5 truncate font-semibold text-slate-800">{email}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Member since</dt><dd className="mt-0.5 font-semibold text-slate-800">{fmtDate(memberSince)}</dd></div>
            </dl>
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-500">
              <Lock size={15} className="shrink-0 text-slate-400" />
              {name}'s workspace is private. Projects and tasks are only visible to their owner's account.
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* Own profile */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <div className="hero-animated h-24" style={{ background: `linear-gradient(135deg, ${solid}, ${solid}99, ${solid})` }} />
        <div className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3.5">
              <div className="relative" style={{ transform: "translateY(-18px)" }}>
                <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white shadow-md">
                  <Avatar avatar={avatar} name={name} className="h-full w-full rounded-2xl text-xl font-extrabold" />
                </span>
                {onAvatar && (
                  <>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={pickPhoto} aria-label="Choose a profile photo" />
                    <button onClick={() => fileRef.current?.click()} title="Change profile photo" disabled={uploading}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow transition hover:bg-slate-700 disabled:opacity-60">
                      {uploading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Camera size={12} />}
                    </button>
                  </>
                )}
              </div>
              <div className="pb-1">
                <h1 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-slate-900">
                  {name}
                  <BadgeCheck size={17} className="text-sky-500" aria-label="Verified member" />
                </h1>
                <p className="text-[13px] text-slate-500">{role} · <span className="inline-flex translate-y-[-1px] items-center gap-1"><MapPin size={12} className="text-slate-400" />{location}</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setN(name); setR(role); setB(bio); setL(location); setEditing((v) => !v); }} className="rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">
                {editing ? "Cancel" : "Edit profile"}
              </button>
              <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); if (n.trim().length < 2) return; onSave?.(n.trim(), r.trim() || role, b.trim(), l.trim() || location); setEditing(false); }} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
              <label className="block text-[13px] font-medium text-slate-700">Full name<input value={n} onChange={(e) => setN(e.target.value)} minLength={2} required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" /></label>
              <label className="block text-[13px] font-medium text-slate-700">Role<input value={r} onChange={(e) => setR(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" /></label>
              <label className="block text-[13px] font-medium text-slate-700">Location<input value={l} onChange={(e) => setL(e.target.value)} placeholder="City, Country" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" /></label>
              <label className="block text-[13px] font-medium text-slate-700">Email<input value={email} disabled className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500" /></label>
              <label className="block text-[13px] font-medium text-slate-700 sm:col-span-2">Bio<textarea value={b} onChange={(e) => setB(e.target.value)} rows={2} maxLength={220} placeholder="What are you focused on?" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" /></label>
              <div className="sm:col-span-2"><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">Save changes</button></div>
            </form>
          ) : (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{bio}</p>
          )}

          {/* Stat strip */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <button onClick={() => onBrowseTasks?.("all")} className="rounded-xl bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100">
              <p className="flex items-center gap-1.5 text-lg font-bold text-slate-900"><ListChecks size={16} className="text-slate-400" />{mine.length}</p>
              <p className="text-[11px] font-medium text-slate-500">Assigned to me</p>
            </button>
            <button onClick={() => onBrowseTasks?.("done")} className="rounded-xl bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100">
              <p className="flex items-center gap-1.5 text-lg font-bold text-slate-900"><Trophy size={16} className="text-slate-400" />{done}</p>
              <p className="text-[11px] font-medium text-slate-500">Completed · {rate}%</p>
            </button>
            <button onClick={() => onBrowseTasks?.("in-progress")} className="rounded-xl bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100">
              <p className="flex items-center gap-1.5 text-lg font-bold text-slate-900"><CalendarDays size={16} className="text-slate-400" />{inProg}</p>
              <p className="text-[11px] font-medium text-slate-500">In progress</p>
            </button>
            <button onClick={() => onBrowseTasks?.("todo")} className="rounded-xl bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100">
              <p className={`flex items-center gap-1.5 text-lg font-bold ${overdue.length ? "text-rose-600" : "text-slate-900"}`}><FolderKanban size={16} className={overdue.length ? "text-rose-400" : "text-slate-400"} />{overdue.length}</p>
              <p className="text-[11px] font-medium text-slate-500">Overdue</p>
            </button>
          </div>
        </div>
      </div>

      {/* Middle grid */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Workload</h2>
              <span className="text-xs text-slate-400">{todo} to do · {inProg} active · {done} done</span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              <span className="bg-slate-400" style={{ width: `${mine.length ? (todo / mine.length) * 100 : 0}%` }} title="To do" />
              <span className="bg-blue-500" style={{ width: `${mine.length ? (inProg / mine.length) * 100 : 0}%` }} title="In progress" />
              <span className="bg-emerald-500" style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} title="Done" />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-end justify-between gap-2">
                {week.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.count} task${d.count === 1 ? "" : "s"} added on ${d.iso}`}>
                    <span className="text-[10px] font-semibold text-slate-500">{d.count || ""}</span>
                    <span className="w-full max-w-8 rounded-md bar-grow" style={{ height: `${d.count ? Math.max(8, Math.round((d.count / maxCount) * 56)) : 3}px`, background: d.count ? solid : "rgb(226 232 240)" }} />
                    <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                {weekTotal > 0 ? `${weekTotal} task${weekTotal === 1 ? "" : "s"} added in the last 7 days` : "No tasks added in the last 7 days"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Projects I'm in ({myProjects.length})</h2>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {myProjects.map((p) => {
                const count = tasks.filter((t) => t.projectId === p.id).length;
                return (
                  <li key={p.id}>
                    <button onClick={() => onOpenProject?.(p.id)} className="group flex w-full items-center gap-3 py-2.5 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-slate-800 group-hover:text-slate-950">{p.title}</span>
                        <span className="mt-1 block"><ProgressBar value={p.progress} /></span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{count} tasks</span>
                      <ChevronRight size={15} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <h2 className="text-sm font-bold text-slate-900">Up next</h2>
            {focus ? (
              <div className="mt-2.5 rounded-xl bg-slate-50 p-3">
                <p className="text-[13px] font-semibold leading-snug text-slate-800">{focus.title}</p>
                <p className="mt-1 text-xs text-slate-500">Due {focus.dueDate} · {focus.status.replace("-", " ")}</p>
                <button onClick={() => onOpenTask?.(focus.id)} className="mt-2.5 w-full rounded-lg bg-slate-900 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-700">Open task</button>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-slate-500">Nothing assigned. Enjoy the calm.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <h2 className="text-sm font-bold text-slate-900">Details</h2>
            <dl className="mt-2 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2"><dt className="text-slate-400">Email</dt><dd className="truncate font-medium text-slate-700">{email}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">Role</dt><dd className="font-medium text-slate-700">{role}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">Location</dt><dd className="font-medium text-slate-700">{location}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">Member since</dt><dd className="font-medium text-slate-700">{fmtDate(memberSince)}</dd></div>
            </dl>
            <button onClick={onSignOut} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Sign out</button>
          </div>
        </div>
      </div>

      {/* My tasks */}
      <div className="mb-2.5 mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">My tasks ({visible.length})</h2>
        <div className="flex gap-1" role="group" aria-label="Filter my tasks">
          {(["all", "todo", "in-progress", "done"] as Browse[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize ${tab === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"}`}>
              {t.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-[13px] text-slate-500">
          Nothing here. <button onClick={() => setTab("all")} className="font-semibold text-slate-800 underline">Show everything</button>
        </div>
      ) : (
        <div className={`grid ${compact ? "gap-2" : "gap-3"} sm:grid-cols-2 xl:grid-cols-3`}>
          {visible.map((t: Task) => <TaskCard key={t.id} task={t} compact={compact} onOpen={() => onOpenTask?.(t.id)} onOpenAssignee={onOpenAssignee} />)}
        </div>
      )}
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Copy size={11} /> Saved in your FlowBoard account — every member's projects and tasks come from the live API.</p>
        </>
      )}
    </section>
  );
}