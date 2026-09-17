import { isValidObjectId } from "mongoose";
import { ChatMessage } from "../models/ChatMessage.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const CHAT_TTL_MS = 24 * 60 * 60 * 1000;

// Send a direct message to a teammate. The conversation is created implicitly
// and every message self-destructs after 24 hours (temporary chat).
export const sendMessage = asyncHandler(async (req, res) => {
  const { to, text } = req.body;
  if (!isValidObjectId(to)) throw ApiError.badRequest("Invalid recipient id");
  if (to === req.userId) throw ApiError.badRequest("You can't message yourself");
  const recipient = await User.findById(to);
  if (!recipient) throw ApiError.notFound("That member doesn't exist");

  const msg = await ChatMessage.create({
    from: req.userId,
    to,
    text,
    seen: false,
    expiresAt: new Date(Date.now() + CHAT_TTL_MS),
  });
  return ok(res, msg, 201);
});

// Conversations I'm part of: one entry per teammate, newest activity first.
export const listInbox = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ $or: [{ from: req.userId }, { to: req.userId }] }).sort({ createdAt: -1 });

  const byTeammate = new Map();
  for (const m of messages) {
    const other = String(m.from) === req.userId ? String(m.to) : String(m.from);
    let entry = byTeammate.get(other);
    if (!entry) {
      entry = { user: other, lastMessage: "", lastAt: m.createdAt, unread: 0 };
      byTeammate.set(other, entry);
    }
    if (m.text && !entry.lastMessage) entry.lastMessage = m.text;
    if (String(m.to) === req.userId && !m.seen) entry.unread += 1;
  }

  const others = await User.find({ _id: { $in: Array.from(byTeammate.keys()) } });
  const roster = new Map(others.map((u) => [String(u._id), u]));

  const inbox = Array.from(byTeammate.values())
    .filter((e) => roster.has(e.user))
    .map((e) => {
      const u = roster.get(e.user);
      return {
        user: u,
        lastMessage: e.lastMessage,
        lastAt: e.lastAt,
        unread: e.unread,
      };
    })
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  return ok(res, inbox);
});

// Full thread with one teammate (temporary room), and mark mine as seen.
export const listMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid member id");
  if (userId === req.userId) throw ApiError.badRequest("Invalid member id");
  const other = await User.findById(userId);
  if (!other) throw ApiError.notFound("That member doesn't exist");

  const messages = await ChatMessage.find({
    $or: [
      { from: req.userId, to: userId },
      { from: userId, to: req.userId },
    ],
  }).sort({ createdAt: 1 });

  await ChatMessage.updateMany({ from: userId, to: req.userId, seen: false }, { seen: true });
  return ok(res, { messages, unread: messages.filter((m) => String(m.to) === req.userId && !m.seen).length });
});

// Close the temporary room: drop every message between me and a teammate.
export const clearConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid member id");
  const deleted = await ChatMessage.deleteMany({
    $or: [
      { from: req.userId, to: userId },
      { from: userId, to: req.userId },
    ],
  });
  return ok(res, { cleared: deleted.deletedCount ?? 0 });
});