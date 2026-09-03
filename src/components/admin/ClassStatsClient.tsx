"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { Users, GraduationCap, CheckSquare, FileCheck } from "lucide-react";

interface ClassStat {
  id: string;
  name: string;
  subject: string;
  subjectColor: string;
  teacher: string;
  studentCount: number;
  materialCount: number;
  assignmentCount: number;
  avgGrade: number;
  gradeCount: number;
  attendanceRate: number;
  totalAttendance: number;
  submissionCount: number;
  examAttempts: number;
}

export default function ClassStatsClient({ data }: { data: ClassStat[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
        <Users className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm text-gray-500">Belum ada data kelas</p>
      </div>
    );
  }

  const gradeData = data.map((c) => ({ name: c.name, nilai: Number(c.avgGrade.toFixed(1)), subject: c.subject }));
  const attendanceData = data.map((c) => ({ name: c.name, kehadiran: Number(c.attendanceRate.toFixed(1)), subject: c.subject }));
  const activityData = data.map((c) => ({ name: c.name, tugas: c.submissionCount, ujian: c.examAttempts, materi: c.materialCount }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Kelas", value: data.length, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Rata-rata Nilai", value: (data.reduce((s, c) => s + c.avgGrade, 0) / data.length).toFixed(1), icon: GraduationCap, bg: "bg-green-50", color: "text-green-600" },
          { label: "Rata-rata Kehadiran", value: `${(data.reduce((s, c) => s + c.attendanceRate, 0) / data.length).toFixed(0)}%`, icon: CheckSquare, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Total Tugas Dikumpulkan", value: data.reduce((s, c) => s + c.submissionCount, 0), icon: FileCheck, bg: "bg-orange-50", color: "text-orange-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Class Detail Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold text-gray-900">Detail Per Kelas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Kelas</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Mapel</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Guru</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Siswa</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Nilai Rata-rata</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Kehadiran</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Tugas</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Ujian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: c.subjectColor + "20", color: c.subjectColor }}>
                      {c.subject}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.teacher}</td>
                  <td className="px-5 py-3 text-center text-gray-700">{c.studentCount}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c.avgGrade >= 75 ? "bg-green-100 text-green-700" : c.avgGrade >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {c.avgGrade.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c.attendanceRate >= 80 ? "bg-green-100 text-green-700" : c.attendanceRate >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {c.attendanceRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-700">{c.submissionCount}</td>
                  <td className="px-5 py-3 text-center text-gray-700">{c.examAttempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Rata-rata Nilai per Kelas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [v, "Nilai Rata-rata"]} />
                <Bar dataKey="nilai" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Tingkat Kehadiran per Kelas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} unit="%" />
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [`${v}%`, "Kehadiran"]} />
                <Bar dataKey="kehadiran" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Aktivitas Belajar per Kelas</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend />
              <Bar dataKey="tugas" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="ujian" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="materi" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
