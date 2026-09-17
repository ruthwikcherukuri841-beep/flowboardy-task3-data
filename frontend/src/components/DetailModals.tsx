import { useState } from "react";
import { CalendarDays, Search, Share2, Trash2, UserPlus, Users, X } from "lucide-react";
import { projectById, userById } from "../data/directory";
import type { Project, ProjectAccess, ProjectStatus, Task, TaskPriority, TaskStatus, User } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./Progress";
import { TaskCard } from "./TaskCard";

export type Access = ProjectAccess | "owner" | null;

function Shell({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
}

function AccessPill({ access }: { access: Access }) {
  if (access === "owner") return <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold capitalize text-white">You own this</span>;
  const map: Record<string, string> = {
    view: "bg-slate-100 text-slate-600",
    review: "bg-violet-50 text-violet-700",
    edit: "bg-indigo-50 text-indigo-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset ${map[access ?? "view"]}`}>Shared · {access} access</span>;
}

export function ProjectDetailModal({
  project, tasks, users, onClose, onViewTasks, onUpdate, onDelete, onOpenTask, onShare, onUnshare, me, access,
}: {
  project: Project;
  tasks: Task[];
  users: User[];
  onClose: () => void;
  onViewTasks: (projectId: string) => void;
  onUpdate: (p: Project) => void;
  onDelete: (id: string) => void;
  onOpenTask: (taskId: string) => void;
  onShare: (projectId: string, userId: string, access: ProjectAccess) => void;
  onUnshare: (projectId: string, userId: string) => void;
  me: string;
  access: Access;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [q, setQ] = useState("");
  const [mAccess, setMAccess] = useState<ProjectAccess>("view");
  const done = tasks.filter((t) => t.status === "done").length;
  const canManage = access === "owner";
  const shared = project.sharedWith ?? [];
  const ql = q.trim().toLowerCase();
  const sharedIds = new Set(shared.map((s) => String(s.user)));
  const addable = users.filter((u) => u.id !== me && !sharedIds.has(u.id) && (!ql || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(ql))).slice(0, 8);

  return (
    <Shell onClose={onClose} label={`Project ${project.title}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project · {project.id.toUpperCase()} <AccessPill access={access} />
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{project.title}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
      </div>
      <div className="px-5 py-4">
        {!editing ? (
          <>
            <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 py-2.5"><p className="text-base font-bold text-slate-900">{tasks.length}</p><p className="text-[11px] text-slate-500">Tasks</p></div>
              <div className="rounded-xl bg-slate-50 py-2.5"><p className="text-base font-bold text-slate-900">{done}</p><p className="text-[11px] text-slate-500">Done</p></div>
              <div className="rounded-xl bg-slate-50 py-2.5"><p className="text-base font-bold text-slate-900">{project.progress}%</p><p className="text-[11px] text-slate-500">Progress</p></div>
            </div>
            <div className="mt-4"><ProgressBar value={project.progress} /></div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-600">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" /> Due {project.dueDate}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-slate-400" />
                {project.members.map((m) => userById(m).name).join(", ") || "Just you"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-600">{project.status}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => onViewTasks(project.id)} className="rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">View tasks</button>
              {canManage && (
                <>
                  <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  {confirming ? (
                    <span className="inline-flex items-center gap-2 text-[13px]">
                      <span className="text-slate-500">Delete this project?</span>
                      <button onClick={() => onDelete(project.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500">Yes, delete</button>
                      <button onClick={() => setConfirming(false)} className="rounded-lg border px-3 py-1.5 text-slate-600">Keep</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button>
                  )}
                </>
              )}
            </div>

            {canManage && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800"><Share2 size={14} className="text-indigo-500" /> Shared with teammates</p>
                {shared.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {shared.map((s) => {
                      const u = userById(s.user);
                      return (
                        <li key={s.user} className="flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2">
                          <Avatar avatar={u.avatar} name={u.name} className="h-7 w-7 text-[10px]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                            <span className="block truncate text-[11px] text-slate-400">{u.role}</span>
                          </span>
                          <select value={s.access} onChange={(e) => onShare(project.id, s.user, e.target.value as ProjectAccess)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-600 outline-none focus:border-indigo-400"
                            title="Change access level">
                            <option value="view">View</option><option value="review">Review</option><option value="edit">Edit</option>
                          </select>
                          <button onClick={() => onUnshare(project.id, s.user)} title="Stop sharing" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={14} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label className="relative min-w-0 flex-1">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members to share with…"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400" aria-label="Find teammate" />
                  </label>
                  <select value={mAccess} onChange={(e) => setMAccess(e.target.value as ProjectAccess)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-400">
                    <option value="view">View</option><option value="review">Review</option><option value="edit">Edit</option>
                  </select>
                </div>
                {addable.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {addable.map((u) => (
                      <li key={u.id} className="flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2">
                        <Avatar avatar={u.avatar} name={u.name} className="h-7 w-7 text-[10px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                          <span className="block truncate text-[11px] text-slate-400">{u.role} · {u.location || "—"}</span>
                        </span>
                        <button onClick={() => onShare(project.id, u.id, mAccess)} title={`Share with ${u.name}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"><UserPlus size={12} /> Share</button>
                      </li>
                    ))}
                  </ul>
                )}
                {ql && addable.length === 0 && <p className="mt-2 text-xs text-slate-500">No matching members to share with.</p>}
                <p className="mt-2 text-[11px] text-slate-400">View = read-only · Review = set tasks to “review” · Edit = can also complete tasks. Only you can change tasks or share further.</p>
              </div>
            )}

            <h3 className="mb-2 mt-6 text-sm font-bold text-slate-900">Tasks in this project ({tasks.length})</h3>
            {tasks.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">No tasks yet in this project.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tasks.map((t) => (
                  <TaskCard key={t.id} task={t} access={access} onOpen={() => onOpenTask(t.id)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onUpdate({ ...project, title: title.trim(), description: desc.trim(), status }); }} className="space-y-3">
            <label className="block text-[13px] font-medium text-slate-700">Title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required minLength={3} /></label>
            <label className="block text-[13px] font-medium text-slate-700">Description<textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></label>
            <label className="block text-[13px] font-medium text-slate-700">Status
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="active">Active</option><option value="completed">Completed</option><option value="on-hold">On hold</option>
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500">Save changes</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}

