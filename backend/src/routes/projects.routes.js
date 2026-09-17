import { Router } from "express";
import {
  createProject, deleteProject, getProject, listProjects, shareProject, unshareProject, updateProject,
} from "../controllers/projects.controller.js";
import { validate } from "../middlewares/http.js";
import { projectCreateSchema, projectShareSchema, projectUpdateSchema } from "../validators/project.schema.js";

export const projectsRouter = Router();

projectsRouter.get("/", listProjects);
projectsRouter.post("/", validate(projectCreateSchema), createProject);
projectsRouter.get("/:id", getProject);
projectsRouter.put("/:id", validate(projectUpdateSchema), updateProject);
projectsRouter.delete("/:id", deleteProject);
projectsRouter.post("/:id/share", validate(projectShareSchema), shareProject);
projectsRouter.delete("/:id/share/:userId", unshareProject);
