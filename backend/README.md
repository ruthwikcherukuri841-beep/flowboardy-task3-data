# FlowBoard API — complete endpoint contract

Express + Zod + Mongoose REST API on a **persistent MongoDB Atlas** data layer. There is no in-memory fallback: the server requires `DATABASE_URL` and never loses data on restart.

## Quick start

```bash
cd backend
cp .env.example .env        # paste your real DATABASE_URL (see "Storage")
npm install
npm run dev                 # http://localhost:5000
```

`DATABASE_URL` must point at a MongoDB Atlas cluster (e.g. `mongodb+srv://<user>:<password>@<cluster>/flowboard`).

## Base URLs

- **Production (live):** `https://flowboardy-api.vercel.app/api`
- Local: `http://localhost:5000/api`
- Deployed: the URL of your own Vercel/Node deployment (see root `README.md` → Deployment)

Every request (except `GET /api`, `GET /health`, auth) requires:

```
Authorization: Bearer <token>
```

## Response format

- Success: `{ "success": true, "data": ... }` (201 on creates)
- Error: `{ "success": false, "error": { "message": "...", "details?": [...] } }`
- Codes: `200` ok · `201` created · `400` validation · `401` unauthorized · `403` forbidden · `404` not found · `409` conflict · `422` unprocessable · `429` rate limited · `500` fallback

## Unified API index

- `GET /` — on production redirects to `/api` (Vercel normalizes the root path; the redirect keeps the entry point clean).
- `GET /api` — JSON index naming the service, version and every resource.
- `GET /health` — `{ success: true, data: { status: "ok" } }`

## Auth

| Method | URL | Body → result |
| ------ | --- | ------------- |
| POST | `/api/auth/register` | `{ name, email, password, role? }` → 201 `{ token, user }` / 409 duplicate email |
| POST | `/api/auth/login` | `{ email, password }` → 200 `{ token, user }` / 401 wrong credentials |
| GET | `/api/auth/me` | current user (protected) |

Passwords are bcrypt-hashed; hashes never leave the server. Tokens are JWT (7-day expiry, `JWT_SECRET`).

## Users

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET | `/api/users?search=` | member directory (search by name / email / role / location). **Public-facing list for the workspace** — returns `id, name, email, role, location, bio, avatar` |
| GET | `/api/users/:id` | one profile |
| PUT | `/api/users/:id` | partial `{ name?, email?, role?, location?, bio? }` (only your own profile) |
| DELETE | `/api/users/:id` | delete your own account |

## Projects

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET | `/api/projects?search=&status=` | projects you own **or are shared with**; `status = active \| completed \| on-hold` |
| POST | `/api/projects` | `{ title, description?, status?, dueDate?, members? }` → 201 |
| GET | `/api/projects/:id` | project + its `tasks` + `sharedWith` |
| PUT | `/api/projects/:id` | partial update (owner or `edit` access) |
| DELETE | `/api/projects/:id` | cascade-deletes its tasks (owner or `edit` access) |
| POST | `/api/projects/:id/share` | `{ userId, access: "view" \| "review" \| "edit" }` → share/update access (owner) |
| DELETE | `/api/projects/:id/share/:userId` | stop sharing (owner) |

Sharing access is enforced server-side on every read and write:

| Access | Read | Set status | Set `done` | Edit/delete/share |
| ------ | ---- | ---------- | ---------- | ----------------- |
| `view` | yes | no | no | no |
| `review` | yes | up to `review` | no | no |
| `edit` | yes | any | yes | edit/delete (not share) |
| owner | yes | any | yes | everything |

## Tasks

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET | `/api/tasks?projectId=&status=&priority=&search=` | combined filters |
| POST | `/api/tasks` | `{ projectId, title, description?, status?, priority?, assignee?, dueDate? }` → 201 (owner) |
| GET | `/api/tasks/:id` | one task |
| PUT | `/api/tasks/:id` | partial update (owner) — recomputes project progress |
| PATCH | `/api/tasks/:id/status` | `{ status }` (access-gated, see table above) |
| DELETE | `/api/tasks/:id` | (owner) — recomputes project progress |

