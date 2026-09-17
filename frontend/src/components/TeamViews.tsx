import { useMemo, useState } from "react";
import {
  ChevronRight, Crown, Plus, Search, Trash2, UserPlus, Users, X,
} from "lucide-react";
import { initials } from "../theme";
import type { Task, Team, User } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar, ProgressRing } from "./Progress";

const AV_COLORS = ["bg-slate-700", "bg-indigo-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600", "bg-blue-600", "bg-purple-600", "bg-teal-600"];

export function teamColor(id: string) {
  let n = 0;
  for (const c of id) n = (n + c.charCodeAt(0)) % AV_COLORS.length;
  return AV_COLORS[n];
}

export function MemberAvatarV2({ user, size = 8, ring = false }: { user?: Pick<User, "name" | "avatar" | "id">; size?: number; ring?: boolean }) {
  return <Avatar avatar={user?.avatar} name={user?.name} size={size * 4} ring={ring} />;
}

export function TeamAvatar({ team, size = "h-11 w-11", rounded = "rounded-xl" }: { team: Pick<Team, "name" | "id">; size?: string; rounded?: string }) {
  return (
    <span className={`flex items-center justify-center ${size} ${rounded} ${teamColor(team.id)} text-sm font-extrabold text-white`}>
      {initials(team.name)}
    </span>
  );
}

function memberLoad(memberId: string, tasks: Task[]) {
  const mine = tasks.filter((t) => t.assignee === memberId);
  const done = mine.filter((t) => t.status === "done").length;
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
  return { total: mine.length, done, inProg: mine.filter((t) => t.status === "in-progress").length, pct };
}

