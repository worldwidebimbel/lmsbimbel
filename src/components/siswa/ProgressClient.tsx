"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface WeekData {
  label: string;
  materi: number;
  tugas: number;
  ujian: number;
}

export default function ProgressClient({ weeks }: { weeks: WeekData[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Aktivitas Belajar (8 Minggu Terakhir)</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value: number, name: string) => [value, name === "tugas" ? "Tugas" : name === "ujian" ? "Ujian" : "Materi"]}
            />
            <Legend
              formatter={(value: string) => (value === "tugas" ? "Tugas" : value === "ujian" ? "Ujian" : "Materi")}
            />
            <Bar dataKey="tugas" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={30} />
            <Bar dataKey="ujian" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
