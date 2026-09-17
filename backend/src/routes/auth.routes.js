import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/http.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
