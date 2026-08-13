import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import ClassDetailClient from "@/components/admin/ClassDetailClient";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Detail Kelas" };

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { id } = await params;
  const { isSuperAdmin, branchId, allBranches } = await getBranchScope();

  const [cls, allStudents, subjects, teachers, rooms] = await Promise.all([
    db.class.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        roomRel: { select: { id: true, name: true } },
        students: {
          include: { student: { select: { id: true, name: true, email: true } } },
          orderBy: { student: { name: "asc" } },
        },
        schedules: { orderBy: { dayOfWeek: "asc" }, include: { roomRel: { select: { name: true } } } },
        _count: { select: { materials: true, assignments: true } },
      },
    }),
    db.user.findMany({
      where: { role: "SISWA", isActive: true, ...(branchId ? { defaultBranchId: branchId } : {}) },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: "GURU", isActive: true, ...(branchId ? { defaultBranchId: branchId } : {}) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.room.findMany({
      where: { isActive: true, ...(branchId ? { branchId } : {}) },
      select: { id: true, name: true, roomNumber: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!cls) notFound();
  if (!isSuperAdmin && cls.branchId !== branchId) redirect("/admin/classes");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/classes" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: cls.subject.color + "22" }}>
          <BookOpen className="h-5 w-5" style={{ color: cls.subject.color }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{cls.name}</h1>
          <p className="text-sm text-gray-500">{cls.subject.name} · {cls.teacher.name}</p>
        </div>
      </div>

      <ClassDetailClient
        cls={JSON.parse(JSON.stringify(cls))}
        allStudents={allStudents}
        subjects={JSON.parse(JSON.stringify(subjects))}
        teachers={JSON.parse(JSON.stringify(teachers))}
        branches={JSON.parse(JSON.stringify(allBranches))}
        rooms={JSON.parse(JSON.stringify(rooms))}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
