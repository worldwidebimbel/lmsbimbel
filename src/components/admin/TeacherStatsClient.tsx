"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GraduationCap, BookOpen, ClipboardList, CheckSquare, Users, ChevronDown, ChevronUp } from "lucide-react";

interface TeacherStat {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  classCount: number;
  classes: { name: string; studentCount: number }[];
  totalStudents: number;
  materialCount: number;
  assignmentCount: number;
  examCount: number;
  attendanceSessions: number;
  avgStudentGrade: number;
  submissionCount: number;
  gradedCount: number;
  gradingRate: number;
}

function ScoreBadge({ value }: { value: number }) {
  const cls = value >= 80 ? "bg-green-100 text-green-700" : value >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{value.toFixed(1)}</span>;
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) return <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeacherStatsClient({ data }: { data: TeacherStat[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof TeacherStat>("name");
  const [sortAsc, setSortAsc] = useState(true);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
        <GraduationCap className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm text-gray-500">Belum ada data guru</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function handleSort(key: keyof TeacherStat) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const chartData = data.map((t) => ({
    name: t.name.split(" ").slice(0, 2).join(" "),
    materi: t.materialCount,
    tugas: t.assignmentCount,
    ujian: t.examCount,
    absensi: t.attendanceSessions,
  }));

  const SortTh = ({ label, field }: { label: string; field: keyof TeacherStat }) => (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium text-gray-500 hover:text-gray-700"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">{label} {sortKey === field ? (sortAsc ? "↑" : "↓") : ""}</span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Guru Aktif", value: data.length, icon: GraduationCap, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Total Kelas Diajar", value: data.reduce((s, t) => s + t.classCount, 0), icon: BookOpen, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Total Materi Dibuat", value: data.reduce((s, t) => s + t.materialCount, 0), icon: ClipboardList, bg: "bg-green-50", color: "text-green-600" },
          { label: "Total Tugas Dinilai", value: data.reduce((s, t) => s + t.gradedCount, 0), icon: CheckSquare, bg: "bg-orange-50", color: "text-orange-600" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold text-gray-900">Kinerja Per Guru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <SortTh label="Guru" field="name" />
                <SortTh label="Kelas" field="classCount" />
                <SortTh label="Siswa" field="totalStudents" />
                <SortTh label="Materi" field="materialCount" />
                <SortTh label="Tugas" field="assignmentCount" />
                <SortTh label="Ujian" field="examCount" />
                <SortTh label="Sesi Absen" field="attendanceSessions" />
                <SortTh label="Rata Nilai" field="avgStudentGrade" />
                <SortTh label="% Penilaian" field="gradingRate" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((t) => (
                <>
                  <tr
                    key={t.id}
                    className="cursor-pointer hover:bg-gray-50/70"
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.name} avatar={t.avatar} />
                        <div>
                          <p className="font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">{t.classCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t.totalStudents}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t.materialCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t.assignmentCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t.examCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t.attendanceSessions}</td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge value={t.avgStudentGrade} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`text-xs font-semibold ${t.gradingRate >= 80 ? "text-green-600" : t.gradingRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {t.gradingRate.toFixed(0)}%
                        </span>
                        {expandedId === t.id ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
                      </div>
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr key={`${t.id}-expand`} className="bg-blue-50/30">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Kelas yang Diajar</p>
                          <div className="flex flex-wrap gap-2">
                            {t.classes.length === 0 ? (
                              <span className="text-xs text-gray-500">Tidak ada kelas aktif</span>
                            ) : (
                              t.classes.map((cls) => (
                                <span key={cls.name} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700">
                                  <Users className="h-3 w-3 text-gray-500" />
                                  {cls.name} <span className="text-gray-500">({cls.studentCount} siswa)</span>
                                </span>
                              ))
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>Tugas dikumpulkan: <b className="text-gray-800">{t.submissionCount}</b></span>
                            <span>Sudah dinilai: <b className="text-gray-800">{t.gradedCount}</b></span>
                            <span>Belum dinilai: <b className="text-red-600">{t.submissionCount - t.gradedCount}</b></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Aktivitas Mengajar Per Guru</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} angle={-20} textAnchor="end" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="materi" name="Materi" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="tugas" name="Tugas" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="ujian" name="Ujian" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="absensi" name="Absensi" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          {[{c:"bg-blue-500",l:"Materi"},{c:"bg-purple-500",l:"Tugas"},{c:"bg-yellow-500",l:"Ujian"},{c:"bg-green-500",l:"Absensi"}].map(i=>(
            <span key={i.l} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${i.c}`}/>{i.l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
