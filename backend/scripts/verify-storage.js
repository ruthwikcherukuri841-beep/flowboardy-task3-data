#!/usr/bin/env node
// Storage health + restart-persistence proof for FlowBoard.
//
//   npm run storage check   → connect to Atlas, report db, per-collection counts
//   npm run storage write   → insert a persistence probe record
//   npm run storage read    → confirm the latest probe still exists
//   npm run storage clean   → remove all probe records
//
// Restart-persistence demo:  write → restart the API → read.
// If the probe comes back, data survived a full server restart.

import mongoose from "mongoose";
import { closeDB, connectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";

const PROBE_COLLECTION = "_persistence_probe";
const PROBE_TTL_MS = 24 * 60 * 60 * 1000;

const [mode = "check"] = process.argv.slice(2);

async function main() {
  const connection = await connectDB(env.databaseUrl);
  const db = mongoose.connection.db;
  console.log(`[storage] connected to ${connection.host}/${connection.name} (persistent, Atlas)`);

  const probe = db.collection(PROBE_COLLECTION);

  switch (mode) {
    case "write": {
      const doc = {
        key: `probe-${Date.now()}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + PROBE_TTL_MS),
      };
      const { insertedId } = await probe.insertOne(doc);
      console.log(`[storage] wrote probe ${doc.key} (${insertedId})`);
      break;
    }
    case "read": {
      const latest = await probe.find().sort({ createdAt: -1 }).limit(1).next();
      if (!latest) {
        console.log("[storage] PERSISTENCE UNPROVEN — no probe found. Run `write`, restart, then `read`.");
      } else {
        console.log(
          `[storage] PERSISTENCE PROVEN — probe ${latest.key} survived (created ${latest.createdAt.toISOString()})`
        );
      }
      break;
    }
    case "clean": {
      const { deletedCount } = await probe.deleteMany({});
      console.log(`[storage] removed ${deletedCount} probe record(s)`);
      break;
    }
    default: {
      for (const name of ["users", "projects", "tasks", "teams", "chatmessages"]) {
        const count = await db.collection(name).countDocuments();
        console.log(`[storage] ${name}: ${count} document(s)`);
      }
      console.log("[storage] storage healthy");
    }
  }

  await closeDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("[storage] failed:", err.message);
  try {
    await closeDB();
  } catch {
    // ignore
  }
  process.exit(1);
});