import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckSquare, Users2 } from "lucide-react";
import { getAttendanceStatusColor, getAttendanceStatusLabel } from "@/lib/utils";

export const metadata = { title: "Absensi Anak" };

export default async function OrangtuaAbsensiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const { branchId } = await getBranchScope();
  const children = await db.parentChild.findMany({
    where: {
      parentId: session.user.id,
      child: branchId ? { defaultBranchId: branchId } : {},
    },
    include: {
      child: {
        select: { id: true, name: true },
      },
    },
  });

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users2 className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Belum ada anak yang terhubung.</p>
      </div>
    );
  }

  const childIds = children.map((c) => c.child.id);

  const records = await db.attendanceRecord.findMany({
    where: { studentId: { in: childIds } },
    include: {
      student: { select: { id: true, name: true } },
      attendance: {
        include: { class: { include: { subject: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Group by child
  const byChild: Record<string, typeof records> = {};
  for (const rec of records) {
    if (!byChild[rec.studentId]) byChild[rec.studentId] = [];
    byChild[rec.studentId].push(rec);
  }

  const STATUS_COUNTS = ["HADIR", "SAKIT", "IZIN", "ALPHA"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <CheckSquare className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absensi Anak</h1>
          <p className="text-sm text-gray-500">Rekap kehadiran anak di kelas</p>
        </div>
      </div>

      {children.map(({ child }) => {
        const childRecords = byChild[child.id] ?? [];
        const counts = Object.fromEntries(STATUS_COUNTS.map((s) => [s, childRecords.filter((r) => r.status === s).length]));
        const total = childRecords.length;
        const pct = total > 0 ? Math.round((counts.HADIR / total) * 100) : 0;

        return (
          <div key={child.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {child.name.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="font-semibold text-gray-900">{child.name}</h2>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${pct >= 80 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {pct}% hadir
              </span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: "Hadir",  count: counts.HADIR, color: "text-green-600" },
                { label: "Sakit",  count: counts.SAKIT,  color: "text-yellow-600" },
                { label: "Izin",   count: counts.IZIN,   color: "text-blue-600" },
                { label: "Alpha",  count: counts.ALPHA,  color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="py-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {childRecords.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Belum ada data absensi</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {childRecords.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{rec.attendance.class.subject.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(rec.createdAt), "EEEE, d MMM yyyy", { locale: localeId })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getAttendanceStatusColor(rec.status)}`}>
                      {getAttendanceStatusLabel(rec.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
