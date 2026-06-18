"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { BarChart3, BookOpen, ClipboardList } from "lucide-react";

interface ClassGrade {
  className: string;
  subjectName: string;
  subjectColor: string;
  components: { name: string; score: number; period: string | null; order: number }[];
}

interface ScoreEntry {
  label: string;
  score: number;
  date: string;
}

interface ScoreGroup {
  className: string;
  scores: ScoreEntry[];
}

interface Props {
  byClass: Record<string, ClassGrade>;
  examByClass: Record<string, ScoreGroup>;
  taskByClass: Record<string, ScoreGroup>;
}

const PASS = 75;
const TABS = [
  { id: "komponen", label: "Nilai Komponen", icon: BarChart3 },
  { id: "ujian", label: "Ujian", icon: BookOpen },
  { id: "tugas", label: "Tugas", icon: ClipboardList },
];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12">
      <BarChart3 className="mb-2 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

export default function NilaiProgressClient({ byClass, examByClass, taskByClass }: Props) {
  const [activeTab, setActiveTab] = useState("komponen");

  const classEntries = Object.entries(byClass);
  const examEntries = Object.entries(examByClass);
  const taskEntries = Object.entries(taskByClass);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Nilai Komponen Tab */}
      {activeTab === "komponen" && (
        classEntries.length === 0 ? (
          <EmptyChart label="Belum ada nilai komponen" />
        ) : (
          <div className="space-y-5">
            {classEntries.map(([classId, data]) => {
              const sorted = [...data.components].sort((a, b) => a.order - b.order);
              const chartData = sorted.map((c) => ({ name: c.name, nilai: c.score, period: c.period ?? "" }));
              const avg = sorted.length > 0 ? sorted.reduce((s, c) => s + c.score, 0) / sorted.length : 0;
              return (
                <div key={classId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.subjectColor }} />
                      <span className="font-semibold text-gray-900">{data.className}</span>
                      <span className="text-xs text-gray-400">{data.subjectName}</span>
                    </div>
                    <span className={`text-sm font-bold ${avg >= PASS ? "text-green-600" : "text-red-600"}`}>
                      Rata-rata: {avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-5">
                    {sorted.length <= 1 ? (
                      <EmptyChart label="Minimal 2 nilai untuk menampilkan grafik" />
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                              formatter={(v: number) => [v, "Nilai"]}
                            />
                            <ReferenceLine y={PASS} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "KKM", fontSize: 10, fill: "#f59e0b" }} />
                            <Bar dataKey="nilai" fill={data.subjectColor || "#3B82F6"} radius={[6, 6, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sorted.map((c) => (
                        <div key={c.name} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center">
                          <p className="text-xs text-gray-400">{c.name}</p>
                          {c.period && <p className="text-xs text-gray-300">{c.period}</p>}
                          <p className={`text-lg font-bold ${c.score >= PASS ? "text-green-600" : "text-red-600"}`}>{c.score}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Ujian Tab */}
      {activeTab === "ujian" && (
        examEntries.length === 0 ? (
          <EmptyChart label="Belum ada nilai ujian" />
        ) : (
          <div className="space-y-5">
            {examEntries.map(([classId, data]) => {
              const chartData = data.scores.map((s, i) => ({ name: `Ujian ${i + 1}`, judul: s.label, nilai: s.score }));
              const avg = data.scores.length > 0 ? data.scores.reduce((s, c) => s + c.score, 0) / data.scores.length : 0;
              return (
                <div key={classId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3">
                    <span className="font-semibold text-gray-900">{data.className}</span>
                    <span className={`text-sm font-bold ${avg >= PASS ? "text-green-600" : "text-red-600"}`}>
                      Rata-rata: {avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-5">
                    {chartData.length <= 1 ? (
                      <EmptyChart label="Minimal 2 ujian untuk menampilkan grafik" />
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                              formatter={(v: number, _n: string, p: any) => [v, p.payload.judul]}
                            />
                            <ReferenceLine y={PASS} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "KKM", fontSize: 10, fill: "#f59e0b" }} />
                            <Line type="monotone" dataKey="nilai" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 5, fill: "#8B5CF6" }} activeDot={{ r: 7 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="mt-4 space-y-2">
                      {data.scores.map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                          <p className="text-sm text-gray-700">{s.label}</p>
                          <span className={`text-sm font-bold ${s.score >= PASS ? "text-green-600" : "text-red-600"}`}>{s.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tugas Tab */}
      {activeTab === "tugas" && (
        taskEntries.length === 0 ? (
          <EmptyChart label="Belum ada nilai tugas" />
        ) : (
          <div className="space-y-5">
            {taskEntries.map(([classId, data]) => {
              const chartData = data.scores.map((s, i) => ({ name: `T${i + 1}`, judul: s.label, nilai: s.score }));
              const avg = data.scores.length > 0 ? data.scores.reduce((s, c) => s + c.score, 0) / data.scores.length : 0;
              return (
                <div key={classId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3">
                    <span className="font-semibold text-gray-900">{data.className}</span>
                    <span className={`text-sm font-bold ${avg >= PASS ? "text-green-600" : "text-red-600"}`}>
                      Rata-rata: {avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-5">
                    {chartData.length <= 1 ? (
                      <EmptyChart label="Minimal 2 tugas dinilai untuk menampilkan grafik" />
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                              formatter={(v: number, _n: string, p: any) => [v, p.payload.judul]}
                            />
                            <ReferenceLine y={PASS} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "KKM", fontSize: 10, fill: "#f59e0b" }} />
                            <Line type="monotone" dataKey="nilai" stroke="#10B981" strokeWidth={2} dot={{ r: 5, fill: "#10B981" }} activeDot={{ r: 7 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="mt-4 space-y-2">
                      {data.scores.map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                          <p className="text-sm text-gray-700">{s.label}</p>
                          <span className={`text-sm font-bold ${s.score >= PASS ? "text-green-600" : "text-red-600"}`}>{s.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
