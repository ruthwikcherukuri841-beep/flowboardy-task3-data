import { Router } from "express";
import { uploadAvatar } from "../controllers/uploads.controller.js";
import { validate } from "../middlewares/http.js";
import { z } from "zod";

const avatarSchema = z.object({
  image: z.string().min(32, "image is required").max(9_000_000),
}).strict();

export const uploadsRouter = Router();

uploadsRouter.post("/avatar", validate(avatarSchema), uploadAvatar);