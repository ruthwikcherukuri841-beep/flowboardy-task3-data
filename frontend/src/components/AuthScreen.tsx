import { useState } from "react";
import { AlertCircle, ArrowRight, CheckSquare, FolderKanban, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        if (name.trim().length < 2) throw new Error("Please enter your name");
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* Brand panel */}
      <div className="hidden w-[44%] flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-black text-slate-950">F</span>
          <span className="text-lg font-extrabold tracking-tight">FlowBoard</span>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight">
            Project tracking your standup will actually read.
          </h1>
          <ul className="mt-6 space-y-3.5">
            {[
              [LayoutDashboard, "Overview your whole sprint in one glance"],
              [FolderKanban, "Projects with real progress, owners, dates"],
              [CheckSquare, "Tasks with status, priority, and accountability"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof LayoutDashboard;
              return (
                <li key={text as string} className="flex items-center gap-3 text-[14px] text-white/75">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><I size={16} /></span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs text-white/40">Focus. Track. Ship. · Your workspace persists in the database.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">F</span>
            <span className="text-base font-extrabold text-slate-900">FlowBoard</span>
          </div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 lg:mt-0">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login" ? "Sign in to open your workspace." : "One account, your whole board — projects and tasks included."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1" role="tablist" aria-label="Auth mode">
            {(["login", "register"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null); }}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "register" && (
              <label className="block text-[13px] font-medium text-slate-700">
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500" />
              </label>
            )}
            <label className="block text-[13px] font-medium text-slate-700">
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" type="email" required autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500" />
            </label>
            <label className="block text-[13px] font-medium text-slate-700">
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "At least 6 characters" : "Your password"} type="password" required minLength={mode === "register" ? 6 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500" />
            </label>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-medium text-rose-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
