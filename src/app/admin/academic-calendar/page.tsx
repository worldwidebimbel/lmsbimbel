import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import AcademicCalendarManager from "@/components/admin/AcademicCalendarManager";

export const metadata = { title: "Kalender Akademik" };

export default async function AdminAcademicCalendarPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const branches = await db.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender Akademik</h1>
          <p className="text-sm text-gray-500">Kelola liburan, ujian, tryout, dan acara lainnya</p>
        </div>
      </div>

      <AcademicCalendarManager branches={branches} />
    </div>
  );
}
