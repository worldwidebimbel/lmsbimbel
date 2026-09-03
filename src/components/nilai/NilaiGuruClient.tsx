"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, Save, BarChart3, Trophy } from "lucide-react";

interface GradeEntry { id: string; studentId: string; componentId: string; score: number; note: string | null }
interface GradeComponent { id: string; name: string; weight: number; period: string | null; order: number; grades: GradeEntry[] }
interface ClassStudent { student: { id: string; name: string } }
interface ClassItem {
  id: string;
  name: string;
  students: ClassStudent[];
  gradeComponents: GradeComponent[];
}

interface NilaiGuruClientProps {
  initialClasses: ClassItem[];
}

export default function NilaiGuruClient({ initialClasses }: NilaiGuruClientProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(initialClasses[0] ?? null);
  const [isPending, startTransition] = useTransition();

  const [newComp, setNewComp] = useState({ name: "", weight: "1", period: "" });
  const [addingComp, setAddingComp] = useState(false);

  const [scoreMap, setScoreMap] = useState<Record<string, Record<string, string>>>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const cls = classes.find((c) => c.id === selectedClass?.id) ?? null;

  function getScore(studentId: string, componentId: string): string {
    const existing = cls?.gradeComponents
      .find((c) => c.id === componentId)
      ?.grades.find((g) => g.studentId === studentId);
    return scoreMap[studentId]?.[componentId] ?? (existing ? String(existing.score) : "");
  }

  function setScore(studentId: string, componentId: string, value: string) {
    setScoreMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [componentId]: value },
    }));
  }

  function calcNilaiAkhir(studentId: string): string {
    if (!cls || cls.gradeComponents.length === 0) return "—";
    let totalWeight = 0;
    let totalScore = 0;
    for (const comp of cls.gradeComponents) {
      const s = parseFloat(getScore(studentId, comp.id));
      if (!isNaN(s)) {
        totalScore += s * comp.weight;
        totalWeight += comp.weight;
      }
    }
    if (totalWeight === 0) return "—";
    return (totalScore / totalWeight).toFixed(1);
  }

  async function handleAddComponent(e: React.FormEvent) {
    e.preventDefault();
    if (!cls) return;
    startTransition(async () => {
      const res = await fetch("/api/nilai/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id, name: newComp.name, weight: Number(newComp.weight), period: newComp.period || null }),
      });
      if (res.ok) {
        const comp = await res.json();
        setClasses((prev) => prev.map((c) =>
          c.id === cls.id ? { ...c, gradeComponents: [...c.gradeComponents, { ...comp, grades: [] }] } : c
        ));
        setNewComp({ name: "", weight: "1", period: "" });
        setAddingComp(false);
      }
    });
  }

  async function handleDeleteComponent(compId: string) {
    if (!cls || !confirm("Hapus komponen ini? Semua nilai akan ikut terhapus.")) return;
    const res = await fetch(`/api/nilai/components/${compId}`, { method: "DELETE" });
    if (res.ok) {
      setClasses((prev) => prev.map((c) =>
        c.id === cls.id ? { ...c, gradeComponents: c.gradeComponents.filter((x) => x.id !== compId) } : c
      ));
    }
  }

  async function handleSaveGrades() {
    if (!cls) return;
    setSavingGrades(true);
    setSaveMsg("");
    try {
      const grades: { studentId: string; componentId: string; score: number }[] = [];
      for (const student of cls.students) {
        for (const comp of cls.gradeComponents) {
          const raw = getScore(student.student.id, comp.id);
          const score = parseFloat(raw);
          if (!isNaN(score)) {
            grades.push({ studentId: student.student.id, componentId: comp.id, score });
          }
        }
      }
      if (grades.length === 0) { setSaveMsg("Tidak ada nilai yang diubah"); return; }
      const res = await fetch("/api/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      if (res.ok) {
        const { count } = await res.json();
        setSaveMsg(`✅ ${count} nilai berhasil disimpan`);
        setScoreMap({});
        const updated = await fetch(`/api/nilai?classId=${cls.id}`).then((r) => r.json());
        setClasses((prev) => prev.map((c) =>
          c.id === cls.id ? {
            ...c,
            gradeComponents: c.gradeComponents.map((comp) => ({
              ...comp,
              grades: updated.filter((g: GradeEntry) => g.componentId === comp.id),
            })),
          } : c
        ));
      }
    } finally {
      setSavingGrades(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  const rankings = cls?.students
    .map((cs) => ({ name: cs.student.name, nilai: parseFloat(calcNilaiAkhir(cs.student.id)) || 0 }))
    .sort((a, b) => b.nilai - a.nilai) ?? [];

  return (
    <div className="space-y-5">
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <BarChart3 className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada kelas aktif</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedClass(c); setScoreMap({}); setSaveMsg(""); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${selectedClass?.id === c.id ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 text-gray-700 hover:border-purple-300"}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {cls && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">Komponen Nilai — {cls.name}</h2>
                  <button
                    onClick={() => setAddingComp(!addingComp)}
                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700 hover:bg-purple-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
                  <button
                    onClick={handleSaveGrades}
                    disabled={savingGrades}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingGrades ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan Nilai
                  </button>
                </div>
              </div>

              {addingComp && (
                <form onSubmit={handleAddComponent} className="flex flex-wrap gap-3 items-end rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nama Komponen *</label>
                    <input
                      required
                      value={newComp.name}
                      onChange={(e) => setNewComp((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Contoh: UH 1, UTS, Tugas"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none w-44"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Bobot</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={newComp.weight}
                      onChange={(e) => setNewComp((p) => ({ ...p, weight: e.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none w-20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Periode</label>
                    <input
                      value={newComp.period}
                      onChange={(e) => setNewComp((p) => ({ ...p, period: e.target.value }))}
                      placeholder="Sem 1, 2025"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none w-28"
                    />
                  </div>
                  <button type="submit" disabled={isPending} className="flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Tambah
                  </button>
                </form>
              )}

              {cls.gradeComponents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada komponen nilai. Tambah dulu di atas.</p>
              ) : cls.students.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada siswa di kelas ini.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-40">Nama Siswa</th>
                        {cls.gradeComponents.map((comp) => (
                          <th key={comp.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-28">
                            <div className="flex items-center justify-center gap-1">
                              <span>{comp.name}</span>
                              <span className="text-gray-500">({comp.weight}x)</span>
                              <button
                                onClick={() => handleDeleteComponent(comp.id)}
                                className="ml-1 text-gray-300 hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            {comp.period && <span className="block text-gray-500 font-normal normal-case">{comp.period}</span>}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-purple-600 uppercase min-w-24">Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cls.students.map((cs, idx) => {
                        const nilaiAkhir = calcNilaiAkhir(cs.student.id);
                        const na = parseFloat(nilaiAkhir);
                        return (
                          <tr key={cs.student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="sticky left-0 bg-inherit px-4 py-2.5 font-medium text-gray-900">{cs.student.name}</td>
                            {cls.gradeComponents.map((comp) => (
                              <td key={comp.id} className="px-3 py-2.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  value={getScore(cs.student.id, comp.id)}
                                  onChange={(e) => setScore(cs.student.id, comp.id, e.target.value)}
                                  className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm focus:border-purple-400 focus:outline-none"
                                />
                              </td>
                            ))}
                            <td className="px-4 py-2.5 text-center">
                              <span className={`font-bold text-sm ${isNaN(na) ? "text-gray-500" : na >= 75 ? "text-green-600" : "text-red-600"}`}>
                                {nilaiAkhir}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {rankings.filter((r) => r.nilai > 0).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm text-gray-900">Ranking Kelas</h3>
                  </div>
                  <div className="space-y-1.5">
                    {rankings.filter((r) => r.nilai > 0).slice(0, 10).map((r, i) => (
                      <div key={r.name} className="flex items-center gap-3">
                        <span className={`w-6 text-xs font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-500" : i === 2 ? "text-orange-400" : "text-gray-500"}`}>{i + 1}</span>
                        <span className="flex-1 text-sm text-gray-700">{r.name}</span>
                        <span className={`text-sm font-semibold ${r.nilai >= 75 ? "text-green-600" : "text-red-600"}`}>{r.nilai.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
