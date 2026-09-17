import type { Task } from "../types";
import { projectById, userById } from "./directory";

export interface AppNotification {
  id: string;
  kind: "overdue" | "due-soon" | "assigned" | "completed" | "progress";
  title: string;
  body: string;
  taskId?: string;
  time: string;
  read: boolean;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Notifications derived purely from real task data — no hardcoded ids.
export function buildNotifications(tasks: Task[]): AppNotification[] {
  const now = today();
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now).slice(0, 3);
  const dueSoon = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate >= now).slice(0, 3);
  const assigned = tasks.filter((t) => t.assignee && t.status !== "done").slice(0, 3);
  const done = tasks.filter((t) => t.status === "done").slice(0, 3);

  const list: AppNotification[] = [
    ...overdue.map((t, i) => ({
      id: `n-over-${t.id}`,
      kind: "overdue" as const,
      title: "Task overdue",
      body: `${t.title} · ${projectById(t.projectId).title} was due ${t.dueDate}`,
      taskId: t.id,
      time: i === 0 ? "Overdue now" : "Needs attention",
      read: false,
    })),
    ...dueSoon.map((t, i) => ({
      id: `n-due-${t.id}`,
      kind: "due-soon" as const,
      title: "Due soon",
      body: `${t.title} is due ${t.dueDate} · ${userById(t.assignee).name}`,
      taskId: t.id,
      time: `Due ${t.dueDate}`,
      read: i !== 0,
    })),
    ...assigned.map((t) => ({
      id: `n-asg-${t.id}`,
      kind: "assigned" as const,
      title: "Assigned to you",
      body: `${t.title} · ${projectById(t.projectId).title}`,
      taskId: t.id,
      time: t.dueDate ? `Due ${t.dueDate}` : "Open",
      read: true,
    })),
    ...done.map((t) => ({
      id: `n-done-${t.id}`,
      kind: "completed" as const,
      title: "Marked done",
      body: `${t.title} was completed`,
      taskId: t.id,
      time: "Completed",
      read: true,
    })),
  ];
  return list;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  taskId?: string;
}

// Activity feed from real tasks, newest first — no hardcoded ids.
export function buildActivity(tasks: Task[]): ActivityItem[] {
  const verbs: Record<string, string> = {
    todo: "added",
    "in-progress": "started",
    done: "completed",
  };
  return [...tasks]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 6)
    .map((t) => ({
      id: `a-${t.id}`,
      text: `${userById(t.assignee).name} ${verbs[t.status] ?? "updated"} “${t.title}”`,
      time: t.dueDate || "No due date",
      taskId: t.id,
    }));
}
