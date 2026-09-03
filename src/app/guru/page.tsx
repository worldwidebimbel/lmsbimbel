import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, ClipboardList, CheckSquare, Users, FileCheck, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

async function getGuruStats(userId: string) {
  const [myClasses, pendingSubmissions, todayAttendance, unreadNotifs] = await Promise.all([
    db.class.findMany({
      where: { teacherId: userId, isActive: true },
      include: { subject: true, _count: { select: { students: true } } },
      take: 5,
    }),
    db.submission.count({ where: { assignment: { teacherId: userId }, score: null } }),
    db.attendance.count({ where: { class: { teacherId: userId }, date: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    db.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { myClasses, pendingSubmissions, todayAttendance, unreadNotifs };
}

export default async function GuruDashboard() {
  const session = await auth();
  const stats = await getGuruStats(session!.user!.id as string);

  const summaryCards = [
    { label: "Kelas Saya", value: stats.myClasses.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tugas Belum Dinilai", value: stats.pendingSubmissions, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Absensi Hari Ini", value: stats.todayAttendance, icon: CheckSquare, color: "text-green-600", bg: "bg-green-50" },
    { label: "Notifikasi Baru", value: stats.unreadNotifs, icon: Bell, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Halo, {session?.user?.name}! 👨‍🏫</h2>
        <p className="text-yellow-100 text-sm mt-1">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Kelas yang Diajar</h3>
        {stats.myClasses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Belum ada kelas</p>
        ) : (
          <div className="space-y-3">
            {stats.myClasses.map((cls) => (
              <a key={cls.id} href={`/guru/kelas/${cls.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: cls.subject.color }}>
                    {cls.subject.code.slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls.subject.name} · {cls.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">{cls._count.students}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
