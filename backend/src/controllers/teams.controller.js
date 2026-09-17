import { isValidObjectId } from "mongoose";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

// members may be populated User docs or raw ObjectIds — normalize before comparing.
const idOf = (m) => String(m?._id ?? m);
const belongs = (team, userId) =>
  String(team.createdBy) === String(userId) ||
  team.members.some((m) => idOf(m) === String(userId));

const getPopulated = async (teamId) => {
  const team = await Team.findById(teamId).populate(
    "members",
    "name email role avatar bio location createdAt updatedAt"
  );
  if (!team) throw ApiError.notFound("Team not found");
  return team;
};

export const listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ $or: [{ createdBy: req.userId }, { members: req.userId }] }).sort({ createdAt: -1 });
  return ok(res, teams);
});

export const createTeam = asyncHandler(async (req, res) => {
  const memberIds = [...new Set([req.userId, ...(req.body.memberIds ?? []).filter(isValidObjectId)])];
  const team = await Team.create({
    name: req.body.name,
    description: req.body.description ?? "",
    members: memberIds,
    createdBy: req.userId,
  });
  return ok(res, await getPopulated(team._id), 201);
});

export const getTeam = asyncHandler(async (req, res) => {
  const team = await getPopulated(req.params.id);
  if (!belongs(team, req.userId)) throw new ApiError(403, "Not a member of this team");
  return ok(res, team);
});

export const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound("Team not found");
  if (String(team.createdBy) !== String(req.userId)) throw new ApiError(403, "Only the team creator can edit it");
  if (req.body.name) team.name = req.body.name;
  if (typeof req.body.description === "string") team.description = req.body.description;
  await team.save();
  return ok(res, await getPopulated(team._id));
});

export const addMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound("Team not found");
  if (String(team.createdBy) !== String(req.userId)) throw new ApiError(403, "Only the team creator can add members");
  const { userId } = req.body;
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid user id");
  if (!(await User.findById(userId))) throw ApiError.notFound("User not found");
  if (!team.members.some((m) => String(m) === String(userId))) team.members.push(userId);
  await team.save();
  return ok(res, await getPopulated(team._id));
});

export const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound("Team not found");
  if (String(team.createdBy) !== String(req.userId)) throw new ApiError(403, "Only the team creator can remove members");
  if (String(req.params.userId) === String(req.userId)) throw ApiError.badRequest("Use delete to remove the team");
  team.members = team.members.filter((m) => String(m) !== String(req.params.userId));
  await team.save();
  return ok(res, await getPopulated(team._id));
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound("Team not found");
  if (!belongs(team, req.userId)) throw new ApiError(403, "Not a member of this team");
  if (String(team.createdBy) === String(req.userId)) throw ApiError.badRequest("Team creator cannot leave — delete the team instead");
  team.members = team.members.filter((m) => String(m) !== String(req.userId));
  await team.save();
  return ok(res, { id: team.id, left: true });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound("Team not found");
  if (String(team.createdBy) !== String(req.userId)) throw new ApiError(403, "Only the team creator can delete it");
  await team.deleteOne();
  return ok(res, team);
});