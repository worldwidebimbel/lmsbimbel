"use client";

import { useState } from "react";
import {
  FileText, Download, Eye, CheckCircle, X, Sparkles, Search, FileDown,
  ChevronDown, ChevronRight, Edit3, Trash2,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  subject: { name: string };
  students: { student: { id: string; name: string } }[];
}

interface Raport {
  id: string;
  studentId: string;
  classId: string;
  semester: string;
  period: string | null;
  finalGrade: number | null;
  predicate: string | null;
  status: string;
  teacherNote: string | null;
  principalNote: string | null;
  publishedAt: string | null;
  student: { id: string; name: string };
  class: { id: string; name: string; subject: { name: string } };
  academicYear: { id: string; name: string } | null;
}

interface AcademicYear { id: string; name: string }

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  PUBLISHED: { label: "Published", cls: "bg-green-100 text-green-700" },
};

const PREDICATE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-orange-100 text-orange-700",
  E: "bg-red-100 text-red-700",
};

export default function RaportAdminClient({
  classes,
  initialRaports,
  academicYears,
  isGuru,
}: {
  classes: ClassItem[];
  initialRaports: Raport[];
  academicYears: AcademicYear[];
  isGuru: boolean;
}) {
  const [raports, setRaports] = useState(initialRaports);
  const [filterClass, setFilterClass] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [search, setSearch] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ teacherNote: "", principalNote: "", description: "" });

  const filtered = raports.filter((r) => {
    if (filterClass && r.classId !== filterClass) return false;
    if (filterSemester && r.semester !== filterSemester) return false;
    if (search && !r.student.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleGenerate(classId: string, studentIds: string[], semester: string, period: string, academicYearId: string) {
    const res = await fetch("/api/raport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, studentIds, semester, period: period || null, academicYearId: academicYearId || null }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`${data.generated} raport berhasil digenerate!`);
      setShowGenerate(false);
      window.location.reload();
    } else {
      const err = await res.json();
      alert(err.error ?? "Gagal generate raport");
    }
  }

  async function handlePublish(id: string) {
    const res = await fetch(`/api/raport/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRaports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated, student: r.student, class: r.class, academicYear: r.academicYear } : r)));
    }
  }

  async function handleUnpublish(id: string) {
    const res = await fetch(`/api/raport/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRaports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated, student: r.student, class: r.class, academicYear: r.academicYear } : r)));
    }
  }

  async function handleSaveNotes(id: string) {
    const res = await fetch(`/api/raport/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherNote: editForm.teacherNote || null,
        principalNote: isGuru ? undefined : (editForm.principalNote || null),
        description: editForm.description || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRaports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated, student: r.student, class: r.class, academicYear: r.academicYear } : r)));
      setEditingId(null);
    }
  }

  function startEdit(r: Raport) {
    setEditForm({
      teacherNote: r.teacherNote ?? "",
      principalNote: r.principalNote ?? "",
      description: "",
    });
    setEditingId(r.id);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/raport/${id}`, { method: "DELETE" });
    if (res.ok) setRaports((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Semua Kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Semua Semester</option>
          <option value="GANJIL">Ganjil</option>
          <option value="GENAP">Genap</option>
        </select>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Sparkles className="h-4 w-4" /> Generate Raport
        </button>
        <a
          href={`/api/raport/export${filterClass ? `?classId=${filterClass}` : ""}`}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <FileDown className="h-4 w-4" /> Export Excel
        </a>
      </div>

      {/* Raport List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <FileText className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Belum ada raport. Klik "Generate Raport" untuk membuat.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="shrink-0 rounded-lg p-1 hover:bg-gray-100"
                >
                  {expandedId === r.id
                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                    : <ChevronRight className="h-4 w-4 text-gray-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{r.student.name}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{r.class.name}</span>
                    <span className="text-xs text-gray-500">{r.semester}</span>
                    {r.period && <span className="text-xs text-gray-400">{r.period}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[r.status]?.cls ?? STATUS_LABELS.DRAFT.cls}`}>
                      {STATUS_LABELS[r.status]?.label ?? r.status}
                    </span>
                  </div>
                </div>
                {r.finalGrade !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{r.finalGrade.toFixed(1)}</span>
                    {r.predicate && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PREDICATE_COLORS[r.predicate] ?? "bg-gray-100"}`}>
                        {r.predicate}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={`/api/raport/${r.id}/pdf`}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => startEdit(r)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    title="Edit Catatan"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {r.status === "DRAFT" ? (
                    <button
                      onClick={() => handlePublish(r.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                      title="Publikasi"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(r.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600"
                      title="Kembalikan ke Draft"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {!isGuru && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === r.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2 text-sm">
                  {r.teacherNote && (
                    <div>
                      <span className="font-medium text-gray-700">Catatan Tutor: </span>
                      <span className="text-gray-600">{r.teacherNote}</span>
                    </div>
                  )}
                  {r.principalNote && (
                    <div>
                      <span className="font-medium text-gray-700">Catatan Kepala: </span>
                      <span className="text-gray-600">{r.principalNote}</span>
                    </div>
                  )}
                  {r.publishedAt && (
                    <div className="text-xs text-gray-400">
                      Dipublikasi: {new Date(r.publishedAt).toLocaleDateString("id-ID")}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Notes Inline */}
              {editingId === r.id && (
                <div className="border-t border-gray-100 bg-amber-50/50 p-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Catatan Tutor</label>
                    <textarea
                      value={editForm.teacherNote}
                      onChange={(e) => setEditForm({ ...editForm, teacherNote: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
                      placeholder="Catatan untuk siswa..."
                    />
                  </div>
                  {!isGuru && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Catatan Kepala Bimbel</label>
                      <textarea
                        value={editForm.principalNote}
                        onChange={(e) => setEditForm({ ...editForm, principalNote: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
                        placeholder="Catatan dari kepala..."
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
                    <button onClick={() => handleSaveNotes(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">Simpan</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateRaportModal
          classes={classes}
          academicYears={academicYears}
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}

function GenerateRaportModal({
  classes,
  academicYears,
  onClose,
  onGenerate,
}: {
  classes: ClassItem[];
  academicYears: AcademicYear[];
  onClose: () => void;
  onGenerate: (classId: string, studentIds: string[], semester: string, period: string, academicYearId: string) => void;
}) {
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState("GANJIL");
  const [period, setPeriod] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const selectedClass = classes.find((c) => c.id === classId);

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (!selectedClass) return;
    if (selectedStudents.size === selectedClass.students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(selectedClass.students.map((s) => s.student.id)));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Generate Raport</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kelas *</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSelectedStudents(new Set()); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">— Pilih Kelas —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Semester *</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="GANJIL">Ganjil</option>
              <option value="GENAP">Genap</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Periode (opsional)</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Contoh: 2026/2027" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tahun Ajaran</label>
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">— Otomatis —</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
        </div>

        {selectedClass && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Pilih Siswa ({selectedStudents.size}/{selectedClass.students.length})</label>
              <button onClick={toggleAll} className="text-xs text-emerald-600 hover:underline">
                {selectedStudents.size === selectedClass.students.length ? "Hapus semua" : "Pilih semua"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {selectedClass.students.map((s) => (
                <label key={s.student.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(s.student.id)}
                    onChange={() => toggleStudent(s.student.id)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span className="text-sm text-gray-700">{s.student.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
          <button
            onClick={() => onGenerate(classId, [...selectedStudents], semester, period, academicYearId)}
            disabled={!classId || selectedStudents.size === 0}
            className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Generate ({selectedStudents.size})
          </button>
        </div>
      </div>
    </div>
  );
}
