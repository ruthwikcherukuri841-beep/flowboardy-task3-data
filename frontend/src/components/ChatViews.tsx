import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Plus, Search, Send, Timer, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import type { ChatContact, ChatMessage, User } from "../types";
import { Avatar } from "./Avatar";

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPage({
  me, users, onOpenUser, onToast, onUnreadChange,
}: {
  me: string;
  users: User[];
  onOpenUser: (id: string) => void;
  onToast: (m: string) => void;
  onUnreadChange?: (total: number) => void;
}) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const ql = q.trim().toLowerCase();

  const loadInbox = () => {
    api.chatInbox()
      .then((ib) => { setContacts(ib); onUnreadChange?.(ib.reduce((s, c) => s + c.unread, 0)); })
      .catch(() => {/* keep last known state */});
  };

  const loadThread = (otherId: string) => {
    api.chatMessages(otherId)
      .then((t) => {
        setMessages(t.messages);
        loadInbox();
      })
      .catch((e) => onToast(e instanceof Error ? e.message : "Could not load messages"));
  };

  useEffect(() => {
    loadInbox();
    const t = window.setInterval(loadInbox, 9000);
    return () => { window.clearInterval(t); onUnreadChange?.(0); };
  }, []);

  // Poll the active conversation so teammates' replies show up live.
  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId);
    const t = window.setInterval(() => loadThread(activeRef.current ?? ""), 3500);
    return () => window.clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  const activeUser = activeId ? users.find((u) => u.id === activeId) : null;

  const others = useMemo(() => users.filter((u) => u.id !== me && u.id !== activeId), [users, me, activeId]);

  const filteredOthers = ql
    ? others.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(ql))
    : others.slice(0, 12);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const preview = text;
    setDraft("");
    try {
      await api.chatSend(activeId, preview);
      loadThread(activeId);
    } catch (e) {
      setDraft(preview);
      onToast(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const clearRoom = async () => {
    if (!activeId) return;
    try {
      await api.chatClear(activeId);
      setMessages([]);
      setConfirmClear(false);
      loadInbox();
      onToast("Conversation cleared");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Could not clear conversation");
    }
  };

  return (
    <section className="fade-up flex min-h-[calc(100vh-10rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          Chat <span className="text-sm font-semibold text-slate-400">{contacts.length} teammate{contacts.length === 1 ? "" : "s"}</span>
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          <Timer size={12} /> Temporary — messages auto-delete after 24h
        </span>
      </div>

      <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversations + teammates */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${activeId ? "hidden lg:block" : "block"}`}>
          <label className="relative block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a teammate…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white" aria-label="Find a teammate" />
          </label>

          {contacts.length > 0 && (
            <ul className="mt-3 space-y-1">
              {contacts.map((c) => (
                <li key={c.user.id}>
                  <button onClick={() => setActiveId(c.user.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${activeId === c.user.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}>
                    <Avatar avatar={c.user.avatar} name={c.user.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-semibold ${activeId === c.user.id ? "text-white" : "text-slate-800"}`}>{c.user.name}</span>
                      <span className={`block truncate text-[11px] ${activeId === c.user.id ? "text-slate-300" : "text-slate-400"}`}>
                        {c.unread > 0 ? "New messages" : c.lastMessage || "Say hello"}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {c.unread > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{c.unread}</span>}
                      <span className={`text-[10px] ${activeId === c.user.id ? "text-slate-300" : "text-slate-400"}`}>{fmtTime(c.lastAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{ql ? "Matching members" : "Everyone else"}</p>
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {filteredOthers.length === 0 ? (
                <li className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">
                  {ql ? "No matching member found." : "No one else in your workspace yet."}
                </li>
              ) : filteredOthers.map((u) => (
                <li key={u.id}>
                  <button onClick={() => setActiveId(u.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${activeId === u.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}>
                    <Avatar avatar={u.avatar} name={u.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-semibold ${activeId === u.id ? "text-white" : "text-slate-800"}`}>{u.name}</span>
                      <span className={`block truncate text-[11px] ${activeId === u.id ? "text-slate-300" : "text-slate-400"}`}>{u.role} · {u.location || "—"}</span>
                    </span>
                    <Plus size={14} className={`shrink-0 ${activeId === u.id ? "text-white" : "text-slate-300"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Thread */}
        {activeUser ? (
          <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${activeId ? "flex" : "hidden"} flex-col overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button onClick={() => setActiveId(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Back to conversations">
                <MessageSquare size={16} />
              </button>
              <button onClick={() => onOpenUser(activeUser.id)} className="flex min-w-0 items-center gap-2.5 text-left">
                <Avatar avatar={activeUser.avatar} name={activeUser.name} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-slate-900 hover:underline">{activeUser.name}</span>
                  <span className="block truncate text-[11px] text-slate-400">{activeUser.role}</span>
                </span>
              </button>
              {confirmClear ? (
                <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-slate-500">
                  Clear chat?
                  <button onClick={clearRoom} className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white hover:bg-rose-500">Yes</button>
                  <button onClick={() => setConfirmClear(false)} className="rounded-md border px-2 py-1">No</button>
                </span>
              ) : (
                <button onClick={() => setConfirmClear(true)} title="Clear conversation"
                  className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
              )}
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/60 px-4 py-4" style={{ minHeight: "320px", maxHeight: "55vh" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <span className="floaty flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><MessageSquare size={22} /></span>
                  <p className="text-[13px] font-semibold text-slate-700">You're connected with {activeUser.name}</p>
                  <p className="max-w-xs text-xs text-slate-400">Say hi, share updates, or send work for review. Messages delete themselves after 24 hours.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.from === me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{m.text}</p>
                        <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>{fmtTime(m.createdAt)}{mine && m.seen ? " · ✓✓" : ""}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-end gap-2 border-t border-slate-100 p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                rows={2}
                placeholder={`Message ${activeUser.name.split(" ")[0]}…`}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-indigo-400"
                aria-label="Message"
              />
              <button type="submit" disabled={!draft.trim() || sending}
                className="inline-flex h-[44px] items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send size={15} />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center lg:flex">
            <span className="floaty flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><MessageSquare size={26} /></span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Pick a teammate to chat</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Choose someone from the list to send a temporary message. Everything is stored on the API and deleted after 24 hours.</p>
          </div>
        )}
      </div>
    </section>
  );
}