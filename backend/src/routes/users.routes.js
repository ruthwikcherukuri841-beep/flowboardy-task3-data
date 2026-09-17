import { Router } from "express";
import { createUser, deleteUser, getUser, listUsers, updateUser } from "../controllers/users.controller.js";
import { validate } from "../middlewares/http.js";
import { userCreateSchema, userUpdateSchema } from "../validators/user.schema.js";

export const usersRouter = Router();

usersRouter.get("/", listUsers);
usersRouter.post("/", validate(userCreateSchema), createUser);
usersRouter.get("/:id", getUser);
usersRouter.put("/:id", validate(userUpdateSchema), updateUser);
usersRouter.delete("/:id", deleteUser);
