import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters"),
  email: z.string().email("email must be a valid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.string().min(2).optional().default("Member"),
}).strict();

export const loginSchema = z.object({
  email: z.string().email("email must be a valid email"),
  password: z.string().min(1, "password is required"),
}).strict();
