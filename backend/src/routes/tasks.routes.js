import { Router } from "express";
import { createTask, deleteTask, getTask, listTasks, updateTask, updateTaskStatus } from "../controllers/tasks.controller.js";
import { validate } from "../middlewares/http.js";
import { taskCreateSchema, taskStatusSchema, taskUpdateSchema } from "../validators/task.schema.js";

export const tasksRouter = Router();

tasksRouter.get("/", listTasks);
tasksRouter.post("/", validate(taskCreateSchema), createTask);
tasksRouter.get("/:id", getTask);
tasksRouter.put("/:id", validate(taskUpdateSchema), updateTask);
tasksRouter.patch("/:id/status", validate(taskStatusSchema), updateTaskStatus);
tasksRouter.delete("/:id", deleteTask);
