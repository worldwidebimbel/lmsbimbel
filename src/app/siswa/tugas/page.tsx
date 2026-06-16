import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SiswaTugasClient from "@/components/tugas/SiswaTugasClient";
import { ClipboardList } from "lucide-react";

export const metadata = { title: "Tugas" };

export default async function SiswaTugasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await prisma.classStudent.findMany({
    where: { studentId: session.user.id },
    select: { classId: true },
  });
  const classIds = enrolled.map((e) => e.classId);

  const assignments = await prisma.assignment.findMany({
    where: { isPublished: true, classId: { in: classIds } },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      submissions: {
        where: { studentId: session.user.id },
        select: {
          id: true,
          assignmentId: true,
          studentId: true,
          content: true,
          fileUrl: true,
          score: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tugas & PR</h1>
          <p className="text-sm text-gray-500">Kerjakan dan kumpulkan tugas dari guru</p>
        </div>
      </div>

      <SiswaTugasClient
        studentId={session.user.id}
        initialAssignments={JSON.parse(JSON.stringify(assignments))}
      />
    </div>
  );
}
