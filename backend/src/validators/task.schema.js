import { z } from "zod";

const status = z.enum(["todo", "in-progress", "review", "done"]);
const priority = z.enum(["low", "medium", "high"]);

export const taskCreateSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  title: z.string().min(3, "title must be at least 3 characters"),
  description: z.string().optional().default(""),
  status: status.optional().default("todo"),
  priority: priority.optional().default("medium"),
  assignee: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").optional(),
}).strict();

export const taskUpdateSchema = z.object({
  projectId: z.string().min(1).optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: status.optional(),
  priority: priority.optional(),
  assignee: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").optional(),
}).strict().refine((o) => Object.keys(o).length > 0, { message: "at least one field is required" });

export const taskStatusSchema = z.object({ status }).strict();
