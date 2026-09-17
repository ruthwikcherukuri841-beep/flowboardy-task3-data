import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, Share2, UserPlus, Users, X } from "lucide-react";
import { userById } from "../data/directory";
import type { Project, ProjectAccess, User } from "../types";
import { Avatar } from "./Avatar";

export type AccessMap = Map<string, ProjectAccess | "owner">;

const accessLabel: Record<string, { label: string; cls: string; hint: string }> = {
  view: { label: "View", cls: "bg-slate-100 text-slate-600", hint: "Read-only" },
  review: { label: "Review", cls: "bg-violet-50 text-violet-700", hint: "Can send tasks for review" },
  edit: { label: "Edit", cls: "bg-indigo-50 text-indigo-700", hint: "Can also complete tasks" },
};

export function PeoplePage({
  users, me, sharedProjects, accessOf, onOpenUser, onOpenProject, onShare,
}: {
  users: User[];
  me: string;
  sharedProjects: Project[];
  accessOf: (projectId: string) => ProjectAccess | "owner" | null;
  onOpenUser: (id: string) => void;
  onOpenProject: (id: string) => void;
  onShare: (userId?: string) => void;
}) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const found = useMemo(() => {
    const list = ql ? users.filter((m) => `${m.name} ${m.email} ${m.role} ${m.location ?? ""}`.toLowerCase().includes(ql)) : users;
    return list;
  }, [users, ql]);

  return (
    <section className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-xl font-bold tracking-tight">People <span className="text-sm font-semibold text-slate-400">{users.length}</span></h1>
        <label className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400" aria-label="Search people" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {found.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="floaty flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Users size={22} /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No one matches “{q}”</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">People are FlowBoard accounts. Try searching by name, email, role, or city.</p>
            </div>
          ) : (
            <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3`}>
              {found.map((m) => {
                const self = m.id === me;
                return (
                  <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
                    <div className="flex items-start gap-3">
                      <Avatar avatar={m.avatar} name={m.name} size={44} ring />
                      <div className="min-w-0 flex-1">
                        <button onClick={() => onOpenUser(m.id)} className="block truncate text-[13px] font-bold text-slate-900 hover:underline">{m.name}</button>
                        <p className="truncate text-xs text-slate-500">{m.role}</p>
                        <p className="truncate text-[11px] text-slate-400">{m.location || "—"}</p>
                      </div>
                      {self && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">You</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <button onClick={() => onOpenUser(m.id)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">View profile</button>
                      {!self && (
                        <button onClick={() => onShare(m.id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700">
                          <Share2 size={11} /> Share a project
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><Share2 size={14} className="text-indigo-500" /> Shared with me</h2>
          <p className="mt-1 text-xs text-slate-400">Projects teammates have shared with you. Your access decides what you can do.</p>
          {sharedProjects.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-6 text-center text-[13px] text-slate-500">
              Nothing shared yet. Open a project you own and share it with a teammate.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sharedProjects.map((p) => {
                const acc = accessOf(p.id);
                const meta = accessLabel[acc ?? "view"];
                const owner = userById(p.createdBy);
                return (
                  <li key={p.id}>
                    <button onClick={() => onOpenProject(p.id)} className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-slate-800">{p.title}</span>
                        <span className="block truncate text-[11px] text-slate-400">by {owner.name} · {p.progress}% done</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ring-inset ${meta.cls}`} title={meta.hint}>{meta.label} access</span>
                      <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-600">Access levels</p>
            <p className="mt-1">View — follow along; Review — move tasks to “review”; Edit — can also complete tasks. Only the owner edits tasks and shares further.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShareProjectModal({
  projects, users, onShare, onUnshare, onClose,
}: {
  projects: Project[]; users: User[];
  onShare: (projectId: string, userId: string, access: ProjectAccess) => void;
  onUnshare: (projectId: string, userId: string) => void;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [access, setAccess] = useState<ProjectAccess>("review");
  const [q, setQ] = useState("");
  const project = projects.find((p) => p.id === projectId);
  const shared = project?.sharedWith ?? [];
  const ql = q.trim().toLowerCase();

  useEffect(() => { setProjectId((prev) => prev || (projects[0]?.id ?? "")); }, [projects]);

  const sharedIds = new Set(shared.map((s) => String(s.user)));
  const addable = users.filter((u) => !sharedIds.has(u.id) && (!ql || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(ql))).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Share a project">
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Share a project</h2>
            <p className="text-[13px] text-slate-500">Pick a project you own, choose a teammate and their access level.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-[13px] font-medium text-slate-700">Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          {projects.length === 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">You don't own any projects yet — create one from the Projects page first.</p>
          )}

          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a teammate…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white" aria-label="Find teammate" />
            </label>
            <select value={access} onChange={(e) => setAccess(e.target.value as ProjectAccess)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-400" title="Access level">
              <option value="view">View</option><option value="review">Review</option><option value="edit">Edit</option>
            </select>
          </div>

          <ul className="max-h-52 space-y-1 overflow-y-auto">
            {addable.length === 0 ? (
              <li className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">{ql ? "No matching teammates." : "Everyone is already shared on this project."}</li>
            ) : addable.map((u) => (
              <li key={u.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2">
                <Avatar avatar={u.avatar} name={u.name} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                  <span className="block truncate text-[11px] text-slate-400">{u.role} · {u.location || "—"}</span>
                </span>
                <button onClick={() => onShare(projectId, u.id, access)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500">
                  <UserPlus size={11} /> Share
                </button>
              </li>
            ))}
          </ul>

          {shared.length > 0 && (
            <>
              <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Already shared ({shared.length})</p>
              <ul className="space-y-1">
                {shared.map((s) => {
                  const u = userById(s.user);
                  return (
                    <li key={s.user} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
                      <Avatar avatar={u.avatar} name={u.name} size={30} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                      <select value={s.access} onChange={(e) => onShare(projectId, s.user, e.target.value as ProjectAccess)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-600 outline-none">
                        <option value="view">View</option><option value="review">Review</option><option value="edit">Edit</option>
                      </select>
                      <button onClick={() => onUnshare(projectId, s.user)} title="Stop sharing" className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={14} /></button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}