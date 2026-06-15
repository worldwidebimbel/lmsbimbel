import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, ClipboardList, FileCheck, CalendarDays, GraduationCap, TrendingUp } from "lucide-react";

async function getSiswaStats(userId: string) {
  const [myClasses, pendingTasks, upcomingExams, recentGrades] = await Promise.all([
    db.classStudent.count({ where: { studentId: userId } }),
    db.submission.count({
      where: { studentId: userId, score: null, assignment: { dueDate: { gte: new Date() } } },
    }),
    db.exam.count({
      where: {
        isPublished: true,
        endTime: { gte: new Date() },
        class: { students: { some: { studentId: userId } } },
      },
    }),
    db.grade.findMany({
      where: { studentId: userId },
      include: { component: { include: { class: { include: { subject: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);
  return { myClasses, pendingTasks, upcomingExams, recentGrades };
}

export default async function SiswaDashboard() {
  const session = await auth();
  const stats = await getSiswaStats(session!.user!.id as string);

  const cards = [
    { label: "Kelas Diikuti", value: stats.myClasses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tugas Pending", value: stats.pendingTasks, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Ujian Mendatang", value: stats.upcomingExams, icon: FileCheck, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Halo, {session?.user?.name}! 📚</h2>
        <p className="text-green-100 text-sm mt-1">Semangat belajar hari ini!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Nilai Terbaru
          </h3>
          {stats.recentGrades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada nilai</p>
          ) : (
            <div className="space-y-3">
              {stats.recentGrades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{grade.component.class.subject.name}</p>
                    <p className="text-xs text-gray-500">{grade.component.name}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${grade.score >= 75 ? "bg-green-100 text-green-700" : grade.score >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {grade.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Aksi Cepat
          </h3>
          <div className="space-y-2">
            {[
              { label: "Lihat Materi Terbaru", href: "/siswa/materi", icon: BookOpen },
              { label: "Kerjakan Tugas", href: "/siswa/tugas", icon: ClipboardList },
              { label: "Ikut Ujian", href: "/siswa/ujian", icon: FileCheck },
              { label: "Lihat Jadwal", href: "/siswa/jadwal", icon: CalendarDays },
              { label: "Cek Nilai Saya", href: "/siswa/nilai", icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
