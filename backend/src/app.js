import cors from "cors";
import express from "express";
import morgan from "morgan";
import { requireAuth } from "./middlewares/auth.js";
import { errorHandler, notFound } from "./middlewares/http.js";
import { authRouter } from "./routes/auth.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { systemRouter } from "./routes/system.routes.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { teamsRouter } from "./routes/teams.routes.js";
import { uploadsRouter } from "./routes/uploads.routes.js";
import { usersRouter } from "./routes/users.routes.js";

const API_ENDPOINTS = [
  { method: "POST", path: "/api/auth/register", note: "Create an account" },
  { method: "POST", path: "/api/auth/login", note: "Sign in, returns a Bearer token" },
  { method: "GET", path: "/api/auth/me", note: "Current member (profile + avatar)" },
  { method: "GET", path: "/api/users", note: "Member directory, ?search= by name/email/role/location" },
  { method: "GET/PUT/DELETE", path: "/api/users/:id", note: "View, update or delete a profile" },
  { method: "GET", path: "/api/projects", note: "Projects you own or are shared with, ?search=&status=" },
  { method: "POST", path: "/api/projects", note: "Create a project" },
  { method: "GET/PUT/DELETE", path: "/api/projects/:id", note: "Project detail (with tasks) / update / delete" },
  { method: "POST", path: "/api/projects/:id/share", note: "Share with a teammate: view | review | edit" },
  { method: "DELETE", path: "/api/projects/:id/share/:userId", note: "Stop sharing" },
  { method: "GET", path: "/api/tasks", note: "Tasks, ?projectId=&status=&priority=&search=" },
  { method: "POST", path: "/api/tasks", note: "Create a task (owner only)" },
  { method: "GET/PUT/DELETE", path: "/api/tasks/:id", note: "Task detail / edit / delete (owner only)" },
  { method: "PATCH", path: "/api/tasks/:id/status", note: "Move status (owner/edit any; review up to 'review')" },
  { method: "GET/POST/PUT/DELETE", path: "/api/teams", note: "Teams CRUD" },
  { method: "POST", path: "/api/teams/:id/members", note: "Add a member to a team" },
  { method: "DELETE", path: "/api/teams/:id/members/:userId", note: "Remove a team member" },
  { method: "POST", path: "/api/teams/:id/leave", note: "Leave a team" },
  { method: "POST", path: "/api/uploads/avatar", note: "Upload a profile photo (base64 data URL → imgbb CDN)" },
  { method: "GET", path: "/api/chat/inbox", note: "Conversations with unread counts" },
  { method: "POST", path: "/api/chat/send", note: "Send a temporary teammate message (auto-deletes in 24h)" },
  { method: "GET", path: "/api/chat/:userId/messages", note: "Message thread with one teammate" },
  { method: "DELETE", path: "/api/chat/:userId/messages", note: "Clear the conversation" },
  { method: "GET", path: "/api/system/storage", note: "Storage health — connection, per-collection counts & indexes" },
];

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));
  app.use(morgan("tiny"));

  app.get("/", (_req, res) => res.json({
    success: true,
    data: {
      name: "FlowBoard Unified API",
      version: "1.2.0",
      service: "flowboard-api",
      base: "/api",
      auth: "Send a Bearer token (from /api/auth/login) on every /api/* request except /api/auth",
      resources: API_ENDPOINTS,
    },
  }));
  // On Vercel the platform intercepts the root path (index normalization), so the
  // machine-readable unified API index lives at /api where the function is reached.
  app.get("/api", (_req, res) => res.json({
    success: true,
    data: {
      name: "FlowBoard Unified API",
      version: "1.2.0",
      service: "flowboard-api",
      base: "/api",
      auth: "Send a Bearer token (from /api/auth/login) on every /api/* request except /api/auth",
      resources: API_ENDPOINTS,
    },
  }));
  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok", service: "flowboard-api" } }));

  // Public: sign up / sign in. Everything else needs a Bearer token.
  app.use("/api/auth", authRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api/projects", requireAuth, projectsRouter);
  app.use("/api/tasks", requireAuth, tasksRouter);
  app.use("/api/teams", requireAuth, teamsRouter);
  app.use("/api/chat", requireAuth, chatRouter);
  // Avatar uploads carry base64 images — allow a larger request body here only.
  app.use("/api/uploads", requireAuth, express.json({ limit: "12mb" }), uploadsRouter);
  app.use("/api/system", requireAuth, systemRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
