import { Router } from "express";
import { storageInfo } from "../controllers/system.controller.js";

export const systemRouter = Router();

systemRouter.get("/storage", storageInfo);