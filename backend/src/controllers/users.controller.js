import bcrypt from "bcryptjs";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.search ?? "").toString().trim();
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = q
    ? { $or: [
        { name: { $regex: esc, $options: "i" } },
        { email: { $regex: esc, $options: "i" } },
        { role: { $regex: esc, $options: "i" } },
        { location: { $regex: esc, $options: "i" } },
      ] }
    : {};
  return ok(res, await User.find(filter).sort({ name: 1 }));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  return ok(res, user);
});

export const createUser = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email.toLowerCase() });
  if (exists) throw ApiError.conflict("Email is already registered");
  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(req.body.password, 10),
    role: req.body.role,
    avatar: initials(req.body.name),
  });
  return ok(res, user, 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "You can only update your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (req.body.email) {
    const clash = await User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: user.id } });
    if (clash) throw ApiError.conflict("Email is already registered");
    user.email = req.body.email.toLowerCase();
  }
  if (req.body.name) {
    user.name = req.body.name;
    // Keep an uploaded photo; only re-derive initials when no photo is set.
    if (!/^https?:\/\//i.test(user.avatar || "")) user.avatar = initials(req.body.name);
  }
  if (req.body.role) user.role = req.body.role;
  if (typeof req.body.bio === "string") user.bio = req.body.bio;
  if (typeof req.body.location === "string") user.location = req.body.location;
  await user.save();
  return ok(res, user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "You can only delete your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  await user.deleteOne();
  await Task.updateMany({ assignee: user.id }, { $unset: { assignee: "" } });
  await Project.updateMany({ members: user.id }, { $pull: { members: user.id } });
  return ok(res, user);
});
