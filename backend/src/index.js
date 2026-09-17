import { createApp } from "./app.js";
import { closeDB, connectWithRetry } from "./config/db.js";
import { env } from "./config/env.js";

const connection = await connectWithRetry(env.databaseUrl);

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`FlowBoard API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  console.log(`FlowBoard storage ready — ${connection.host}/${connection.name} (persistent)`);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[db] ${signal} received — closing server and connection…`);
  server.close(async () => {
    try {
      await closeDB();
      console.log("[db] connection closed cleanly. Bye.");
      process.exit(0);
    } catch (err) {
      console.error("[db] error during shutdown:", err.message);
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));