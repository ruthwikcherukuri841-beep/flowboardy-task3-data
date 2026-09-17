import { z } from "zod";

const base = {
  title: z.string().min(3, "title must be at least 3 characters"),
  description: z.string().optional().default(""),
  status: z.enum(["active", "completed", "on-hold"]).optional().default("active"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").optional(),
  members: z.array(z.string()).optional().default([]),
};

export const projectCreateSchema = z.object(base).strict();

export const projectUpdateSchema = z.object({
  title: base.title.optional(),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on-hold"]).optional(),
  dueDate: base.dueDate,
  progress: z.number().min(0).max(100).optional(),
  members: z.array(z.string()).optional(),
}).strict().refine((o) => Object.keys(o).length > 0, { message: "at least one field is required" });

export const projectShareSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  access: z.enum(["view", "review", "edit"]).default("view"),
}).strict();
