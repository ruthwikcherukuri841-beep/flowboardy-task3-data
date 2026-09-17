import { CalendarDays, Share2 } from "lucide-react";
import { userById } from "../data/directory";
import type { Project } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./Progress";

const statusStyle: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  completed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  "on-hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function ProjectCard({ project, taskCount, onOpen, compact = false, me }: {
  project: Project; taskCount: number; onOpen: () => void; compact?: boolean; me?: string;
}) {
  const shared = me && project.createdBy !== me
    ? project.sharedWith?.find((s) => s.user === me) : undefined;
  return (
    <button onClick={onOpen} className={`flex flex-col rounded-xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-slate-900">{project.title}</h3>
        {shared ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold capitalize text-indigo-600 ring-1 ring-inset ring-indigo-600/20">
            <Share2 size={9} /> {shared.access} access
          </span>
        ) : (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyle[project.status]}`}>
            {project.status.replace("-", " ")}
          </span>
        )}
      </div>
      <p className="line-clamp-2 mt-1 text-[13px] leading-relaxed text-slate-500">{project.description}</p>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{taskCount} tasks</span>
          <span className="font-semibold text-slate-700">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} tone={project.progress === 100 ? "emerald" : project.status === "on-hold" ? "amber" : "indigo"} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><CalendarDays size={13} className="text-slate-400" /> {project.dueDate}</span>
        <span className="flex -space-x-1.5">
          {project.members.slice(0, 4).map((m) => {
            const u = userById(m);
            return <Avatar key={m} avatar={u.avatar} name={u.name} className="h-6 w-6 text-[9px]" ring />;
          })}
        </span>
      </div>
    </button>
  );
}