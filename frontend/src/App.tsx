import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, FolderKanban, ListChecks, Plus, Timer, Trophy } from "lucide-react";
import { buildActivity, buildNotifications, type AppNotification } from "./data/activity";
import { setDirectory } from "./data/directory";
import { api, apiBase } from "./lib/api";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { accents, initials, load, save, type AccentKey, type Density } from "./theme";
import { Navbar } from "./components/Navbar";
import { ProjectCard } from "./components/ProjectCard";
import { Sidebar } from "./components/Sidebar";
import { EmptyState, LoadingSkeleton, NoSearchResults } from "./components/States";
import { TaskCard } from "./components/TaskCard";
import { ProjectDetailModal, TaskDetailModal } from "./components/DetailModals";
import { NewProjectModal, NewTaskModal, ShortcutsModal, Toast } from "./components/Modals";
import { AboutModal, CookiesModal, PrivacyModal, StatusModal, TermsModal } from "./components/Legal";
import { Footer, SettingsModal, type LegalKind } from "./components/SettingsFooter";
import { ProfilePage } from "./components/ProfilePage";
import { Onboarding } from "./components/Onboarding";
import { NotFound } from "./components/NotFound";
import { AddToTeamModal, NewTeamModal, TeamDetailModal, TeamsPage } from "./components/TeamViews";
import { PeoplePage, ShareProjectModal } from "./components/PeopleViews";
import { ChatPage } from "./components/ChatViews";
import type { Access } from "./components/DetailModals";
import type { Project, ProjectAccess, ProjectStatus, Task, TaskPriority, TaskStatus, Team, User, View } from "./types";

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const greetingDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

