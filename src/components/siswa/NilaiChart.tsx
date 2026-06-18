"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface ChartData {
  name: string;
  score: number;
  weight: number;
  period?: string | null;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

export default function NilaiChart({ data }: { data: ChartData[] }) {
  const maxScore = 100;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} interval={0} />
          <YAxis domain={[0, maxScore]} tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            formatter={(value: number) => [`${value}`, "Nilai"]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.score >= 75 ? COLORS[index % COLORS.length] : "#EF4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
