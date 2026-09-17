import { z } from "zod";

export const chatSendSchema = z.object({
  to: z.string().min(1, "recipient is required"),
  text: z.string().min(1, "message cannot be empty").max(2000, "message is too long"),
}).strict();