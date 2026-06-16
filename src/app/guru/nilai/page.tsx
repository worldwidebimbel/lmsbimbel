import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import NilaiGuruClient from "@/components/nilai/NilaiGuruClient";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Nilai" };

export default async function GuruNilaiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const classes = await db.class.findMany({
    where: { teacherId: session.user.id, isActive: true },
    select: {
      id: true,
      name: true,
      students: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { student: { name: "asc" } },
      },
      gradeComponents: {
        include: {
          grades: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nilai & Rapor</h1>
          <p className="text-sm text-gray-500">Kelola komponen dan input nilai siswa</p>
        </div>
      </div>

      <NilaiGuruClient initialClasses={JSON.parse(JSON.stringify(classes))} />
    </div>
  );
}
