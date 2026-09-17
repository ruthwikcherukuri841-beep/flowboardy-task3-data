# FlowBoard

**Focus. Track. Ship.**

FlowBoard is a full-stack project & task management platform: a React + TypeScript dashboard talking to a Node/Express REST API, with every piece of data persisted on a managed **MongoDB Atlas** cluster. This repository contains both the frontend and the backend plus the complete persistent data layer that powers them.

There is **zero mock data** — nothing is fabricated, nothing is seeded. Everything you read back over the API is real data you created, stored in MongoDB.

---

## Contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [How we manage storage](#how-we-manage-storage)
- [REST API](#rest-api)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Data maintenance](#data-maintenance)
- [License](#license)

---

## Highlights

- **Persistent, restart-safe data layer** — MongoDB Atlas; a server restart never loses data.
- **Two-layer validation** — Zod at the API boundary *and* Mongoose schema rules (required, minlength, unique, enums, refs) at the database.
- **Real relationships** — users → projects (member / creator), projects → tasks (cascade delete), users → tasks (assignee), teams, temporary chat.
- **Storage management built in** — a live `GET /api/system/storage` endpoint (connection, per-collection counts, indexes) and an `npm run storage` CLI that proves restart persistence.
- **Access-controlled sharing** — share projects at `view | review | edit`, enforced server-side on every read/write.
- **Auth + profiles** — JWT (7-day) + bcrypt-hashed passwords, avatar uploads via the imgbb CDN.
- **Temporary team chat** — messages auto-delete after 24h via a MongoDB TTL index (privacy by default).

## Architecture

```
 ┌──────────────┐        HTTPS / JSON        ┌───────────────────┐
 │   Frontend   │ ─────────────────────────▶ │     REST API      │
 │ React + Vite │ ◀───────────────────────── │ Express + Zod     │
 │  + Tailwind  │   200 / 201 / 4xx / 5xx    │   (Node.js)       │
 └──────────────┘                            └────────┬──────────┘
                                                      │ Mongoose ODM
                                                      ▼
                                              ┌───────────────────┐
                                              │  MongoDB Atlas    │
                                              │ managed cluster    │
                                              │  (db: flowboard)   │
                                              └───────────────────┘
```

## Stack

| Layer | Choice |
| ----- | ------ |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS |
| Backend | Node.js · Express · Zod · dotenv · cors · morgan |
| Data | **MongoDB + Mongoose** · MongoDB Atlas (managed) |
| Auth | bcryptjs · jsonwebtoken |
| Deploy | Vercel (frontend + serverless API) · Atlas (DB) |

## Repository layout

```
flowboard-task-3-data/
├── frontend/                  React dashboard (see frontend/README.md)
│   ├── src/                   screens, components, services (REST client)
│   └── .env.example           VITE_API_URL
└── backend/                   REST API — the persistent data layer
    ├── src/
    │   ├── config/            env.js (PORT, DATABASE_URL, JWT_SECRET, IMGBB_KEY), db.js (Mongoose connect)
    │   ├── models/            Mongoose schemas: User, Project, Task, Team, ChatMessage
    │   ├── controllers/       auth, users, projects, tasks, teams, chat, uploads, system
    │   ├── validators/        Zod schemas for every write operation
    │   ├── routes/            one router per resource, mounted under /api
    │   ├── middlewares/       requireAuth (JWT), http (validate / notFound / errorHandler)
    │   └── app.js             Express wiring, unified API index, /health
    ├── api/index.js           Vercel serverless entry
    ├── scripts/               verify-storage.js (storage CLI)
    ├── postman_collection.json
    ├── vercel.json
    ├── .env.example
    └── README.md              full endpoint contract
```

## Quick start

### 1. Provision the database (once)

Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user, and copy the connection string. It looks like:

```
mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # then paste your real DATABASE_URL into .env
npm install
npm run dev                   # http://localhost:5000
```

`GET http://localhost:5000/api` lists every endpoint. The API will not start without `DATABASE_URL` — FlowBoard is a persistent product, there is no in-memory fallback.

### 3. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

## How we manage storage

### Provider: MongoDB Atlas (managed)

FlowBoard uses a **MongoDB Atlas free-tier cluster**. The database is managed infrastructure — Atlas handles replication, failover, and automated cloud backups, so a server crash or redeploy loses nothing.

- Connection string comes **only** from `DATABASE_URL` in `backend/.env` — never hard-coded and never committed.
- Default database: `flowboard` (auto-created on first write).

### Connection management (`backend/src/config/db.js`)

- **Env-driven, no fallback.** If `DATABASE_URL` is missing the server fails fast with a clear message instead of silently swapping in an in-memory database.
- **Single shared connection.** `connectDB()` returns the same Mongoose connection on every call (important for Vercel's serverless reuse).
- **Boot retry with backoff.** `connectWithRetry()` retries up to 5× (0.8s → doubling) so a brief Atlas hiccup during local startup doesn't crash development.
- **Tuned pool.** `maxPoolSize: 10`, `minPoolSize: 1`, `serverSelectionTimeoutMS: 8000`, `connectTimeoutMS: 10000` — small per-process pool, fast failure, `retryWrites: true`.
- **Graceful shutdown.** `SIGINT` / `SIGTERM` close the HTTP server and the connection cleanly (no orphaned sockets, no half-written work).

### Schema & relationships

```text
 User ──1•── * Project     as createdBy / members / sharedWith.user
 Project ──1•── * Task      projectId (FK) — deleting a project cascades to its tasks
 User ──1•── * Task         assignee (FK)
 Team ──1•── * User         memberIds
 User ──1•── * ChatMessage  from / to — expires after 24h (TTL)
```

| Collection | Purpose | Key fields |
| ---------- | ------- | ---------- |
| `users` | accounts & profiles | name, email *(unique)*, passwordHash, role, avatar |
| `projects` | workspaces | title, status, progress, createdBy, members, sharedWith |
| `tasks` | work items | projectId, title, status, priority, assignee |
| `teams` | collaboration groups | name, description, memberIds |
| `chatmessages` | temporary DMs | from, to, text, seen, expiresAt *(TTL)* |

Every schema uses `timestamps: true` (`createdAt` / `updatedAt`) and emits a clean JSON variant: `id` instead of `_id`, `versionKey` off, `passwordHash` never serialized.

### Two-layer validation

1. **API layer** — Zod schemas validate every write (required fields, lengths, enums, types) → `400` with field details.
2. **Database layer** — Mongoose re-enforces everything even if the API layer is bypassed:
   - `required` + `minlength` on `name`, `title`, … → rejected at schema level
   - `unique` on `email` → duplicate registration → `409`
   - `enum` on task/project `status` and `priority` → invalid values rejected before any write
   - `ref` checks on `projectId`, `createdBy`, `members`, `assignee`
   - invalid `ObjectId` → `404`/`400` via the error handler; duplicate keys → `409`

### Indexes

Query performance and data rules are baked into the schema:

| Collection | Index | Why |
| ---------- | ----- | --- |
| `users` | `email` **(unique)** | uniqueness constraint + fast sign-in lookup |
| `projects` | `createdBy` | "my projects" list | 
| `projects` | `sharedWith.user` | "shared with me" list + access checks |
| `tasks` | `projectId` | board view (`GET /api/tasks?projectId=`) |
| `tasks` | `status`, `assignee` | filters and assignee queries |
| `chatmessages` | `expiresAt` **(TTL)** | automates the 24h retention policy |

You can inspect real live indexes any time: `GET /api/system/storage` reports each collection's index keys, uniqueness, and TTL.

### Cascades & cleanup

- Deleting a project deletes its tasks (`Task.deleteMany({ projectId })`) in the same request.
- Chat messages self-expire after 24 hours thanks to the TTL index — no cron, no manual cleanup.

### Persistence guarantees

- Server restart / redeploy **never** loses data (verified: the CLI writes a probe, the server restarts, the probe is read back).
- Atlas handles replication + cloud backups; the free tier gives automated snapshots.
- Retention policy: everything is permanent except chat (24h) — by design.

### Watching storage in action

```bash
cd backend
npm run storage check   # connection + per-collection document counts
npm run storage write   # insert a persistence probe
npm run storage read    # prove a probe survived a restart
npm run storage clean   # remove all probes
```

Authenticated HTTP inspection: `GET /api/system/storage` → `{ status, provider, host, database, collections: [{ name, documents, indexes }] }`.

### Configuration & secrets

- All configuration flows through `backend/.env` (gitignored).
- `.env.example` ships placeholders only — real values never enter the repo.
- `passwordHash` is never serialized; JWT `Secret` comes from env.

## REST API

One unified API serves everything. See [`backend/README.md`](backend/README.md) for the complete contract (endpoints, bodies, error codes, access matrix).

- `GET /api` — unified index of all 24 endpoints
- `GET /health` — service status
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Resources: users · projects (+share) · tasks · teams · chat · uploads · system/storage

Import `backend/postman_collection.json` into Postman (all requests + auth documented).

## Scripts

| Where | Command | What it does |
| ----- | ------- | ------------ |
| `backend/` | `npm run dev` | run API with watch → `:5000` |
| `backend/` | `npm run start` | run API (no watch) |
| `backend/` | `npm run storage` | storage CLI (check / write / read / clean) |
| `frontend/` | `npm run dev` | Vite dev server → `:5173` |
| `frontend/` | `npm run build` | typecheck + production build |

## Deployment

1. **API** — push the `backend/` folder to Vercel (or any Node host). Required env vars: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`; optional `IMGBB_KEY`. `vercel.json` already routes `/` → `/api` and rewrites everything else to the serverless entry.
2. **Frontend** — deploy the `frontend/` folder to Vercel with `VITE_API_URL` set to your deployed API (`https://<your-api>.vercel.app/api`).
3. **Database** — stays on Atlas; nothing to deploy.

## Data maintenance

- `npm run storage clean` — remove persistence probes.
- `npm run storage check` — see current usage at a glance.
- Drop/reset: delete collections via Atlas UI or `mongosh` — the API re-creates them on first write (schema-driven, no migrations).

## License

MIT