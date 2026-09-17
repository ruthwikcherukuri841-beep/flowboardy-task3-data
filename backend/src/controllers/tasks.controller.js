import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const REVIEWABLE = new Set(["todo", "in-progress", "review"]);

// Resolve the caller's access ("owner" | "edit" | "review" | "view" | null)
// for a task's project. Reads are allowed for anyone shared (view/review/edit).
const projectAccess = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (String(project.createdBy) === String(userId)) return "owner";
  const entry = project.sharedWith.find((s) => String(s.user) === String(userId));
  return entry ? entry.access : null;
};

const accessibleProjectIds = async (userId) => {
  const projects = await Project.find({ $or: [{ createdBy: userId }, { "sharedWith.user": userId }] }).select("_id");
  return projects.map((p) => p._id);
};

const getTaskWithAccess = async (userId, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return { task: null, access: null };
  return { task, access: await projectAccess(userId, task.projectId) };
};

const refreshProgress = async (projectId) => {
  const total = await Task.countDocuments({ projectId });
  const done = await Task.countDocuments({ projectId, status: "done" });
  await Project.findByIdAndUpdate(projectId, {
    progress: total ? Math.round((done / total) * 100) : 0,
  });
};

export const listTasks = asyncHandler(async (req, res) => {
  const { projectId, status, priority, search = "" } = req.query;
  const visibleProjects = await accessibleProjectIds(req.userId);
  if (visibleProjects.length === 0) return ok(res, []);
  const filter = { projectId: { $in: visibleProjects } };
  if (projectId) {
    if (!visibleProjects.some((p) => String(p) === String(projectId))) throw ApiError.notFound("Project not found");
    filter.projectId = projectId;
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    const q = String(search);
    filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
  }
  return ok(res, await Task.find(filter).sort({ createdAt: -1 }));
});

export const getTask = asyncHandler(async (req, res) => {
  const { task, access } = await getTaskWithAccess(req.userId, req.params.id);
  if (!task || !access) throw ApiError.notFound("Task not found");
  return ok(res, task);
});

export const createTask = asyncHandler(async (req, res) => {
  const access = await projectAccess(req.userId, req.body.projectId);
  if (access !== "owner") throw ApiError.forbidden("Only the project owner can add tasks");
  if (req.body.assignee && !(await User.exists({ _id: req.body.assignee }))) {
    throw ApiError.badRequest(`Unknown assignee: ${req.body.assignee}`);
  }
  const task = await Task.create({
    projectId: req.body.projectId,
    title: req.body.title,
    description: req.body.description ?? "",
    status: req.body.status ?? "todo",
    priority: req.body.priority ?? "medium",
    assignee: req.body.assignee,
    dueDate: req.body.dueDate ?? "",
  });
  await refreshProgress(task.projectId);
  return ok(res, task, 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const { task, access } = await getTaskWithAccess(req.userId, req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  if (access !== "owner") throw ApiError.forbidden("Only the project owner can edit this task");
  if (req.body.assignee && !(await User.exists({ _id: req.body.assignee }))) {
    throw ApiError.badRequest(`Unknown assignee: ${req.body.assignee}`);
  }
  const oldProject = task.projectId.toString();
  for (const k of ["projectId", "title", "description", "priority", "assignee", "dueDate"]) {
    if (req.body[k] !== undefined) task[k] = req.body[k];
  }
  await task.save();
  await refreshProgress(oldProject);
  await refreshProgress(task.projectId);
  return ok(res, task);
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { task, access } = await getTaskWithAccess(req.userId, req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  const next = req.body.status;
  if (access === "owner" || access === "edit") {
    task.status = next;
  } else if (access === "review") {
    if (!REVIEWABLE.has(next)) throw ApiError.forbidden("Reviewers can tick for review but only the owner marks tasks completed");
    task.status = next;
  } else {
    throw ApiError.forbidden("You have view-only access to this project");
  }
  await task.save();
  await refreshProgress(task.projectId);
  return ok(res, task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { task, access } = await getTaskWithAccess(req.userId, req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  if (access !== "owner") throw ApiError.forbidden("Only the project owner can delete tasks");
  const projectId = task.projectId;
  await task.deleteOne();
  await refreshProgress(projectId);
  return ok(res, task);
});