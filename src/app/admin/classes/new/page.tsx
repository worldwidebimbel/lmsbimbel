import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import NewClassClient from "@/components/admin/NewClassClient";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Buat Kelas" };

export default async function NewClassPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { isSuperAdmin, allBranches, branchId } = await getBranchScope();
  const branchFilter = session.user.role === "SUPER_ADMIN" ? {} : { defaultBranchId: branchId };

  const [subjects, teachers, rooms] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: "GURU", isActive: true, ...branchFilter }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.room.findMany({ where: { isActive: true, ...(branchId ? { branchId } : {}) }, select: { id: true, name: true, roomNumber: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/classes" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Kelas Baru</h1>
          <p className="text-sm text-gray-500">Lengkapi informasi kelas</p>
        </div>
      </div>

      <NewClassClient
        subjects={JSON.parse(JSON.stringify(subjects))}
        teachers={teachers}
        branches={allBranches}
        rooms={JSON.parse(JSON.stringify(rooms))}
        defaultBranchId={branchId}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
