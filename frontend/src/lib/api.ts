// Typed client for the FlowBoard REST API.
// Base URL comes from VITE_API_URL (build-time). Auth uses a Bearer JWT
// stored in localStorage; a 401 anywhere signs the user out.
import type { ChatContact, ChatMessage, Project, ProjectAccess, ProjectStatus, Task, TaskPriority, TaskStatus, Team, User } from "../types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api";
const TOKEN_KEY = "flowboard-token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { message: string; details?: unknown };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("flowboard:unauthorized"));
    throw new Error(body?.error?.message ?? "Session expired — please sign in again");
  }
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export const api = {
  // Auth (public)
  register: (d: { name: string; email: string; password: string }) =>
    request<AuthPayload>("/auth/register", { method: "POST", body: JSON.stringify(d) }),
  login: (d: { email: string; password: string }) =>
    request<AuthPayload>("/auth/login", { method: "POST", body: JSON.stringify(d) }),
  me: () => request<User>("/auth/me"),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }).catch(() => ({ message: "Signed out" })),

  // Data (protected)
  getUsers: (params: { search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    const s = q.toString();
    return request<User[]>(`/users${s ? `?${s}` : ""}`);
  },
  getUser: (id: string) => request<User>(`/users/${id}`),
  getProjects: (params: { search?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status && params.status !== "all") q.set("status", params.status);
    const s = q.toString();
    return request<Project[]>(`/projects${s ? `?${s}` : ""}`);
  },
  getProject: (id: string) => request<Project & { tasks: Task[] }>(`/projects/${id}`),
  createProject: (d: { title: string; description: string; status: ProjectStatus; dueDate: string; members: string[] }) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(d) }),
  updateProject: (id: string, d: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteProject: (id: string) => request<Project>(`/projects/${id}`, { method: "DELETE" }),

  getTasks: (params: { projectId?: string; status?: string; priority?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.projectId && params.projectId !== "all") q.set("projectId", params.projectId);
    if (params.status && params.status !== "all") q.set("status", params.status);
    if (params.priority && params.priority !== "all") q.set("priority", params.priority);
    if (params.search) q.set("search", params.search);
    const s = q.toString();
    return request<Task[]>(`/tasks${s ? `?${s}` : ""}`);
  },
  createTask: (d: { projectId: string; title: string; description: string; status: TaskStatus; priority: TaskPriority; assignee: string; dueDate: string }) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(d) }),
  updateTask: (id: string, d: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  updateUser: (id: string, d: { name?: string; email?: string; role?: string; bio?: string; location?: string }) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  updateAvatar: (dataUrl: string) =>
    request<{ url: string; deleteUrl: string; user: User }>("/uploads/avatar", { method: "POST", body: JSON.stringify({ image: dataUrl }) }),
  setTaskStatus: (id: string, status: TaskStatus) =>
    request<Task>(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTask: (id: string) => request<Task>(`/tasks/${id}`, { method: "DELETE" }),

  // Sharing
  shareProject: (id: string, userId: string, access: ProjectAccess) =>
    request<Project>(`/projects/${id}/share`, { method: "POST", body: JSON.stringify({ userId, access }) }),
  unshareProject: (id: string, userId: string) =>
    request<Project>(`/projects/${id}/share/${userId}`, { method: "DELETE" }),

  // Teams
  getTeams: () => request<Team[]>("/teams"),
  getTeam: (id: string) => request<Team & { members: User[] }>(`/teams/${id}`),
  createTeam: (d: { name: string; description: string; memberIds: string[] }) =>
    request<Team & { members: User[] }>("/teams", { method: "POST", body: JSON.stringify(d) }),
  updateTeam: (id: string, d: { name?: string; description?: string }) =>
    request<Team>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  addMember: (id: string, userId: string) =>
    request<Team & { members: User[] }>(`/teams/${id}/members`, { method: "POST", body: JSON.stringify({ userId }) }),
  removeMember: (id: string, userId: string) =>
    request<Team & { members: User[] }>(`/teams/${id}/members/${userId}`, { method: "DELETE" }),
  leaveTeam: (id: string) => request<{ id: string; left: boolean }>(`/teams/${id}/leave`, { method: "POST" }),
  deleteTeam: (id: string) => request<Team>(`/teams/${id}`, { method: "DELETE" }),

  // Temporary team chat (REST, messages auto-delete after 24h)
  chatInbox: () => request<ChatContact[]>("/chat/inbox"),
  chatMessages: (userId: string) => request<{ messages: ChatMessage[] }>(`/chat/${userId}/messages`),
  chatSend: (to: string, text: string) =>
    request<ChatMessage>("/chat/send", { method: "POST", body: JSON.stringify({ to, text }) }),
  chatClear: (userId: string) =>
    request<{ cleared: number }>(`/chat/${userId}/messages`, { method: "DELETE" }),
};

export const apiBase = BASE;
