import { Router } from "express";
import {
  addMember, createTeam, deleteTeam, getTeam, leaveTeam, listTeams, removeMember, updateTeam,
} from "../controllers/teams.controller.js";
import { validate } from "../middlewares/http.js";
import { teamCreateSchema, teamMemberSchema, teamUpdateSchema } from "../validators/team.schema.js";

export const teamsRouter = Router();

teamsRouter.get("/", listTeams);
teamsRouter.post("/", validate(teamCreateSchema), createTeam);
teamsRouter.get("/:id", getTeam);
teamsRouter.put("/:id", validate(teamUpdateSchema), updateTeam);
teamsRouter.post("/:id/members", validate(teamMemberSchema), addMember);
teamsRouter.delete("/:id/members/:userId", removeMember);
teamsRouter.post("/:id/leave", leaveTeam);
teamsRouter.delete("/:id", deleteTeam);