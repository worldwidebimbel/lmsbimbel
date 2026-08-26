"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, Trash2, UserPlus, BookOpen, ClipboardList, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

interface Student { id: string; name: string; email: string }
interface ClassStudent { student: Student }
interface Schedule { id: string; dayOfWeek: string; startTime: string; endTime: string; roomRel: { name: string } | null }
interface Subject { id: string; name: string; code: string; color: string }
interface Teacher { id: string; name: string }
interface Branch { id: string; name: string; code: string }
interface Room { id: string; name: string; roomNumber: string | null }
interface ClassData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  maxStudents: number;
  roomId: string | null;
  roomRel: { id: string; name: string } | null;
  isActive: boolean;
  subjectId: string;
  teacherId: string;
  branchId: string | null;
  subject: Subject;
  teacher: Teacher;
  branch: Branch | null;
  students: ClassStudent[];
  schedules: Schedule[];
  _count: { materials: number; assignments: number };
}

const DAY_LABEL: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu", KAMIS: "Kamis",
  JUMAT: "Jumat", SABTU: "Sabtu", MINGGU: "Minggu",
};

export default function ClassDetailClient({ cls, allStudents, subjects, teachers, branches, rooms, isSuperAdmin }: { cls: ClassData; allStudents: Student[]; subjects: Subject[]; teachers: Teacher[]; branches: Branch[]; rooms: Room[]; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [students, setStudents] = useState<ClassStudent[]>(cls.students);
  const [isActive, setIsActive] = useState(cls.isActive);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [enrollError, setEnrollError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: cls.name,
    description: cls.description ?? "",
    subjectId: cls.subject.id,
    teacherId: cls.teacher.id,
    branchId: cls.branchId ?? "",
    type: cls.type,
    maxStudents: cls.maxStudents,
    room: cls.roomId ?? "",
  });
  const [editError, setEditError] = useState("");
  const [editPending, startEditTransition] = useTransition();
  const [deleteError, setDeleteError] = useState("");
  const [deleteCounts, setDeleteCounts] = useState<{ students: number; schedules: number; materials: number; assignments: number } | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const enrolledIds = new Set(students.map((cs) => cs.student.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  function handleEnroll() {
    if (!selectedStudent) return;
    setEnrollError("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/classes/${cls.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent }),
      });
      if (!res.ok) {
        const d = await res.json();
        setEnrollError(d.error ?? "Gagal mendaftarkan siswa");
        return;
      }
      const record = await res.json();
      setStudents((prev) => [...prev, record]);
      setSelectedStudent("");
    });
  }

  async function handleRemove(studentId: string) {
    if (!confirm("Keluarkan siswa ini dari kelas?")) return;
    const res = await fetch(`/api/admin/classes/${cls.id}/students?studentId=${studentId}`, { method: "DELETE" });
    if (res.ok) setStudents((prev) => prev.filter((cs) => cs.student.id !== studentId));
  }

  async function handleToggleActive() {
    const res = await fetch(`/api/admin/classes/${cls.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) setIsActive(!isActive);
  }

  function handleEditChange(k: string, v: string | number) {
    setEditForm((p) => ({ ...p, [k]: v }));
  }

  function handleSaveEdit() {
    setEditError("");
    startEditTransition(async () => {
      const res = await fetch(`/api/admin/classes/${cls.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          roomId: editForm.room || null,
          maxStudents: Number(editForm.maxStudents),
          branchId: isSuperAdmin ? editForm.branchId : cls.branchId,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setEditError(d.error ?? "Gagal menyimpan perubahan");
        return;
      }
      setIsEditing(false);
      window.location.reload();
    });
  }

  function handleDeleteClass() {
    setDeleteError("");
    setDeleteCounts(null);
    if (!confirm(`Hapus kelas "${cls.name}"? Kelas akan dinonaktifkan.`)) return;
    startDeleteTransition(async () => {
      const res = await fetch(`/api/admin/classes/${cls.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 409) {
        const d = await res.json();
        setDeleteCounts(d.counts);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d.error ?? "Gagal menghapus kelas");
        return;
      }
      router.push("/admin/classes");
      router.refresh();
    });
  }

  function handleForceDelete() {
    startDeleteTransition(async () => {
      const res = await fetch(`/api/admin/classes/${cls.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d.error ?? "Gagal menghapus kelas");
        return;
      }
      router.push("/admin/classes");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Info Kelas</h3>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:underline">
                  Edit
                </button>
              )}
              <button onClick={handleToggleActive} className="text-gray-400 hover:text-gray-600">
                {isActive
                  ? <ToggleRight className="h-6 w-6 text-green-500" />
                  : <ToggleLeft className="h-6 w-6 text-gray-400" />}
              </button>
            </div>
          </div>

          {deleteError && (
            <p className="text-xs text-red-600">{deleteError}</p>
          )}

          {deleteCounts && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Kelas masih memiliki data terkait</span>
              </div>
              <div className="text-xs text-amber-600 space-y-0.5">
                {deleteCounts.students > 0 && <div>• {deleteCounts.students} siswa terdaftar</div>}
                {deleteCounts.schedules > 0 && <div>• {deleteCounts.schedules} jadwal</div>}
                {deleteCounts.materials > 0 && <div>• {deleteCounts.materials} materi</div>}
                {deleteCounts.assignments > 0 && <div>• {deleteCounts.assignments} tugas</div>}
              </div>
              <p className="text-xs text-amber-600">Nonaktifkan kelas saja, atau hapus paksa (data tetap ada di database)?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleForceDelete}
                  disabled={deletePending}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deletePending ? "Memproses..." : "Hapus Paksa"}
                </button>
                <button
                  onClick={() => setDeleteCounts(null)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              {editError && <p className="text-xs text-red-600">{editError}</p>}
              <div>
                <label className="text-xs text-gray-500">Nama</label>
                <input value={editForm.name} onChange={(e) => handleEditChange("name", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Mata Pelajaran</label>
                <select value={editForm.subjectId} onChange={(e) => handleEditChange("subjectId", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm">
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Guru</label>
                <select value={editForm.teacherId} onChange={(e) => handleEditChange("teacherId", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {isSuperAdmin && (
                <div>
                  <label className="text-xs text-gray-500">Cabang</label>
                  <select value={editForm.branchId} onChange={(e) => handleEditChange("branchId", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm">
                    <option value="">Pilih cabang</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500">Tipe</label>
                <select value={editForm.type} onChange={(e) => handleEditChange("type", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm">
                  <option value="REGULER">Reguler</option>
                  <option value="PRIVAT">Privat</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Maks. Siswa</label>
                <input type="number" value={editForm.maxStudents} onChange={(e) => handleEditChange("maxStudents", parseInt(e.target.value) || 0)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ruangan</label>
                <select value={editForm.room} onChange={(e) => handleEditChange("room", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm">
                  <option value="">— Tanpa ruangan —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.roomNumber ? ` (${r.roomNumber})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Deskripsi</label>
                <textarea value={editForm.description} onChange={(e) => handleEditChange("description", e.target.value)} rows={2} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveEdit} disabled={editPending} className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {editPending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                  Simpan
                </button>
                <button onClick={() => setIsEditing(false)} className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Batal</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipe</span>
                <span className="text-gray-700">{cls.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cabang</span>
                <span className="text-gray-700">{cls.branch?.name ?? "Pusat"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kapasitas</span>
                <span className="text-gray-700">{students.length}/{cls.maxStudents}</span>
              </div>
              {cls.roomRel && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ruangan</span>
                  <span className="text-gray-700">{cls.roomRel.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Materi</span>
                <span className="text-gray-700">{cls._count.materials}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tugas</span>
                <span className="text-gray-700">{cls._count.assignments}</span>
              </div>
            </div>
          )}
          {cls.description && !isEditing && (
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">{cls.description}</p>
          )}

          {!isEditing && !deleteCounts && (
            <button
              onClick={handleDeleteClass}
              disabled={deletePending}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Hapus Kelas
            </button>
          )}
        </div>

        {cls.schedules.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Jadwal</h3>
            <div className="space-y-2">
              {cls.schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{DAY_LABEL[s.dayOfWeek]}</span>
                  <span className="text-gray-500">{s.startTime} – {s.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <a href={`/admin/classes/${cls.id}/schedules`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50">
            <ClipboardList className="h-4 w-4 text-blue-500" />
            Kelola Jadwal
          </a>
          <a href={`/guru/materi?classId=${cls.id}`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Lihat Materi
          </a>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Daftar Siswa ({students.length}/{cls.maxStudents})</h3>
          </div>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 flex gap-2 items-end">
          {enrollError && <p className="w-full text-xs text-red-600">{enrollError}</p>}
          <div className="flex-1">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Pilih siswa untuk didaftarkan...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleEnroll}
            disabled={!selectedStudent || isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Daftarkan
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Belum ada siswa terdaftar</p>
            </div>
          ) : (
            students.map((cs, idx) => (
              <div key={cs.student.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs text-gray-400">{idx + 1}.</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {cs.student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cs.student.name}</p>
                    <p className="text-xs text-gray-400">{cs.student.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(cs.student.id)}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
