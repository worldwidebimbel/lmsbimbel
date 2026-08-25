"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Building2, Users, Share2, CalendarDays, AlertTriangle, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Stats = {
  overview: {
    totalBranches: number;
    pendingPpdb: number;
    totalAffiliates: number;
    activeEvents: number;
    piutang: number;
    tunggakan: number;
  };
  charts: {
    months: string[];
    studentGrowth: number[];
    revenueGrowth: number[];
  };
  branchComparison: { name: string; students: number }[];
};

export default function DashboardCharts() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return <p className="text-sm text-gray-500">Memuat statistik...</p>;
  }

  const { overview, charts, branchComparison } = stats;

  const studentData = charts.months.map((m, i) => ({
    month: m,
    siswa: charts.studentGrowth[i],
  }));

  const revenueData = charts.months.map((m, i) => ({
    month: m,
    pendapatan: charts.revenueGrowth[i],
  }));

  const overviewCards = [
    { label: "Total Cabang", value: overview.totalBranches, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Calon Siswa", value: overview.pendingPpdb, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Afiliator Aktif", value: overview.totalAffiliates, icon: Share2, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Event Aktif", value: overview.activeEvents, icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
    { label: "Piutang", value: formatCurrency(overview.piutang), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Tunggakan", value: formatCurrency(overview.tunggakan), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-base mb-4">Pertumbuhan Siswa (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={studentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="siswa" stroke="#3b82f6" strokeWidth={2} name="Siswa Baru" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-base mb-4">Pendapatan (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="pendapatan" stroke="#22c55e" strokeWidth={2} name="Pendapatan" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 text-base mb-4">Perbandingan Siswa per Cabang</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={branchComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="students" fill="#1e3a8a" name="Siswa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
