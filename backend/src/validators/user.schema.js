import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters"),
  email: z.string().email("email must be a valid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.string().min(2).optional().default("Member"),
}).strict();

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().min(2).optional(),
  bio: z.string().max(220).optional(),
  location: z.string().max(80).optional(),
}).strict().refine((o) => Object.keys(o).length > 0, { message: "at least one field is required" });
