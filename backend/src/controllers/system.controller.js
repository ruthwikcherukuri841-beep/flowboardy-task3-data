import mongoose from "mongoose";
import { ChatMessage } from "../models/ChatMessage.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

const COLLECTIONS = [
  { name: "users", model: User },
  { name: "projects", model: Project },
  { name: "tasks", model: Task },
  { name: "teams", model: Team },
  { name: "chatmessages", model: ChatMessage },
];

// GET /api/system/storage — live storage health: connection, host, per-collection
// document counts and created indexes (unique + TTL). Requires a Bearer token.
export async function storageInfo(_req, res, next) {
  try {
    const connection = mongoose.connection;
    const db = connection.db;

    const collections = [];
    for (const { name, model } of COLLECTIONS) {
      const [count, indexes] = await Promise.all([
        model.countDocuments(),
        db.collection(name).indexes().catch(() => []),
      ]);
      collections.push({
        name,
        documents: count,
        indexes: indexes.map((idx) => ({
          name: idx.name,
          keys: Object.keys(idx.key),
          unique: Boolean(idx.unique),
          expiresAfterSeconds: idx.expireAfterSeconds ?? null,
        })),
      });
    }

    res.json({
      success: true,
      data: {
        status: connection.readyState === 1 ? "connected" : "disconnected",
        provider: "MongoDB Atlas",
        host: connection.host,
        database: connection.name,
        persistence: "restart-safe (managed Atlas cluster)",
        collections,
      },
    });
  } catch (err) {
    next(err);
  }
}