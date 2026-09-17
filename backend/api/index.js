// Vercel serverless entry — same Express app, persistent MongoDB via DATABASE_URL.
// `vercel.json` rewrites every request here; Express still sees the original path.
import { createApp } from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";

const app = createApp();
let ready = false;

export default async function handler(req, res) {
  if (!ready) {
    await connectDB(env.databaseUrl);
    ready = true;
  }
  return app(req, res);
}