Enums: task `status = todo \| in-progress \| review \| done` · `priority = low \| medium \| high` · project `status = active \| completed \| on-hold`. Dates are `YYYY-MM-DD`.

## Teams

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET/POST | `/api/teams` | list / create `{ name, description?, memberIds? }` |
| GET/PUT/DELETE | `/api/teams/:id` | detail (with members) / update / delete |
| POST | `/api/teams/:id/members` | `{ userId }` → add a member |
| DELETE | `/api/teams/:id/members/:userId` | remove a member |
| POST | `/api/teams/:id/leave` | leave a team |

## Chat (temporary)

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET | `/api/chat/inbox` | conversations with `unread` counts + last message |
| POST | `/api/chat/send` | `{ to, text }` (≤ 2000 chars) |
| GET | `/api/chat/:userId/messages` | full thread with one teammate (marks inbound as seen) |
| DELETE | `/api/chat/:userId/messages` | clear the conversation |

Messages are temporary by design: each document expires after **24 hours** (MongoDB TTL index), so nothing is ever stored long-term.

## Uploads

| Method | URL | Body → result |
| ------ | --- | ------------- |
| POST | `/api/uploads/avatar` | `{ image: "data:image/png;base64,..." }` → 201 `{ url }` (imgbb CDN). Requires `IMGBB_KEY`. |

## System

| Method | URL | Body → result |
| ------ | --- | ------------- |
| GET | `/api/system/storage` | live storage health → `{ status, provider, host, database, collections: [{ name, documents, indexes }] }` |

## Environment variables

| Var | Required | Notes |
| --- | -------- | ----- |
| `PORT` | no | default `5000` |
| `NODE_ENV` | no | `development` / `production` |
| `DATABASE_URL` | **yes** | MongoDB Atlas connection string; the server refuses to start without it |
| `JWT_SECRET` | yes (prod) | long random string for signing tokens |
| `JWT_EXPIRES_IN` | no | default `7d` |
| `IMGBB_KEY` | for avatars | imgbb API key; uploads return 503 without it |

## Storage

- **Provider:** MongoDB Atlas (managed cluster, db `flowboard`).
- **Connection:** `src/config/db.js` — env-driven, single shared connection (serverless reuse), boot retry with backoff, tuned pool, graceful shutdown on `SIGINT`/`SIGTERM`.
- **Schema & relationships:** `User` 1—N `Project` (createdBy/members/sharedWith) · `Project` 1—N `Task` (cascade delete) · `User` 1—N `Task` (assignee) · `Team` 1—N `User` (memberIds) · `User` 1—N `ChatMessage` (TTL 24h).
- **DB-level validation:** required, `minlength`, `unique` email, enums on statuses/priority, refs — enforced by Mongoose even if API validation is bypassed.
- **Indexes:** `email` (unique) · `createdBy` · `sharedWith.user` · `projectId` · `status` · `assignee` · `expiresAt` (TTL for chat).
- **Inspect live:** `GET /api/system/storage` (auth) → connection, host, database, per-collection counts and index definitions.
- **Restart-persistence proof:** `npm run storage write` → restart the API → `npm run storage read`. If the probe comes back, data survived the restart.

Run `npm run storage -- check` for a quick connection + counts report.

## Structure

```
api/index.js            Vercel serverless entry — same express app
src/app.js              wiring, unified API index, /health
src/config/             env.js, db.js (Mongo connect: retry, pool, graceful shutdown)
src/controllers/        auth, users, projects, tasks, teams, chat, uploads, system
src/models/             User, Project, Task, Team, ChatMessage (Mongoose)
src/middlewares/        auth.js (JWT), http.js (validate / notFound / errorHandler)
src/routes/             one router per resource, mounted under /api
src/utils/http.js       ApiError, asyncHandler, access helpers
src/validators/         Zod schemas for every write op
scripts/verify-storage.js   storage CLI (check / write / read / clean)
```

## Try it

```bash
BASE=http://localhost:5000/api
curl $BASE/health
curl $BASE/api             # unified index
curl -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}'
```

A ready-made Postman collection lives in `postman_collection.json` (import → run; `flowboardy-api` variable pre-pointed at production).