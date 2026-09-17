import { Compass, Home } from "lucide-react";

export function NotFound({ onHome, message }: { onHome: () => void; message?: string }) {
  return (
    <section className="fade-up flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <span className="floaty flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 text-4xl font-black text-white shadow-xl">404</span>
        <span className="floaty-slow absolute -right-10 -top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500"><Compass size={24} /></span>
        <span className="absolute -left-9 bottom-2 h-5 w-5 rounded-full bg-rose-200" />
        <span className="spin-slow absolute -left-4 -top-4 h-8 w-8 rounded-full border-4 border-dashed border-amber-300" />
      </div>
      <h1 className="mt-8 text-xl font-bold tracking-tight text-slate-900">This page drifted off course</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {message ?? "The link you followed doesn't lead anywhere. The board is empty over here — let's get you back to your workspace."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button onClick={onHome} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-700">
          <Home size={15} /> Back to Overview
        </button>
        <button onClick={() => window.location.reload()} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">
          Reload page
        </button>
      </div>
    </section>
  );
}