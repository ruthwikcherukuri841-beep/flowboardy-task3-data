import mongoose from "mongoose";

mongoose.set("strictQuery", true);

// Atlas can answer on all four hosts, so keep the pool small per process.
const DB_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
};

let connecting = null;

/**
 * Connects (once) to MongoDB Atlas. FlowBoard is a persistent product — there
 * is deliberately NO in-memory fallback, so a missing DATABASE_URL fails fast
 * instead of silently losing data on restart.
 */
export async function connectDB(url) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!url) {
    throw new Error(
      "[db] DATABASE_URL is not set — add your MongoDB Atlas connection string to backend/.env (see .env.example)."
    );
  }

  if (!connecting) {
    console.log("[db] connecting to MongoDB Atlas…");
    connecting = mongoose.connect(url, DB_OPTIONS);
    connecting.catch(() => {
      connecting = null; // Clear so a retry starts a fresh connection.
    });
  }

  await connecting;
  return mongoose.connection;
}

/**
 * Boots the server only after the database answers, retrying with backoff so a
 * brief Atlas hiccup during local startup neither crashes nor starves the app.
 */
export async function connectWithRetry(url, { attempts = 5, baseMs = 800 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await connectDB(url);
      console.log(`[db] connected to ${connection.host}/${connection.name}`);
      return connection;
    } catch (err) {
      const wait = baseMs * 2 ** (attempt - 1);
      if (attempt === attempts) throw err;
      console.warn(`[db] attempt ${attempt}/${attempts} failed (${err.message}) — retrying in ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw new Error("[db] could not connect within the retry budget");
}

export function closeDB() {
  return mongoose.connection.close();
}