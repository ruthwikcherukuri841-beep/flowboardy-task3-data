# FlowBoard — Projects & Tasks (Live API Edition)

Live demo: **https://flowboardys.vercel.app** · API: **https://flowboardy-api.vercel.app/health**

FlowBoard is a calm, fast workspace for tracking projects and tasks. One overview for standup, one board for projects, one list for tasks — with search, filters, notifications, profiles, and display preferences built in.

> Live REST API build. Every project, task, and user on screen is fetched from the FlowBoard REST API (`VITE_API_URL`) and persisted on MongoDB. No mock data anywhere in this folder — run the backend and the board goes live.

## Run it (both parts)

```bash
# terminal 1 — API
cd backend
npm install
npm run dev        # http://localhost:5000

# terminal 2 — dashboard
cd frontend
npm install
npm run dev        # http://localhost:5173 (reads VITE_API_URL, defaults to localhost:5000/api)
```

## Highlights

- **Overview dashboard** — greeting summary, clickable stat cards, priority projects, needs-attention queue, recent activity feed
- **Projects** — status filters, live search, detail view with members, progress, per-project tasks, edit / delete
- **Tasks** — status + priority + project filters, live search, detail view with one-click status / priority changes
- **Notifications panel** — overdue, due-soon, assignments, completions; All / Unread tabs, mark-read, deep-link to tasks
- **Profile page** — editable name / role (saved locally), assigned vs completed stats, recent work
- **Display settings** — 6 accent colors, comfortable / compact density, show / hide completed tasks; all persisted
- **Full footer + legal** — Terms of Service, Privacy Policy, Cookie Notice, About, and live Status dialogs (no dead links)
- **Every button works** — no placeholder controls; toasts confirm creates, updates, deletes
- **Responsive** — mobile bottom-sheet modals, collapsible sidebar, adaptive grids at 360 / 768 / 1280px
- **Accessible** — focus-visible rings, dialog roles, labeled search and filters, keyboard shortcuts

### Keyboard shortcuts

| Key | Action |
| --- | ------ |
| `/` | Focus search |
| `N` | New task |
| `P` | New project |
| `1` `2` `3` `4` | Overview / Projects / Tasks / Profile |
| `?` | Shortcut help |
| `Esc` | Close dialogs |

## Tech stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4
- lucide-react icons
- Data: 100% FlowBoard REST API via `src/lib/api.ts` (`VITE_API_URL`) — zero mock data

## Configuration

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL of the FlowBoard REST API |

Set it in `.env` (see `.env.example`) or as a build env on Vercel. If the API is unreachable, the board shows an error panel with retry — never fake data.

Production build:

```bash
npm run build
npm run preview
```

Deploy (Vercel):

```bash
npx vercel deploy --prod --name flowboardys --build-env VITE_API_URL=https://flowboardy-api.vercel.app/api
```

## Project structure

```
src/
  components/   Navbar, Sidebar, ProjectCard, TaskCard, Progress,
                States, NotificationsPanel, DetailModals, Modals,
                Legal, SettingsFooter, ProfilePage
  data/         directory.ts (live API cache), activity.ts (notifications + feed)
  lib/          api.ts (typed REST client)
  hooks/        useSearchFilter.ts
  theme.ts      accents, density, localStorage helpers
  types.ts      User, Project, Task, View
  App.tsx       board state, filters, CRUD, routing between views
```

## Data shapes (locked for API reuse)

```ts
User { id, name, email, avatar, role }
Project { id, title, description, status, progress, dueDate, members, createdAt }
Task { id, projectId, title, description, status, priority, assignee, dueDate, createdAt }
```

## Screenshots

| Overview | Projects | Tasks | Profile |
| -------- | -------- | ----- | ------- |
| `screenshots/dashboard.png` | `screenshots/projects.png` | `screenshots/tasks.png` | `screenshots/profile.png` |

Capture at 1280px + one 390px mobile shot (`screenshots/mobile.png`).

## Environment

See `.env.example`. No secrets in this repo — never commit `.env`.

## Roadmap

- [x] Frontend dashboard (this repo)
- [x] REST API: users, projects, tasks + auth
- [x] Persistent database + relationships (MongoDB Atlas)
- [ ] Full-stack AI platform (task generation, summaries, prioritization)
- [ ] Team invites, comments, hosted sync

## License

MIT — free for personal and commercial use.
