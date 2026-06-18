"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, X, UserCheck } from "lucide-react";

interface Student {
  id: string; name: string; email: string; avatar: string | null;
}

export default function ParentChildrenClient({
  parentId, initialChildren, availableStudents,
}: {
  parentId: string;
  initialChildren: Student[];
  availableStudents: Student[];
}) {
  const [children, setChildren] = useState<Student[]>(initialChildren);
  const [students] = useState<Student[]>(availableStudents);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdd() {
    if (!selectedStudent) return;
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/parent-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, childId: selectedStudent }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal menghubungkan"); return; }
      setChildren((prev) => [...prev, data.child].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedStudent("");
    });
  }

  async function handleRemove(childId: string) {
    if (!confirm("Lepas hubungan dengan anak ini?")) return;
    const res = await fetch("/api/admin/parent-child", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, childId }),
    });
    if (res.ok) setChildren((prev) => prev.filter((c) => c.id !== childId));
  }

  return (
    <div className="space-y-5">
      {/* Assign Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Tambah Anak</h3>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Pilih Siswa</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Pilih siswa --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} disabled={isPending || !selectedStudent}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4" /> Hubungkan
          </button>
        </div>
        {students.length === 0 && <p className="text-sm text-gray-400 mt-2">Semua siswa sudah terhubung</p>}
      </div>

      {/* Children List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold text-gray-900">Daftar Anak Terhubung</h3>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{children.length} anak</span>
        </div>
        {children.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <UserCheck className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Belum ada anak yang terhubung</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {child.avatar ? (
                    <img src={child.avatar} alt={child.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {child.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                    <p className="text-xs text-gray-400">{child.email}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(child.id)}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
