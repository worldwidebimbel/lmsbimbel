import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckSquare, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

export const metadata = { title: "Absensi" };

const STATUS_CONFIG = {
  HADIR:  { label: "Hadir",  icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-100"  },
  SAKIT:  { label: "Sakit",  icon: AlertCircle,   color: "text-yellow-600", bg: "bg-yellow-100" },
  IZIN:   { label: "Izin",   icon: Clock,          color: "text-blue-600",   bg: "bg-blue-100"   },
  ALPHA:  { label: "Alpha",  icon: XCircle,        color: "text-red-600",    bg: "bg-red-100"    },
} as const;

export default async function SiswaAbsensiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const records = await db.attendanceRecord.findMany({
    where: { studentId: session.user.id },
    include: {
      attendance: {
        include: { class: { select: { id: true, name: true } } },
      },
    },
    orderBy: { attendance: { date: "desc" } },
  });

  const total = records.length;
  const counts = {
    HADIR: records.filter((r) => r.status === "HADIR").length,
    SAKIT: records.filter((r) => r.status === "SAKIT").length,
    IZIN:  records.filter((r) => r.status === "IZIN").length,
    ALPHA: records.filter((r) => r.status === "ALPHA").length,
  };
  const persentaseHadir = total > 0 ? Math.round((counts.HADIR / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <CheckSquare className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekap Absensi</h1>
          <p className="text-sm text-gray-500">Riwayat kehadiran Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["HADIR", "SAKIT", "IZIN", "ALPHA"] as const).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className={`rounded-xl border border-gray-200 bg-white p-4`}>
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <p className="text-xs text-gray-500">{cfg.label}</p>
              <p className={`mt-1 text-2xl font-bold ${cfg.color}`}>{counts[status]}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Persentase Kehadiran</p>
          <p className={`text-lg font-bold ${persentaseHadir >= 75 ? "text-green-600" : "text-red-600"}`}>
            {persentaseHadir}%
          </p>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${persentaseHadir >= 75 ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${persentaseHadir}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {counts.HADIR} dari {total} pertemuan · {persentaseHadir < 75 ? "⚠️ Di bawah batas minimum 75%" : "✅ Memenuhi syarat kehadiran"}
        </p>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <CheckSquare className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada data absensi</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => {
                const cfg = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG];
                const Icon = cfg.icon;
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {format(new Date(record.attendance.date), "d MMM yyyy", { locale: localeId })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{record.attendance.class.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{record.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
