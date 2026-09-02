import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import TeacherAttendanceClient from "@/components/admin/TeacherAttendanceClient";

export const metadata = { title: "Absensi Tutor" };

export default async function TeacherAttendancePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/");

  const { branchId, isSuperAdmin } = await getBranchScope();

  const teachers = await db.user.findMany({
    where: {
      role: "GURU",
      isActive: true,
      ...(isSuperAdmin ? {} : branchId ? { defaultBranchId: branchId } : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const records = await db.teacherAttendance.findMany({
    where: isSuperAdmin ? {} : branchId ? { branchId } : {},
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return <TeacherAttendanceClient teachers={JSON.parse(JSON.stringify(teachers))} records={JSON.parse(JSON.stringify(records))} />;
}
