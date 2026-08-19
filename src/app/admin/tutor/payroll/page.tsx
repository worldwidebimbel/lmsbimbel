import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import TeacherPayrollClient from "@/components/admin/TeacherPayrollClient";

export const metadata = { title: "Payroll Tutor" };

export default async function TeacherPayrollPage() {
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

  const payrolls = await db.teacherPayroll.findMany({
    where: isSuperAdmin ? {} : branchId ? { branchId } : {},
    include: {
      teacher: { select: { name: true, email: true } },
      branch: { select: { name: true } },
    },
    orderBy: { periodStart: "desc" },
  });

  return <TeacherPayrollClient teachers={JSON.parse(JSON.stringify(teachers))} payrolls={JSON.parse(JSON.stringify(payrolls))} />;
}
