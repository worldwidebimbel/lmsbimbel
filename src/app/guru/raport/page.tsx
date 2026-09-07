import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import RaportAdminClient from "@/components/admin/RaportAdminClient";

export const metadata = { title: "Raport - Guru" };

export default async function GuruRaportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const [classes, raports, academicYears, rubricLevels, attitudeAspects] = await Promise.all([
    db.class.findMany({
      where: { teacherId: session.user.id, isActive: true },
      select: {
        id: true, name: true,
        subject: { select: { name: true } },
        students: { select: { student: { select: { id: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.raport.findMany({
      where: { class: { teacherId: session.user.id } },
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, subject: { select: { name: true } } } },
        academicYear: { select: { id: true, name: true } },
        attitudes: { select: { id: true, aspectId: true, stars: true, note: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.academicYear.findMany({
      orderBy: { name: "desc" },
      select: { id: true, name: true },
    }),
    db.rubricLevel.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { stars: "desc" }],
    }),
    db.attitudeAspect.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raport Siswa</h1>
          <p className="text-sm text-gray-500">Generate dan kelola raport untuk kelas Anda</p>
        </div>
      </div>

      <RaportAdminClient
        classes={JSON.parse(JSON.stringify(classes))}
        initialRaports={JSON.parse(JSON.stringify(raports))}
        academicYears={JSON.parse(JSON.stringify(academicYears))}
        rubricLevels={JSON.parse(JSON.stringify(rubricLevels))}
        attitudeAspects={JSON.parse(JSON.stringify(attitudeAspects))}
        isGuru={true}
      />
    </div>
  );
}
