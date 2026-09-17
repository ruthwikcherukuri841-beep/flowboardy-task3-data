export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ProjectStatus = "active" | "completed" | "on-hold";
export type ProjectAccess = "view" | "review" | "edit";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio?: string;
  location?: string;
  createdAt?: string;
}

export interface SharedEntry {
  user: string;
  access: ProjectAccess;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: string[];
  sharedWith?: SharedEntry[];
  createdBy?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

export type View = "dashboard" | "projects" | "tasks" | "teams" | "people" | "chat" | "profile" | "notfound";

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  seen: boolean;
  createdAt: string;
}

export interface ChatContact {
  user: User;
  lastMessage: string;
  lastAt: string;
  unread: number;
}