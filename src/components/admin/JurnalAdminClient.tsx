"use client";

import { useState } from "react";
import { Calendar, Clock, Users, CheckCircle, XCircle, Search } from "lucide-react";

interface Journal {
  id: string;
  classId: string;
  teacherId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  material: string | null;
  activity: string;
  obstacles: string | null;
  solution: string | null;
  studentCount: number;
  status: string;
  class: { id: string; name: string; subject: { name: string } };
  teacher: { id: string; name: string };
}

interface ClassItem { id: string; name: string; subject: { name: string } }
interface Teacher { id: string; name: string }

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-green-100 text-green-700" },
};

export default function JurnalAdminClient({
  initialJournals,
  classes,
  teachers,
}: {
  initialJournals: Journal[];
  classes: ClassItem[];
  teachers: Teacher[];
}) {
  const [journals, setJournals] = useState(initialJournals);
  const [filterClass, setFilterClass] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const filtered = journals.filter((j) => {
    if (filterClass && j.classId !== filterClass) return false;
    if (filterTeacher && j.teacherId !== filterTeacher) return false;
    if (filterStatus && j.status !== filterStatus) return false;
    if (search && !j.activity.toLowerCase().includes(search.toLowerCase()) && !j.class.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleApprove(id: string) {
    const res = await fetch(`/api/guru/jurnal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJournals((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  }

  async function handleReject(id: string) {
    const res = await fetch(`/api/guru/jurnal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJournals((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  }

  const stats = {
    total: journals.length,
    draft: journals.filter((j) => j.status === "DRAFT").length,
    submitted: journals.filter((j) => j.status === "SUBMITTED").length,
    approved: journals.filter((j) => j.status === "APPROVED").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 font-medium">Total Jurnal</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 font-medium">Draft</p>
          <p className="mt-1 text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 font-medium">Submitted</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.submitted}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 font-medium">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jurnal..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Semua Kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Semua Tutor</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Calendar className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Tidak ada jurnal ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <div key={j.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{j.class.name}</span>
                    <span className="text-xs text-gray-500">{j.class.subject.name}</span>
                    <span className="text-xs font-medium text-gray-700">{j.teacher.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[j.status]?.cls ?? STATUS_LABELS.DRAFT.cls}`}>
                      {STATUS_LABELS[j.status]?.label ?? j.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(j.sessionDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {j.startTime} - {j.endTime}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {j.studentCount} siswa</span>
                  </div>
                  <p className="text-sm text-gray-800">{j.activity}</p>
                  {j.material && <p className="mt-1 text-xs text-gray-500">📚 {j.material}</p>}
                  {j.obstacles && <p className="mt-1 text-xs text-orange-600">⚠ {j.obstacles}</p>}
                  {j.solution && <p className="mt-0.5 text-xs text-green-600">✓ {j.solution}</p>}
                </div>
                {j.status === "SUBMITTED" && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleApprove(j.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(j.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Kembalikan ke Draft"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
