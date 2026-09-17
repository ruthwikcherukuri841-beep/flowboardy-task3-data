// Live directory of users and projects, filled from the REST API at boot.
// Components resolve names through here; only real API records are ever shown.
import type { Project, User } from "../types";

let users: User[] = [];
let projects: Project[] = [];

export function setDirectory(u: User[], p: Project[]) {
  users = u;
  projects = p;
}

const ghostUser = (id: string): User => ({
  id,
  name: "Unknown member",
  email: "",
  avatar: "?",
  role: "Member",
});

const ghostProject = (id: string): Project => ({
  id,
  title: "Unknown project",
  description: "",
  status: "active",
  progress: 0,
  dueDate: "",
  members: [],
  createdAt: "",
});

export function userById(id: string | undefined): User {
  if (!id) return ghostUser("?");
  return users.find((u) => u.id === id) ?? ghostUser(id);
}

export function projectById(id: string | undefined): Project {
  if (!id) return ghostProject("?");
  return projects.find((p) => p.id === id) ?? ghostProject(id);
}
