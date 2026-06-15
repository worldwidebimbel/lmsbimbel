import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users2, GraduationCap, CheckSquare, Wallet } from "lucide-react";
import { formatCurrency, getAttendanceStatusColor, getAttendanceStatusLabel, getInvoiceStatusColor, getInvoiceStatusLabel } from "@/lib/utils";

async function getOrangtuaData(userId: string) {
  const children = await db.parentChild.findMany({
    where: { parentId: userId },
    include: {
      child: {
        include: {
          grades: { include: { component: { include: { class: { include: { subject: true } } } } }, orderBy: { updatedAt: "desc" }, take: 3 },
          invoices: { where: { status: "UNPAID" }, orderBy: { dueDate: "asc" }, take: 3 },
          attendanceRecords: { include: { attendance: { include: { class: { include: { subject: true } } } } }, orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });
  return children;
}

export default async function OrangtuaDashboard() {
  const session = await auth();
  const children = await getOrangtuaData(session!.user!.id as string);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Halo, {session?.user?.name}! 👨‍👩‍👧</h2>
        <p className="text-blue-100 text-sm mt-1">Pantau perkembangan belajar anak Anda</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data anak yang terhubung.</p>
          <p className="text-sm text-gray-400 mt-1">Hubungi admin untuk menghubungkan akun.</p>
        </div>
      ) : (
        children.map(({ child }) => (
          <div key={child.id} className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                {child.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{child.name}</p>
                <p className="text-sm text-gray-500">{child.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nilai Terbaru */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Nilai Terbaru
                </h4>
                {child.grades.length === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada nilai</p>
                ) : (
                  <div className="space-y-2">
                    {child.grades.map((g) => (
                      <div key={g.id} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{g.component.class.subject.name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.score >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {g.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Absensi */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-green-600" /> Absensi
                </h4>
                {child.attendanceRecords.length === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada data</p>
                ) : (
                  <div className="space-y-2">
                    {child.attendanceRecords.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{rec.attendance.class.subject.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAttendanceStatusColor(rec.status)}`}>
                          {getAttendanceStatusLabel(rec.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tagihan */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-orange-600" /> Tagihan
                </h4>
                {child.invoices.length === 0 ? (
                  <p className="text-xs text-green-600 font-medium">Semua tagihan lunas ✓</p>
                ) : (
                  <div className="space-y-2">
                    {child.invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{formatCurrency(inv.amount)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getInvoiceStatusColor(inv.status)}`}>
                          {getInvoiceStatusLabel(inv.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
