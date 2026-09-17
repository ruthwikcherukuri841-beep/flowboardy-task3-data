import { CalendarDays, Check, Clock3 } from "lucide-react";
import { projectById, userById } from "../data/directory";
import type { ProjectAccess, Task, TaskStatus } from "../types";
import { Avatar } from "./Avatar";

const statusStyle: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600 ring-slate-500/20",
  "in-progress": "bg-blue-50 text-blue-700 ring-blue-600/20",
  review: "bg-violet-50 text-violet-700 ring-violet-600/20",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

const priorityDot: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

export function TaskCard({ task, onOpen, onOpenAssignee, compact = false, access, onQuickStatus }: {
  task: Task; onOpen: () => void; onOpenAssignee?: (id: string) => void; compact?: boolean;
  access?: ProjectAccess | "owner" | null; onQuickStatus?: (id: string, s: TaskStatus) => void;
}) {
  const assignee = userById(task.assignee);
  const project = projectById(task.projectId);
  const canTick = (access === "owner" || access === "edit") && onQuickStatus;
  const canReview = access === "review" && task.status !== "done" && onQuickStatus;
  return (
    <button onClick={onOpen} className={`block w-full rounded-xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusStyle[task.status]}`}>
            {task.status.replace("-", " ")}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium capitalize text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[task.priority]}`} />{task.priority}
          </span>
        </div>
        {(canTick || canReview) && task.status !== "done" ? (
          <span
            role="button" tabIndex={0} title={canTick ? "Mark done" : "Send for review"}
            onClick={(e) => { e.stopPropagation(); onQuickStatus?.(task.id, canTick ? "done" : "review"); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onQuickStatus?.(task.id, canTick ? "done" : "review"); } }}
            className="shrink-0 cursor-pointer rounded-full border border-slate-200 p-1 text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
          >
            {canTick ? <Check size={13} /> : <Clock3 size={13} />}
          </span>
        ) : task.status === "done" ? (
          <span className="shrink-0 rounded-full bg-emerald-50 p-1 text-emerald-600" title="Completed"><Check size={13} /></span>
        ) : null}
      </div>
      <h4 className="mt-2 text-[13px] font-semibold leading-snug text-slate-900">{task.title}</h4>
      <p className="line-clamp-2 mt-0.5 text-xs leading-relaxed text-slate-500">{task.description}</p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{project.title}</p>
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2.5">
        <span
          role="button" tabIndex={0}
          title={onOpenAssignee ? `Open ${assignee.name}'s profile` : assignee.name}
          onClick={(e) => { e.stopPropagation(); onOpenAssignee?.(task.assignee); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onOpenAssignee?.(task.assignee); } }}
          className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${onOpenAssignee ? "cursor-pointer rounded hover:bg-slate-100 hover:text-slate-800" : ""}`}
        >
          <Avatar avatar={assignee.avatar} name={assignee.name} className="h-5 w-5 text-[8px]" />
          {assignee.name.split(" ")[0]}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={12} /> {task.dueDate}</span>
      </div>
    </button>
  );
}