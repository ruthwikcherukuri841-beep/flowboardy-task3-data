import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const sign = (userId) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const register = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email.toLowerCase() });
  if (exists) throw ApiError.conflict("Email is already registered");
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    passwordHash,
    role: req.body.role,
    avatar: initials(req.body.name),
  });
  return ok(res, { token: sign(user.id), user: user.toJSON() }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");
  const valid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");
  const safe = user.toJSON();
  delete safe.passwordHash;
  return ok(res, { token: sign(user.id), user: safe });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  return ok(res, user);
});

export const logout = asyncHandler(async (_req, res) => ok(res, { message: "Signed out" }));
