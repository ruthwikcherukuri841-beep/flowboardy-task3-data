import { useState } from "react";
import { ArrowLeft, ArrowRight, Flag, FolderKanban, ListChecks, Sparkles } from "lucide-react";

interface Step {
  icon: typeof Sparkles;
  kicker: string;
  title: string;
  body: string[];
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    kicker: "Welcome",
    title: "Welcome to FlowBoard",
    body: [
      "Your workspace is a clean board where Projects group related work and Tasks live inside them, each with a status, priority and due date.",
      "Everything you create is saved to your account automatically — sign out and back in and it's still here.",
    ],
    bullets: ["Projects → folders for work like “Website launch”", "Tasks → the to-dos inside a project", "Overview → your daily standup summary"],
  },
  {
    icon: FolderKanban,
    kicker: "Step 1 of 3",
    title: "Create your first project",
    body: [
      "Projects are the folders of your workspace. Name one, give it a short description and a due date, and you're ready to put tasks inside it.",
    ],
    bullets: ["Project name — what you're delivering", "Description — the goal in one or two lines", "Due date — when it should be shipped"],
  },
  {
    icon: ListChecks,
    kicker: "Step 2 of 3",
    title: "Add your first task",
    body: [
      "Tasks are the actual work. Pick the project, write the task, set a priority (Low / Medium / High) and a date.",
      "From any task card you can move it To do → In progress → Done.",
    ],
    bullets: ["Title — a clear verb + outcome, e.g. “Write empty-state copy”", "Priority — so the important work floats up", "Status — To do, In progress, or Done"],
  },
  {
    icon: Flag,
    kicker: "Step 3 of 3",
    title: "Track and ship",
    body: [
      "You're all set. Scan the Overview each morning, filter by priority or status, and use the shortcuts:",
    ],
    bullets: ["N — new task · P — new project · / — search", "Press ? any time for the full shortcut list", "Your data lives in your FlowBoard account"],
  },
];

export function Onboarding({
  hasProjects,
  onCreateProject,
  onCreateTask,
  onDone,
}: {
  hasProjects: boolean;
  onCreateProject: () => void;
  onCreateTask: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={s.title}>
      <div className="modal-rise relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-extrabold text-white">F</span>
            <span className="text-sm font-bold tracking-tight text-slate-900">FlowBoard</span>
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-slate-900" : "w-1.5 bg-slate-200"}`} />
            ))}
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-indigo-600">{s.kicker}</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{s.title}</h2>
          <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-slate-600">
            {s.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {s.bullets && (
            <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3.5">
              {s.bullets.map((b, i) => <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-700"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />{b}</li>)}
            </ul>
          )}

          {step === 1 && (
            <div className="mt-4">
              <button onClick={() => { onCreateProject(); setStep(2); }} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-700">
                Create my first project
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="mt-4">
              {!hasProjects ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                  You need a project first. Go back and create one, or add one anytime from the Projects tab.
                </div>
              ) : (
                <button onClick={() => { onCreateTask(); setStep(3); }} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-500">
                  Add my first task
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5">
          {step > 0 ? (
            <button onClick={() => setStep((v) => v - 1)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100">
              <ArrowLeft size={14} /> Back
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={onDone} className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600">Skip tour</button>
            {step === 3 ? (
              <button onClick={onDone} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-700">
                Start using FlowBoard <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={() => setStep((v) => v + 1)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}