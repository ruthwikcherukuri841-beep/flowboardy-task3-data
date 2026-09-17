import { z } from "zod";

export const teamCreateSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters"),
  description: z.string().max(500).optional().default(""),
  memberIds: z.array(z.string().min(1)).optional().default([]),
}).strict();

export const teamUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional(),
}).strict().refine((o) => Object.keys(o).length > 0, { message: "at least one field is required" });

export const teamMemberSchema = z.object({
  userId: z.string().min(1, "userId is required"),
}).strict();