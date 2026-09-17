import { isValidObjectId } from "mongoose";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const assertMembers = async (members = []) => {
  for (const m of members) {
    if (!(await User.exists({ _id: m }))) throw ApiError.badRequest(`Unknown member: ${m}`);
  }
};

// Find a project the caller can see (owns it or is shared with them).
const assertAccessible = async (req, withTasks = false) => {
  const project = await Project.findOne({
    _id: req.params.id,
    $or: [{ createdBy: req.userId }, { "sharedWith.user": req.userId }],
  });
  if (!project) throw ApiError.notFound("Project not found");
  if (!withTasks) return project;
  const tasks = await Task.find({ projectId: project.id }).sort({ createdAt: -1 });
  return { project, tasks };
};

export const listProjects = asyncHandler(async (req, res) => {
  const { search = "", status } = req.query;
  const filter = { $or: [{ createdBy: req.userId }, { "sharedWith.user": req.userId }] };
  if (status) filter.status = status;
  if (search) {
    const q = String(search);
    filter.$and = [{ $or: [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }] }];
  }
  return ok(res, await Project.find(filter).sort({ createdAt: -1 }));
});

export const getProject = asyncHandler(async (req, res) => {
  const { project, tasks } = await assertAccessible(req, true);
  return ok(res, { ...project.toJSON(), tasks });
});

export const createProject = asyncHandler(async (req, res) => {
  await assertMembers(req.body.members);
  const project = await Project.create({
    title: req.body.title,
    description: req.body.description ?? "",
    status: req.body.status ?? "active",
    dueDate: req.body.dueDate ?? "",
    members: req.body.members ?? [],
    createdBy: req.userId,
  });
  return ok(res, project, 201);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, createdBy: req.userId });
  if (!project) throw ApiError.notFound("Project not found");
  if (req.body.members) await assertMembers(req.body.members);
  for (const k of ["title", "description", "status", "dueDate", "progress", "members"]) {
    if (req.body[k] !== undefined) project[k] = req.body[k];
  }
  await project.save();
  return ok(res, project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, createdBy: req.userId });
  if (!project) throw ApiError.notFound("Project not found");
  await Task.deleteMany({ projectId: project.id });
  await project.deleteOne();
  return ok(res, project);
});

// Share a project with a teammate (owner only). Upserts their access level
// and keeps the legacy `members` list in sync.
export const shareProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, createdBy: req.userId });
  if (!project) throw ApiError.notFound("Project not found");
  const { userId, access } = req.body;
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid user id");
  if (userId === String(req.userId)) throw ApiError.badRequest("You already own this project");
  const target = await User.findById(userId);
  if (!target) throw ApiError.notFound("User not found");

  const entry = project.sharedWith.find((s) => String(s.user) === String(userId));
  if (entry) entry.access = access;
  else project.sharedWith.push({ user: userId, access });
  if (!project.members.some((m) => String(m) === String(userId))) project.members.push(userId);
  await project.save();
  return ok(res, await assertAccessible(req));
});

export const unshareProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, createdBy: req.userId });
  if (!project) throw ApiError.notFound("Project not found");
  const { userId } = req.params;
  project.sharedWith = project.sharedWith.filter((s) => String(s.user) !== String(userId));
  project.members = project.members.filter((m) => String(m) !== String(userId));
  await project.save();
  return ok(res, await assertAccessible(req));
});