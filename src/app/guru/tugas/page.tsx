import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import TugasList from "@/components/tugas/TugasList";
import { ClipboardList } from "lucide-react";

export const metadata = { title: "Tugas" };

export default async function GuruTugasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const { branchId } = await getBranchScope();
  const classWhere = branchId
    ? { teacherId: session.user.id, isActive: true, branchId }
    : { teacherId: session.user.id, isActive: true };

  const [assignments, classes] = await Promise.all([
    prisma.assignment.findMany({
      where: { teacherId: session.user.id, class: classWhere },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.class.findMany({
      where: classWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tugas & PR</h1>
          <p className="text-sm text-gray-500">Kelola tugas untuk kelas Anda</p>
        </div>
      </div>

      <TugasList
        initialAssignments={JSON.parse(JSON.stringify(assignments))}
        classes={classes}
      />
    </div>
  );
}
