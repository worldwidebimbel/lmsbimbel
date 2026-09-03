"use client";

import { useState } from "react";
import { Plus, ThumbsUp, MessageSquare, Pin, Lock, Eye, Search, X, Send, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Author { id: string; name: string; avatar: string | null; role: string }
interface Reply {
  id: string; content: string; isAnswer: boolean; createdAt: string;
  author: Author; _count: { upvotes: number };
}
interface Thread {
  id: string; title: string; content: string; isPinned: boolean; isLocked: boolean;
  viewCount: number; createdAt: string; updatedAt: string;
  author: Author; class: { id: string; name: string } | null;
  subject: { id: string; name: string; color: string } | null;
  _count: { replies: number; upvotes: number };
}
interface ClassItem { id: string; name: string }

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  GURU: { label: "Guru", cls: "bg-purple-100 text-purple-700" },
  ADMIN: { label: "Admin", cls: "bg-red-100 text-red-700" },
  SUPER_ADMIN: { label: "Admin", cls: "bg-red-100 text-red-700" },
  SISWA: { label: "Siswa", cls: "bg-blue-100 text-blue-700" },
};

function Avatar({ name, avatar, size = "md" }: { name: string; avatar: string | null; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${sz} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 font-bold text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Props {
  initialThreads: Thread[];
  classes: ClassItem[];
  currentUserId: string;
  currentUserRole: string;
  isTeacher?: boolean;
}

export default function ForumClient({ initialThreads, classes, currentUserId, currentUserRole, isTeacher }: Props) {
  const [threads, setThreads] = useState(initialThreads);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [createForm, setCreateForm] = useState({ classId: "", title: "", content: "" });
  const [creating, setCreating] = useState(false);

  const filtered = threads.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || t.class?.id === filterClass;
    return matchSearch && matchClass;
  });

  async function openThread(thread: Thread) {
    setSelectedThread(thread);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies ?? []);
      }
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleCreate() {
    if (!createForm.title.trim() || !createForm.content.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: createForm.classId || null, title: createForm.title, content: createForm.content }),
      });
      if (res.ok) {
        const t = await res.json();
        setThreads((prev) => [t, ...prev]);
        setShowCreate(false);
        setCreateForm({ classId: "", title: "", content: "" });
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleReply() {
    if (!selectedThread || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/forum/threads/${selectedThread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        const r = await res.json();
        setReplies((prev) => [...prev, r]);
        setReplyContent("");
        setThreads((prev) => prev.map((t) => t.id === selectedThread.id
          ? { ...t, _count: { ...t._count, replies: t._count.replies + 1 } } : t));
      }
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleUpvote(type: "thread" | "reply", id: string) {
    await fetch("/api/forum/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "thread" ? { threadId: id } : { replyId: id }),
    });
    if (type === "thread") {
      setThreads((prev) => prev.map((t) => t.id === id
        ? { ...t, _count: { ...t._count, upvotes: t._count.upvotes + 1 } } : t));
      if (selectedThread?.id === id) {
        setSelectedThread((prev) => prev ? { ...prev, _count: { ...prev._count, upvotes: prev._count.upvotes + 1 } } : prev);
      }
    } else {
      setReplies((prev) => prev.map((r) => r.id === id
        ? { ...r, _count: { ...r._count, upvotes: r._count.upvotes + 1 } } : r));
    }
  }

  async function handleDeleteThread(threadId: string) {
    if (!confirm("Hapus thread ini?")) return;
    const res = await fetch(`/api/forum/threads/${threadId}`, { method: "DELETE" });
    if (res.ok) {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (selectedThread?.id === threadId) setSelectedThread(null);
    }
  }

  if (selectedThread) {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedThread(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Forum
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {selectedThread.isPinned && <span className="flex items-center gap-1 text-xs text-yellow-600"><Pin className="h-3 w-3" /> Pinned</span>}
                {selectedThread.isLocked && <span className="flex items-center gap-1 text-xs text-gray-500"><Lock className="h-3 w-3" /> Locked</span>}
                {selectedThread.class && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{selectedThread.class.name}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedThread.title}</h2>
            </div>
            {(selectedThread.author.id === currentUserId || ["ADMIN", "SUPER_ADMIN", "GURU"].includes(currentUserRole)) && (
              <button onClick={() => handleDeleteThread(selectedThread.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={selectedThread.author.name} avatar={selectedThread.author.avatar} size="sm" />
            <span className="text-sm font-medium text-gray-800">{selectedThread.author.name}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${ROLE_BADGE[selectedThread.author.role]?.cls}`}>
              {ROLE_BADGE[selectedThread.author.role]?.label}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(selectedThread.createdAt), { addSuffix: true, locale: localeId })}
            </span>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {selectedThread.content}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <button onClick={() => handleUpvote("thread", selectedThread.id)} className="flex items-center gap-1.5 hover:text-blue-600">
              <ThumbsUp className="h-4 w-4" /> {selectedThread._count.upvotes}
            </button>
            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {selectedThread.viewCount}</span>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">{replies.length} Jawaban</h3>
          {loadingThread ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 space-y-3 ${r.isAnswer ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-white"}`}>
                {r.isAnswer && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                    ✓ Jawaban Terbaik
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Avatar name={r.author.name} avatar={r.author.avatar} size="sm" />
                  <span className="text-sm font-medium text-gray-800">{r.author.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${ROLE_BADGE[r.author.role]?.cls}`}>
                    {ROLE_BADGE[r.author.role]?.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: localeId })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.content}</p>
                <button onClick={() => handleUpvote("reply", r.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600">
                  <ThumbsUp className="h-3.5 w-3.5" /> {r._count.upvotes}
                </button>
              </div>
            ))
          )}
        </div>

        {!selectedThread.isLocked && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Tulis Jawaban</h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Tulis jawaban atau komentar..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end">
              <button
                onClick={handleReply}
                disabled={!replyContent.trim() || submittingReply}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari diskusi..." className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {classes.length > 0 && (
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Kelas</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 ml-auto">
          <Plus className="h-4 w-4" /> Buat Thread
        </button>
      </div>

      {/* Thread List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <MessagesSquare className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada diskusi. Mulai thread pertama!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((thread) => (
            <div key={thread.id}
              onClick={() => openThread(thread)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <Avatar name={thread.author.name} avatar={thread.author.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {thread.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500" />}
                    {thread.isLocked && <Lock className="h-3.5 w-3.5 text-gray-500" />}
                    {thread.class && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{thread.class.name}</span>
                    )}
                    {thread.subject && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: thread.subject.color + "20", color: thread.subject.color }}>
                        {thread.subject.name}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 line-clamp-1">{thread.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{thread.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{thread.author.name}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {thread._count.upvotes}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {thread._count.replies}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {thread.viewCount}</span>
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true, locale: localeId })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Thread Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Buat Thread Baru</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-500 hover:text-gray-600" /></button>
            </div>
            {classes.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kelas</label>
                <select value={createForm.classId} onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">— Umum (semua kelas) —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Judul Thread *</label>
              <input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Pertanyaan atau topik diskusi..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Isi / Pertanyaan *</label>
              <textarea value={createForm.content} onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                placeholder="Jelaskan pertanyaan atau topik diskusi kamu..." rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleCreate} disabled={!createForm.title.trim() || !createForm.content.trim() || creating}
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Buat Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessagesSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}
