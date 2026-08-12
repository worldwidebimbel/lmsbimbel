"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  isActive: boolean;
}

export default function TeamManager({ members: initial }: { members: Member[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [newM, setNewM] = useState({ name: "", role: "", bio: "", photoUrl: "", email: "", phone: "", linkedin: "" });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newM),
      });
      if (res.ok) {
        const m = await res.json();
        setMembers((p) => [...p, m]);
        setNewM({ name: "", role: "", bio: "", photoUrl: "", email: "", phone: "", linkedin: "" });
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus anggota tim ini?")) return;
    startTransition(async () => {
      await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      setMembers((p) => p.filter((m) => m.id !== id));
      router.refresh();
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setMembers((p) => p.map((m) => m.id === id ? { ...m, isActive: !current } : m));
    });
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600">
          <Plus className="h-4 w-4" /> Tambah Anggota Tim
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newM.name} onChange={(e) => setNewM((p) => ({ ...p, name: e.target.value }))} placeholder="Nama *" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={newM.role} onChange={(e) => setNewM((p) => ({ ...p, role: e.target.value }))} placeholder="Jabatan/Peran *" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <textarea value={newM.bio} onChange={(e) => setNewM((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio singkat" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={newM.photoUrl} onChange={(e) => setNewM((p) => ({ ...p, photoUrl: e.target.value }))} placeholder="URL foto" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <input value={newM.email} onChange={(e) => setNewM((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={newM.phone} onChange={(e) => setNewM((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={newM.linkedin} onChange={(e) => setNewM((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn URL" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Batal</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {members.map((m) => (
          <div key={m.id} className={`rounded-xl border bg-white p-4 ${m.isActive ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-start gap-3">
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="font-bold text-indigo-600">{m.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-indigo-600">{m.role}</p>
                {m.bio && <p className="text-xs text-gray-500 mt-1">{m.bio}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => handleToggle(m.id, m.isActive)} className="text-xs text-gray-400 hover:text-gray-700">
                  {m.isActive ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button onClick={() => handleDelete(m.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