export function TaskDetailModal({
  task, onClose, onUpdateStatus, onUpdatePriority, access,
}: {
  task: Task;
  onClose: () => void;
  onUpdateStatus: (id: string, s: TaskStatus) => void;
  onUpdatePriority: (id: string, p: TaskPriority) => void;
  access: Access;
}) {
  const assignee = userById(task.assignee);
  const project = projectById(task.projectId);
  const canEdit = access === "owner";
  const canStatus = access === "owner" || access === "edit" || access === "review";
  const statuses: TaskStatus[] = (access === "review" ? ["todo", "in-progress", "review"] : ["todo", "in-progress", "review", "done"]);
  return (
    <Shell onClose={onClose} label={`Task ${task.title}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {project.title} · {task.id.toUpperCase()} <AccessPill access={access} />
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{task.title}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
      </div>
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm leading-relaxed text-slate-600">{task.description}</p>
        {canStatus ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Status {access === "review" && <span className="ml-1 normal-case text-violet-500">(can tick for review only)</span>}</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Change status">
              {statuses.map((s) => (
                <button key={s} onClick={() => onUpdateStatus(task.id, s)} className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold capitalize ${task.status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{s.replace("-", " ")}</button>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-500">Your view-only access lets you follow along — the owner moves tasks forward.</p>
        )}
        {canEdit ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</p>
            <div className="flex gap-1.5" role="group" aria-label="Change priority">
              {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                <button key={p} onClick={() => onUpdatePriority(task.id, p)} className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold capitalize ${task.priority === p ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
              ))}
            </div>
          </div>
        ) : null}
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-[13px]">
          <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Assignee</dt><dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800"><Avatar avatar={assignee.avatar} name={assignee.name} className="h-5 w-5 text-[8px]" />{assignee.name}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Due date</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.dueDate}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Project</dt><dd className="mt-0.5 font-semibold text-slate-800">{project.title}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">Created</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.createdAt}</dd></div>
        </dl>
      </div>
    </Shell>
  );
}