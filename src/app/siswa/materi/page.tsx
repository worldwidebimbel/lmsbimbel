import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MaterialCard } from "@/components/materi/MaterialCard";

async function getSiswaMateri(studentId: string) {
  const enrollment = await db.classStudent.findMany({
    where: { studentId },
    select: { classId: true },
  });
  const classIds = enrollment.map((e) => e.classId);

  const [materials, subjects] = await Promise.all([
    db.material.findMany({
      where: {
        isPublished: true,
        OR: [
          { classId: { in: classIds } },
          { classId: null },
        ],
      },
      include: {
        subject: { select: { id: true, name: true, color: true, code: true } },
        class: { select: { id: true, name: true } },
        uploader: { select: { name: true } },
        progress: { where: { studentId }, select: { isCompleted: true, lastViewedAt: true } },
      },
      orderBy: [{ subjectId: "asc" }, { order: "asc" }],
    }),
    db.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, color: true },
    }),
  ]);

  return { materials, subjects };
}

export const metadata = { title: "Materi Pembelajaran" };

export default async function SiswaMateriPage() {
  const session = await auth();
  const { materials, subjects } = await getSiswaMateri(session!.user!.id);

  const grouped = subjects
    .map((subject) => ({
      subject,
      items: materials.filter((m) => m.subject?.id === subject.id),
    }))
    .filter((g) => g.items.length > 0);

  const noSubject = materials.filter((m) => !m.subject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materi Pembelajaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">{materials.length} materi tersedia</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          {materials.filter((m) => m.progress[0]?.isCompleted).length}/{materials.length} selesai
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada materi yang tersedia.</p>
          <p className="text-sm text-gray-500 mt-1">Materi akan muncul setelah guru mempublikasikannya.</p>
        </div>
      ) : (
        <>
          {grouped.map(({ subject, items }) => (
            <div key={subject.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <h2 className="font-semibold text-gray-800">{subject.name}</h2>
                <span className="text-xs text-gray-500">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    isCompleted={m.progress[0]?.isCompleted ?? false}
                    studentId={session!.user!.id}
                  />
                ))}
              </div>
            </div>
          ))}

          {noSubject.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Materi Umum</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {noSubject.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    isCompleted={m.progress[0]?.isCompleted ?? false}
                    studentId={session!.user!.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