export function TeamsPage({
  teams, members, me, tasks, onOpenTeam, onNewTeam, onOpenUser, onAddToTeam,
}: {
  teams: Team[]; members: User[]; me: string; tasks: Task[];
  onOpenTeam: (id: string) => void; onNewTeam: () => void;
  onOpenUser: (id: string) => void; onAddToTeam: (userId: string, userName: string) => void;
}) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const found = useMemo(() => {
    const list = ql ? members.filter((m) => `${m.name} ${m.role} ${m.location ?? ""} ${m.email}`.toLowerCase().includes(ql)) : members;
    return list.slice(0, 24);
  }, [members, ql]);
  const teamStats = useMemo(() => teams.map((t) => {
    const all = tasks.filter((x) => t.members.includes(x.assignee));
    const done = all.filter((x) => x.status === "done").length;
    return { team: t, total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }), [teams, tasks]);

  return (
    <section className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-xl font-bold tracking-tight">Teams <span className="text-sm font-semibold text-slate-400">{teams.length}</span></h1>
        <button onClick={onNewTeam} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-700">
          <Plus size={14} /> New team
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="floaty flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Users size={22} /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No teams yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Teams bring your members together. Create one, then search the member directory to add people.</p>
              <button onClick={onNewTeam} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Create your first team</button>
            </div>
          ) : (
            <div className="space-y-3">
              {teamStats.map(({ team, total, done, pct }) => (
                <button key={team.id} onClick={() => onOpenTeam(team.id)} className="group flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
                  <TeamAvatar team={team} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-slate-900">{team.name}</span>
                      {String(team.createdBy) === me && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Crown size={10} /> Owner</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{team.description || `${team.members.length} member${team.members.length === 1 ? "" : "s"} · no description yet`}</span>
                    <span className="mt-2 block"><ProgressBar value={pct} tone={pct ? "emerald" : "indigo"} /></span>
                    <span className="mt-1 block text-[11px] text-slate-400">{done}/{total} team tasks done</span>
                  </span>
                  <span className="shrink-0">
                    <span className="flex -space-x-2">
                      {team.members.slice(0, 4).map((mid) => {
                        const m = members.find((x) => x.id === mid);
                        return <MemberAvatarV2 key={mid} user={m} size={8} ring />;
                      })}
                    </span>
                    <span className="mt-1 block text-right text-[11px] text-slate-400">{team.members.length} member{team.members.length === 1 ? "" : "s"}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Members directory</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{members.length}</span>
          </div>
          <label className="relative mt-2.5 block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white" aria-label="Search members" />
          </label>
          <ul className="mt-2.5 max-h-[420px] space-y-1 overflow-y-auto">
            {found.length === 0 ? (
              <li className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">No members match “{q}”.</li>
            ) : found.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-50">
                <MemberAvatarV2 user={m} size={8} />
                <span className="min-w-0 flex-1">
                  <button onClick={() => onOpenUser(m.id)} className="block truncate text-[13px] font-semibold text-slate-800 hover:underline">{m.name}</button>
                  <span className="block truncate text-[11px] text-slate-400">{m.role} · {m.location || "—"}</span>
                </span>
                {m.id !== me && (
                  <button
                    onClick={() => onAddToTeam(m.id, m.name)}
                    title={`Add ${m.name} to a team`}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-900 hover:text-white"
                  >
                    <UserPlus size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">Click a name to view their profile page.</p>
        </div>
      </div>
    </section>
  );
}

export function NewTeamModal({ onCreate, onClose }: { onCreate: (d: { name: string; description: string }) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="New team">
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-base font-bold text-slate-900">New team</h2><p className="text-[13px] text-slate-500">You automatically become the owner.</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return; onCreate({ name: name.trim(), description: desc.trim() }); }} className="mt-4 space-y-3">
          <label className="block text-[13px] font-medium text-slate-700">Team name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design Crew" minLength={2} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></label>
          <label className="block text-[13px] font-medium text-slate-700">Description<textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="What will this team own?" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">Create team</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TeamDetailModal({
  team, members, allUsers, tasks, me, compact,
  onClose, onUpdate, onAddMember, onRemoveMember, onLeave, onDelete, onOpenUser,
}: {
  team: Team; members: User[]; allUsers: User[]; tasks: Task[]; me: string; compact: boolean;
  onClose: () => void; onUpdate: (t: Team, d: { name: string; description: string }) => void;
  onAddMember: (teamId: string, userId: string) => void; onRemoveMember: (teamId: string, userId: string) => void;
  onLeave: (teamId: string) => void; onDelete: (teamId: string) => void; onOpenUser: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [desc, setDesc] = useState(team.description);
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const isOwner = String(team.createdBy) === me;
  const ql = q.trim().toLowerCase();

  const memberIds = new Set(team.members.map((m) => String(m)));
  const addable = allUsers.filter((u) => !memberIds.has(u.id) && (!ql || `${u.name} ${u.role} ${u.location ?? ""}`.toLowerCase().includes(ql))).slice(0, 12);

  const teamTasks = tasks.filter((t) => memberIds.has(t.assignee));
  const teamDone = teamTasks.filter((t) => t.status === "done").length;
  const teamPct = teamTasks.length ? Math.round((teamDone / teamTasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Team ${team.name}`}>
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <TeamAvatar team={team} size="h-11 w-11" rounded="rounded-xl" />
            <div className="min-w-0">
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return; onUpdate(team, { name: name.trim(), description: desc.trim() }); setEditing(false); }} className="space-y-1">
                  <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold" />
                  <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" />
                  <div className="flex gap-1.5 pt-0.5">
                    <button type="submit" className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Save</button>
                    <button type="button" onClick={() => setEditing(false)} className="rounded-md border px-2.5 py-1 text-[11px] font-semibold text-slate-600">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="flex items-center gap-1.5 truncate text-base font-bold text-slate-900">{team.name}
                    {isOwner && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Crown size={10} /> Owner</span>}
                  </h2>
                  <p className="truncate text-[13px] text-slate-500">{team.description || "No description yet."}</p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
            <div className="flex items-center gap-3">
              <ProgressRing value={teamPct} />
              <div>
                <p className="text-[13px] font-bold text-slate-900">Team progress</p>
                <p className="text-xs text-slate-500">{teamDone}/{teamTasks.length} tasks done across members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
              )}
              {isOwner ? (
                confirmDel ? (
                  <span className="inline-flex items-center gap-2 text-[13px]">
                    <span className="text-slate-500">Delete team?</span>
                    <button onClick={() => onDelete(team.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500">Yes</button>
                    <button onClick={() => setConfirmDel(false)} className="rounded-lg border px-3 py-1.5 text-slate-600">No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Delete</button>
                )
              ) : (
                <button onClick={() => onLeave(team.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Leave team</button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Members ({members.length})</h3>
              <span className="text-[11px] text-slate-400">{teamTasks.length} tasks assigned</span>
            </div>
            <ul className={`mt-2 grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
              {members.map((m) => {
                const load = memberLoad(m.id, tasks);
                return (
                  <li key={m.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2.5">
                      <MemberAvatarV2 user={m} size={9} />
                      <span className="min-w-0 flex-1">
                        <button onClick={() => { onClose(); onOpenUser(m.id); }} className="block truncate text-[13px] font-semibold text-slate-800 hover:underline">{m.name}</button>
                        <span className="block truncate text-[11px] text-slate-400">{m.role} · {m.location || "—"}</span>
                      </span>
                      {isOwner && m.id !== me && (
                        <button onClick={() => onRemoveMember(team.id, m.id)} title="Remove from team" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={14} /></button>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex-1"><ProgressBar value={load.pct} tone={load.pct ? "emerald" : "indigo"} /></span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-500">{load.done}/{load.total} done</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{load.total ? `${load.inProg} in progress · ${load.pct}%` : "No tasks assigned in your workspace yet"}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          {isOwner && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800"><UserPlus size={14} /> Add members</p>
              <label className="relative mt-2 block">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the member directory…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400" aria-label="Find member" />
              </label>
              <ul className="mt-2 space-y-1">
                {addable.length === 0 ? (
                  <li className="rounded-lg bg-white px-3 py-4 text-center text-xs text-slate-500">{ql ? "No matching members." : "Every member is already on this team."}</li>
                ) : addable.map((u) => (
                  <li key={u.id} className="flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2">
                    <MemberAvatarV2 user={u} size={8} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                      <span className="block truncate text-[11px] text-slate-400">{u.role} · {u.location || "—"}</span>
                    </span>
                    <button onClick={() => onAddMember(team.id, u.id)} className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700">Add</button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">Members are FlowBoard users — search by name, role, or city.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddToTeamModal({
  userName, teams, onAdd, onCreateAndAdd, onClose,
}: {
  userName: string; teams: Team[];
  onAdd: (teamId: string) => void; onCreateAndAdd: (name: string) => void; onClose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Add to team">
      <div className="fade absolute inset-0 bg-slate-900/45" onClick={onClose} />
      <div className="modal-rise relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-base font-bold text-slate-900">Add {userName}</h2><p className="text-[13px] text-slate-500">Choose one of your teams.</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        {creating ? (
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return; onCreateAndAdd(name.trim()); }} className="mt-4 space-y-3">
            <label className="block text-[13px] font-medium text-slate-700">New team name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Docs squad" minLength={2} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Back</button>
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">Create & add {userName.split(" ")[0]}</button>
            </div>
          </form>
        ) : (
          <>
            <ul className="mt-4 space-y-1">
              {teams.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5">
                  <TeamAvatar team={t} size="h-8 w-8" rounded="rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">{t.name}</span>
                    <span className="block text-[11px] text-slate-400">{t.members.length} members</span>
                  </span>
                  <button onClick={() => onAdd(t.id)} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700">Add</button>
                </li>
              ))}
            </ul>
            <button onClick={() => setCreating(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><Plus size={14} /> Create a new team instead</button>
          </>
        )}
      </div>
    </div>
  );
}