function parseRoute(hash: string): { view: View; target: string | null } {
  hash = hash || "#/";
  let m: RegExpMatchArray | null;
  if ((m = hash.match(/^#\/u\/([^/]+)/))) return { view: "profile", target: m[1] };
  if ((m = hash.match(/^#\/profile\/([^/]+)/))) return { view: "profile", target: m[1] };
  if (hash === "#/profile") return { view: "profile", target: null };
  if (hash === "#/projects") return { view: "projects", target: null };
  if (hash === "#/tasks") return { view: "tasks", target: null };
  if (hash === "#/teams") return { view: "teams", target: null };
  if (hash === "#/people") return { view: "people", target: null };
  if (hash === "#/chat") return { view: "chat", target: null };
  if (hash === "#/" || hash === "#") return { view: "dashboard", target: null };
  return { view: "notfound", target: null };
}
const initialRoute = () => (typeof window === "undefined" ? { view: "dashboard" as View, target: null as string | null } : parseRoute(window.location.hash));

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-base font-black text-white">F</span>
          <span className="text-sm font-semibold text-slate-500">Loading FlowBoard…</span>
        </div>
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  return <Shell user={user} />;
}

// The workspace. Mounts only for a signed-in user; every list here is
// fetched from the REST API with that user's token — never local data.
function Shell({ user }: { user: User }) {
  const { refreshMe, logout } = useAuth();
  const [route, setRoute] = useState<{ view: View; target: string | null }>(initialRoute);
  const { view, target: profileFor } = route;
  const [onboarded, setOnboarded] = useState<boolean>(() => load<string>("flowboard-onboarded", "0") === "1");
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [globalQuery, setGlobalQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState("all");
  const [taskStatus, setTaskStatus] = useState("all");
  const [taskPriority, setTaskPriority] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState<"all" | "overdue">("all");
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profileName, setProfileName] = useState(() => load("flowboard-name", user.name));
  const [profileRole, setProfileRole] = useState(() => load("flowboard-role", user.role));
  const [profileBio, setProfileBio] = useState<string>(() => load("flowboard-bio", ""));
  const [profileLocation, setProfileLocation] = useState(() => load<string>("flowboard-location", "Remote"));
  const [accent, setAccent] = useState<AccentKey>(() => load<AccentKey>("flowboard-accent", "slate"));
  const [density, setDensity] = useState<Density>(() => load<Density>("flowboard-density", "comfortable"));
  const [showCompleted, setShowCompleted] = useState(() => load<string>("flowboard-show-completed", "true") !== "false");
  const compact = density === "compact";
  const accentBtn = accents[accent].btn;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [unreadChat, setUnreadChat] = useState(0);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTaskProject, setNewTaskProject] = useState<string | undefined>(undefined);
  const [addToTeam, setAddToTeam] = useState<{ id: string; name: string } | null>(null);
  const [shareFor, setShareFor] = useState<{ userId?: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [legal, setLegal] = useState<LegalKind>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => { save("flowboard-accent", accent); }, [accent]);
  useEffect(() => { save("flowboard-density", density); }, [density]);
  useEffect(() => { save("flowboard-show-completed", String(showCompleted)); }, [showCompleted]);
  useEffect(() => { save("flowboard-name", profileName); }, [profileName]);
  useEffect(() => { save("flowboard-role", profileRole); }, [profileRole]);
  useEffect(() => { save("flowboard-bio", profileBio); }, [profileBio]);
  useEffect(() => { save("flowboard-location", profileLocation); }, [profileLocation]);
  useEffect(() => { save("flowboard-onboarded", onboarded ? "1" : "0"); }, [onboarded]);

  // Profiles live on the server — hydrate the workspace copy whenever the
  // signed-in member changes (login / token refresh).
  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfileRole(user.role || "");
    setProfileBio(user.bio ?? "");
    setProfileLocation(user.location || "Remote");
  }, [user]);

  const goView = useCallback((v: View) => {
    const hash = v === "profile" ? "#/profile" : v === "dashboard" ? "#/" : `#/${v}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(parseRoute(hash));
  }, []);

  const openProfile = useCallback((id: string) => {
    const hash = id ? `#/u/${id}` : "#/profile";
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(parseRoute(hash));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Boot: every list on screen comes from the REST API.
  const refresh = useCallback(async () => {
    const [u, p, t, tm] = await Promise.all([api.getUsers(), api.getProjects(), api.getTasks(), api.getTeams()]);
    setDirectory(u, p);
    setUsers(u);
    setProjects(p);
    setTasks(t);
    setTeams(tm);
    setNotifications(buildNotifications(t));
  }, []);

  const boot = useCallback(async () => {
    setLoading(true);
    setBootError(null);
    try {
      await refresh();
    } catch (e) {
      setBootError(e instanceof Error ? e.message : "Could not reach the API");
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => { void boot(); }, [boot]);

  // Keep the chat unread badge fresh even when the chat view isn't open.
  useEffect(() => {
    const tick = () => { void api.chatInbox().then((ib) => setUnreadChat(ib.reduce((s, c) => s + c.unread, 0))).catch(() => {}); };
    tick();
    const t = window.setInterval(tick, 9000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        if (e.key === "Escape") (document.activeElement as HTMLElement).blur();
        return;
      }
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setNewTaskProject(undefined); setShowNewTask(true); }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); setShowNewProject(true); }
      if (e.key === "1") goView("dashboard");
      if (e.key === "2") goView("projects");
      if (e.key === "3") goView("tasks");
      if (e.key === "4") goView("profile");
      if (e.key === "5") goView("people");
      if (e.key === "6") goView("chat");
      if (e.key === "?") setShowShortcuts(true);
      if (e.key === "Escape") { setSelectedProjectId(null); setSelectedTaskId(null); setSelectedTeamId(null); setShowNewProject(false); setShowNewTask(false); setShowNewTeam(false); setAddToTeam(null); setShareFor(null); setShowShortcuts(false); setShowSettings(false); setLegal(null); setNotifOpen(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goView]);

  const q = globalQuery.trim().toLowerCase();
  const filteredProjects = useMemo(() => projects.filter((p) => {
    const matchQ = !q || `${p.title} ${p.description}`.toLowerCase().includes(q);
    return matchQ && (projectStatus === "all" || p.status === projectStatus);
  }), [projects, q, projectStatus]);

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    if (!showCompleted && t.status === "done" && taskStatus !== "done") return false;
    const matchQ = !q || `${t.title} ${t.description}`.toLowerCase().includes(q);
    const matchDue = dueFilter === "all" || (t.status !== "done" && !!t.dueDate && t.dueDate < today);
    return matchQ && (taskStatus === "all" || t.status === taskStatus) && (taskPriority === "all" || t.priority === taskPriority) && (projectFilter === "all" || t.projectId === projectFilter) && matchDue;
  }), [tasks, q, taskStatus, taskPriority, projectFilter, showCompleted, dueFilter]);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const inProg = tasks.filter((t) => t.status === "in-progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate < today).length;
    return { total: tasks.length, done, inProg, todo, overdue, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, projects: projects.length };
  }, [tasks, projects]);

  const activity = useMemo(() => buildActivity(tasks), [tasks]);
  const showTour = !onboarded && !loading && !bootError && projects.length === 0 && tasks.length === 0;
  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) ?? null : null;
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;
  const selectedProjectTasks = selectedProject ? tasks.filter((t) => t.projectId === selectedProject.id) : [];

  const resetAll = () => { setGlobalQuery(""); setProjectStatus("all"); setTaskStatus("all"); setTaskPriority("all"); setProjectFilter("all"); setDueFilter("all"); };
  const openTask = (id: string) => { setSelectedTaskId(id); setNotifOpen(false); setNotifications((ns) => ns.map((n) => (n.taskId === id ? { ...n, read: true } : n))); };

  const viewTasksOf = (projectId: string) => {
    setSelectedProjectId(null);
    setProjectFilter(projectId);
    setTaskStatus("all"); setTaskPriority("all"); setDueFilter("all");
    goView("tasks");
  };

  const createProject = async (d: { title: string; description: string; status: ProjectStatus; dueDate: string }) => {
    try {
      const p = await api.createProject({ ...d, members: [user.id] });
      setShowNewProject(false);
      showToast(`Project “${p.title}” created`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not create project");
    }
  };
  const updateProject = async (p: Project) => {
    try {
      await api.updateProject(p.id, { title: p.title, description: p.description, status: p.status });
      setSelectedProjectId(null);
      showToast("Project updated");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update project");
    }
  };
  const deleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setSelectedProjectId(null);
      showToast("Project deleted");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not delete project");
    }
  };
  const createTask = async (d: { projectId: string; title: string; description: string; status: TaskStatus; priority: TaskPriority; dueDate: string; assignee: string }) => {
    try {
      const t = await api.createTask({ ...d, assignee: d.assignee || user.id });
      setShowNewTask(false);
      showToast(`Task “${t.title}” created`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not create task");
    }
  };
  const setTaskStatusById = async (id: string, s: TaskStatus) => {
    try {
      await api.setTaskStatus(id, s);
      showToast(`Task moved to ${s.replace("-", " ")}`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update status");
    }
  };
  const setTaskPriorityById = async (id: string, p: TaskPriority) => {
    try {
      await api.updateTask(id, { priority: p });
      showToast(`Priority set to ${p}`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update priority");
    }
  };

  const createTeam = async (d: { name: string; description: string }) => {
    try {
      const t = await api.createTeam({ ...d, memberIds: [] });
      setShowNewTeam(false);
      showToast(`Team “${t.name}” created`);
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not create team");
    }
  };
  const updateTeam = async (t: Team, d: { name: string; description: string }) => {
    try {
      await api.updateTeam(t.id, d);
      showToast("Team updated");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update team");
    }
  };
  const addTeamMember = async (teamId: string, userId: string) => {
    try {
      await api.addMember(teamId, userId);
      showToast("Member added to team");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not add member");
    }
  };
  const removeTeamMember = async (teamId: string, userId: string) => {
    try {
      await api.removeMember(teamId, userId);
      showToast("Member removed from team");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not remove member");
    }
  };
  const leaveTeam = async (teamId: string) => {
    try {
      await api.leaveTeam(teamId);
      setSelectedTeamId(null);
      showToast("You left the team");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not leave team");
    }
  };
  const deleteTeam = async (teamId: string) => {
    try {
      await api.deleteTeam(teamId);
      setSelectedTeamId(null);
      showToast("Team deleted");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not delete team");
    }
  };

  const tasksFor = (pid: string) => tasks.filter((t) => t.projectId === pid).length;

  // Access a member has on a project: owner, or their shared access level.
  const accessOf = useMemo(() => {
    const map = new Map<string, Access>();
    for (const p of projects) {
      if (p.createdBy === user.id) { map.set(p.id, "owner"); continue; }
      const entry = p.sharedWith?.find((s) => s.user === user.id);
      map.set(p.id, entry?.access ?? null);
    }
    return (id: string): Access => map.get(id) ?? null;
  }, [projects, user.id]);
  const ownedProjects = useMemo(() => projects.filter((p) => accessOf(p.id) === "owner"), [projects, accessOf]);
  const sharedProjects = useMemo(() => projects.filter((p) => accessOf(p.id) !== "owner"), [projects, accessOf]);

  const shareProject = async (projectId: string, userId: string, access: ProjectAccess) => {
    try {
      await api.shareProject(projectId, userId, access);
      setShareFor(null);
      showToast("Project shared");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not share project");
    }
  };
  const unshareProject = async (projectId: string, userId: string) => {
    try {
      await api.unshareProject(projectId, userId);
      showToast("Sharing removed");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update sharing");
    }
  };
  const updateAvatar = async (dataUrl: string) => {
    try {
      await api.updateAvatar(dataUrl);
      await refreshMe();
      await refresh();
      showToast("Profile photo updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not upload photo");
    }
  };
  const teamMembers = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => t.members.forEach((m) => set.add(String(m))));
    return users.filter((u) => set.has(u.id));
  }, [teams, users]);
  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) ?? null : null;
  const viewTitle = view === "dashboard" ? "Overview" : view === "projects" ? `Projects · ${filteredProjects.length}` : view === "tasks" ? `Tasks · ${filteredTasks.length}` : view === "teams" ? `Teams · ${teams.length}` : view === "people" ? `People · ${users.length}` : view === "chat" ? (unreadChat > 0 ? `Chat · ${unreadChat} new` : "Chat") : view === "notfound" ? "Page not found" : "Profile";
  const statCards = [
    { key: "projects", label: "Total projects", value: stats.projects, icon: FolderKanban, action: () => goView("projects") },
    { key: "done", label: "Completed", value: `${stats.done}/${stats.total}`, icon: Trophy, action: () => { setTaskStatus("done"); goView("tasks"); } },
    { key: "prog", label: "In progress", value: stats.inProg, icon: Timer, action: () => { setTaskStatus("in-progress"); goView("tasks"); } },
    { key: "over", label: "Overdue", value: stats.overdue, icon: ListChecks, action: () => { setTaskStatus("all"); setTaskPriority("all"); setDueFilter("overdue"); goView("tasks"); } },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <Navbar
        query={globalQuery} onQuery={setGlobalQuery} onMenu={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} viewTitle={viewTitle}
        notifications={notifications} notifTab={notifTab} onNotifTab={setNotifTab}
        onOpenTask={openTask} onMarkRead={(id) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)))}
        onMarkAll={() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))}
        onClearNotifs={() => { setNotifications([]); setNotifOpen(false); showToast("Notifications cleared"); }}
        notifOpen={notifOpen} onNotifToggle={() => setNotifOpen((v) => !v)} onNotifClose={() => setNotifOpen(false)}
        onNewTask={() => { setNewTaskProject(undefined); setShowNewTask(true); }}
        onNewProject={() => setShowNewProject(true)}
        onShortcuts={() => setShowShortcuts(true)}
        onProfile={() => goView("profile")} onSettings={() => setShowSettings(true)} onSignOut={logout}
        profileName={profileName} profileRole={profileRole} profileEmail={user.email} profileAvatar={user.avatar ?? ""}
      />

      <div className="mx-auto flex max-w-7xl items-start lg:gap-5 lg:px-5 lg:py-5">
        <Sidebar view={view} onView={(v) => { goView(v); setSidebarOpen(false); }} open={sidebarOpen} donePct={stats.pct}
          counts={{ projects: projects.length, tasks: tasks.length, teams: teams.length, people: users.length, chat: unreadChat }} onNewProject={() => setShowNewProject(true)}
          onSettings={() => setShowSettings(true)} profileName={profileName} profileRole={profileRole} profileAvatar={user.avatar ?? ""} />
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-5 lg:px-0 lg:py-0">
          {bootError && !loading ? (
            <ErrorBox message={`${bootError} (API: ${apiBase})`} onRetry={() => void boot()} />
          ) : (
            <>
          {view === "dashboard" && (
            <section>
              <div className="fade-up flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">{greetingDate}</h1>
                  <p className="mt-0.5 text-[13px] text-slate-500">Morning, {profileName.split(" ")[0]} — {stats.inProg} in progress, {stats.overdue} overdue. Standup-ready summary below.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setNewTaskProject(undefined); setShowNewTask(true); }} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white ${accentBtn}`}><Plus size={15} /> New task</button>
                  <button onClick={() => setShowNewProject(true)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">New project</button>
                </div>
              </div>

              <div className={`stagger mt-4 grid grid-cols-2 ${compact ? "gap-2" : "gap-3"} xl:grid-cols-4`}>
                {statCards.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.key} onClick={s.action} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]" title={`Filter: ${s.label}`}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon size={16} /></span>
                      <p className="pop mt-2.5 text-xl font-bold tracking-tight">{s.value}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">{s.label} <ArrowRight size={12} className="text-slate-300" /></p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px]">
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Priority projects</h2>
                    <button onClick={() => goView("projects")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-600 hover:text-slate-900">View all <ArrowRight size={13} /></button>
                  </div>
                  {loading ? <LoadingSkeleton rows={3} /> : (
                    <div className={`grid ${compact ? "gap-2" : "gap-3"} sm:grid-cols-2`}>
                      {filteredProjects.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} taskCount={tasksFor(p.id)} compact={compact} me={user.id} onOpen={() => setSelectedProjectId(p.id)} />)}
                    </div>
                  )}
                  <div className="mb-2.5 mt-5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Needs attention</h2>
                    <button onClick={() => { setTaskStatus("all"); goView("tasks"); }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-600 hover:text-slate-900">Open tasks <ArrowRight size={13} /></button>
                  </div>
                  {loading ? <LoadingSkeleton rows={2} /> : filteredTasks.filter((t) => t.status !== "done").slice(0, 2).length === 0 ? (
                    <EmptyState title="All caught up" hint="No pending tasks match your search." onReset={resetAll} />
                  ) : (
                    <div className={`grid ${compact ? "gap-2" : "gap-3"} sm:grid-cols-2`}>
                      {filteredTasks.filter((t) => t.status !== "done").slice(0, 2).map((t) => <TaskCard key={t.id} task={t} compact={compact} access={accessOf(t.projectId)} onQuickStatus={setTaskStatusById} onOpen={() => openTask(t.id)} onOpenAssignee={openProfile} />)}
                    </div>
                  )}
                </div>
                <div className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Recent activity</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{activity.length} events</span>
                  </div>
                  <ol className="mt-3 space-y-1">
                    {activity.map((a) => (
                      <li key={a.id}>
                        <button onClick={() => a.taskId && openTask(a.taskId)} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                          <span className="block text-[13px] leading-snug text-slate-700">{a.text}</span>
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400"><CalendarDays size={11} /> Due {a.time}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button onClick={() => setNotifOpen(true)} className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Open notifications</button>
                </div>
              </div>
            </section>
          )}

          {view === "projects" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h1 className="text-xl font-bold tracking-tight">Projects <span className="text-sm font-semibold text-slate-400">{filteredProjects.length}</span></h1>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterPills options={["all", "active", "completed", "on-hold"]} value={projectStatus} onChange={setProjectStatus} />
                  <button onClick={() => setShowNewProject(true)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white ${accentBtn}`}><Plus size={14} /> Project</button>
                </div>
              </div>
              <div className="mt-4">
                {loading ? <LoadingSkeleton rows={6} /> : filteredProjects.length === 0 ? (
                  q || projectStatus !== "all" ? <NoSearchResults onReset={resetAll} /> : <EmptyState title="No projects yet" hint="Projects group related tasks and owners. Create your first project to get started." action={{ label: "Create your first project", onClick: () => setShowNewProject(true) }} />
                ) : (
                  <div className={`grid ${compact ? "gap-2" : "gap-3"} sm:grid-cols-2 xl:grid-cols-3`}>
                    {filteredProjects.map((p) => <ProjectCard key={p.id} project={p} taskCount={tasksFor(p.id)} compact={compact} me={user.id} onOpen={() => setSelectedProjectId(p.id)} />)}
                  </div>
                )}
              </div>
            </section>
          )}

          {view === "tasks" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h1 className="text-xl font-bold tracking-tight">Tasks <span className="text-sm font-semibold text-slate-400">{filteredTasks.length}</span></h1>
                <div className="flex flex-wrap items-center gap-2">
                  {projectFilter !== "all" && (
                    <button onClick={() => setProjectFilter("all")} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                      {projects.find((p) => p.id === projectFilter)?.title ?? "Project"} ✕
                    </button>
                  )}
                  {dueFilter === "overdue" && (
                    <button onClick={() => setDueFilter("all")} className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">Overdue ✕</button>
                  )}
                  <FilterPills options={["all", "todo", "in-progress", "done"]} value={taskStatus} onChange={setTaskStatus} />
                  <FilterPills options={["all", "low", "medium", "high"]} value={taskPriority} onChange={setTaskPriority} />
                  <button onClick={() => { setNewTaskProject(projectFilter !== "all" ? projectFilter : undefined); setShowNewTask(true); }} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white ${accentBtn}`}><Plus size={14} /> Task</button>
                </div>
              </div>
              {!showCompleted && taskStatus === "all" && (
                <p className="mt-2 text-xs text-slate-400">Completed tasks are hidden — enable them in Display settings.</p>
              )}
              <div className="mt-4">
                {loading ? <LoadingSkeleton rows={6} /> : filteredTasks.length === 0 ? (
                  q || taskStatus !== "all" || taskPriority !== "all" || projectFilter !== "all" || dueFilter === "overdue" ? <NoSearchResults onReset={resetAll} /> : (
                    <EmptyState title="No tasks yet" hint="Tasks are the to-dos inside a project. Create one and start tracking your work." action={{ label: "Add your first task", onClick: () => { setNewTaskProject(undefined); setShowNewTask(true); } }} />
                  )
                ) : (
                  <div className={`grid ${compact ? "gap-2" : "gap-3"} sm:grid-cols-2 xl:grid-cols-3`}>
                    {filteredTasks.map((t) => <TaskCard key={t.id} task={t} compact={compact} access={accessOf(t.projectId)} onQuickStatus={setTaskStatusById} onOpen={() => openTask(t.id)} onOpenAssignee={openProfile} />)}
                  </div>
                )}
              </div>
            </section>
          )}

          {view === "notfound" && (
            <NotFound onHome={() => goView("dashboard")} />
          )}

          {view === "people" && (
            <PeoplePage users={users} me={user.id} sharedProjects={sharedProjects} accessOf={accessOf}
              onOpenUser={openProfile}
              onOpenProject={(id) => setSelectedProjectId(id)}
              onShare={(userId) => setShareFor({ userId })}
            />
          )}

          {view === "chat" && (
            <ChatPage me={user.id} users={users} onOpenUser={openProfile} onToast={showToast} onUnreadChange={setUnreadChat} />
          )}

          {view === "teams" && (
            <TeamsPage teams={teams} members={users} me={user.id} tasks={tasks}
              onOpenTeam={(id) => setSelectedTeamId(id)}
              onNewTeam={() => setShowNewTeam(true)}
              onOpenUser={openProfile}
              onAddToTeam={(uid, uname) => setAddToTeam({ id: uid, name: uname })} />
          )}

          {view === "profile" && (
            profileFor && profileFor !== user.id
              ? (() => {
                  const viewed = users.find((u) => u.id === profileFor) ?? null;
                  return viewed ? (
                    <ProfilePage self={false} name={viewed.name} role={viewed.role} email={viewed.email} bio={viewed.bio ?? ""} location={viewed.location || "—"} memberSince={viewed.createdAt} avatar={viewed.avatar ?? ""}
                      userId={viewed.id} accent={accent} projects={[]} tasks={[]} compact={compact}
                      onViewSelf={() => goView("profile")} onToast={showToast} />
                  ) : (
                    <ErrorBox message="That member profile is not available in this workspace." onRetry={() => goView("profile")} />
                  );
                })()
              : (
            <ProfilePage self name={profileName} role={profileRole} email={user.email} bio={profileBio} location={profileLocation} memberSince={user.createdAt} avatar={user.avatar ?? ""}
              userId={user.id} accent={accent} projects={projects} tasks={tasks} compact={compact}
              onAvatar={updateAvatar}
              onSave={async (n, r, b, l) => {
                setProfileName(n); setProfileRole(r); setProfileBio(b); setProfileLocation(l);
                try {
                  await api.updateUser(user.id, { name: n, role: r, bio: b, location: l });
                  await refreshMe();
                  showToast("Profile updated");
                } catch (e) {
                  showToast(e instanceof Error ? e.message : "Profile saved on this device only");
                }
              }}
              onOpenTask={openTask} onOpenProject={(id) => setSelectedProjectId(id)} onOpenAssignee={openProfile}
              onBrowseTasks={(s) => { setTaskStatus(s); setProjectFilter("all"); setDueFilter("all"); goView("tasks"); }}
              onToast={showToast} onSignOut={logout} onViewSelf={() => goView("profile")} />
              )
          )}

          <Footer onNav={goView} onLegal={(k) => setLegal(k)} onShortcuts={() => setShowShortcuts(true)} onSettings={() => setShowSettings(true)} onNewProject={() => setShowNewProject(true)} />
          <p className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{initials(profileName)} {profileName}'s workspace · {projects.length} projects · {tasks.length} tasks · {users.length} members</span>
            <button onClick={() => setShowShortcuts(true)} className="font-medium hover:text-slate-600">Press <kbd className="rounded border border-slate-200 bg-white px-1 font-mono">?</kbd> for shortcuts</button>
          </p>
            </>
          )}
        </main>
      </div>

      {showTour && (
        <Onboarding
          hasProjects={projects.length > 0}
          onCreateProject={() => setShowNewProject(true)}
          onCreateTask={() => {
            if (projects.length === 0) { showToast("Create a project first so your task has a home."); return; }
            setNewTaskProject(undefined); setShowNewTask(true);
          }}
          onDone={() => setOnboarded(true)}
        />
      )}

      {selectedProject && (
        <ProjectDetailModal project={selectedProject} tasks={selectedProjectTasks} users={users} me={user.id}
          access={accessOf(selectedProject.id)}
          onClose={() => setSelectedProjectId(null)}
          onViewTasks={viewTasksOf} onUpdate={updateProject} onDelete={deleteProject} onOpenTask={openTask}
          onShare={shareProject} onUnshare={unshareProject} />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} access={accessOf(selectedTask.projectId)} onClose={() => setSelectedTaskId(null)} onUpdateStatus={setTaskStatusById} onUpdatePriority={setTaskPriorityById} />
      )}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={createProject} />}
      {showNewTask && (
        <NewTaskModal projects={ownedProjects} members={teamMembers} defaultProjectId={newTaskProject} onClose={() => setShowNewTask(false)}
          onCreate={createTask} onCreateTeam={() => { setShowNewTask(false); setShowNewTeam(true); }} />
      )}
      {shareFor && (
        <ShareProjectModal projects={ownedProjects} users={users.filter((u) => u.id !== user.id)}
          onClose={() => setShareFor(null)} onShare={shareProject} onUnshare={unshareProject} />
      )}
      {showNewTeam && <NewTeamModal onClose={() => setShowNewTeam(false)} onCreate={createTeam} />}
      {selectedTeam && (
        <TeamDetailModal team={selectedTeam}
          members={selectedTeam.members.map((m) => users.find((u) => u.id === String(m))).filter(Boolean) as User[]}
          allUsers={users} tasks={tasks} me={user.id} compact={compact}
          onClose={() => setSelectedTeamId(null)}
          onUpdate={updateTeam} onAddMember={addTeamMember} onRemoveMember={removeTeamMember}
          onLeave={leaveTeam} onDelete={deleteTeam} onOpenUser={openProfile} />
      )}
      {addToTeam && (
        <AddToTeamModal userName={addToTeam.name} teams={teams}
          onAdd={async (teamId) => {
            await api.addMember(teamId, addToTeam.id);
            setAddToTeam(null);
            showToast(`${addToTeam.name} added to a team`);
            await refresh();
          }}
          onCreateAndAdd={async (name) => {
            try {
              const t = await api.createTeam({ name, description: "", memberIds: [] });
              await api.addMember(t.id, addToTeam.id);
              setAddToTeam(null);
              showToast(`Team “${t.name}” created with ${addToTeam.name}`);
              await refresh();
            } catch (e) {
              showToast(e instanceof Error ? e.message : "Could not create team");
            }
          }}
          onClose={() => setAddToTeam(null)} />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showSettings && (
        <SettingsModal accent={accent} onAccent={setAccent} density={density} onDensity={setDensity}
          showCompleted={showCompleted} onShowCompleted={setShowCompleted}
          onReset={() => { setAccent("slate"); setDensity("comfortable"); setShowCompleted(true); showToast("Preferences reset"); }}
          onClose={() => setShowSettings(false)} />
      )}
      {legal === "terms" && <TermsModal onClose={() => setLegal(null)} />}
      {legal === "privacy" && <PrivacyModal onClose={() => setLegal(null)} />}
      {legal === "cookies" && <CookiesModal onClose={() => setLegal(null)} />}
      {legal === "about" && <AboutModal onClose={() => setLegal(null)} />}
      {legal === "status" && <StatusModal onClose={() => setLegal(null)} />}
      <Toast message={toast} />
    </div>
  );
}

function FilterPills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Filter">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize transition ${value === o ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}>
          {o.replace("-", " ")}
        </button>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <AlertTriangle className="text-rose-500" />
      <p className="mt-2 text-sm font-semibold text-rose-700">Couldn't load data from the API</p>
      <p className="mt-1 max-w-md text-[13px] text-rose-600/80">{message ?? "The service may be down."} Check your connection, then try again.</p>
      <button onClick={onRetry} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-500">Try again</button>
    </div>
  );
}
