import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { MaterialList } from "@/components/materi/MaterialList";

async function getGuruMateri(uploaderId: string, branchId: string | null) {
  const classWhere = branchId
    ? { teacherId: uploaderId, isActive: true, branchId }
    : { teacherId: uploaderId, isActive: true };
  const classIds = (await db.class.findMany({
    where: classWhere,
    select: { id: true },
  })).map((c) => c.id);

  const [materials, classes, subjects] = await Promise.all([
    db.material.findMany({
      where: { classId: { in: classIds } },
      include: {
        subject: { select: { id: true, name: true, color: true, code: true } },
        class: { select: { id: true, name: true } },
        _count: { select: { progress: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    db.class.findMany({
      where: classWhere,
      select: { id: true, name: true },
    }),
    db.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, color: true, code: true },
    }),
  ]);
  return { materials, classes, subjects };
}

export const metadata = { title: "Materi Pembelajaran" };

export default async function GuruMateriPage() {
  const session = await auth();
  const { branchId } = await getBranchScope();
  const { materials, classes, subjects } = await getGuruMateri(session!.user!.id, branchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materi Pembelajaran</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola dan upload materi untuk siswa
        </p>
      </div>
      <MaterialList
        initialMaterials={materials}
        classes={classes}
        subjects={subjects}
        role="GURU"
      />
    </div>
  );
}
