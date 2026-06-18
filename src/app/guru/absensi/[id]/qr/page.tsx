import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import AbsensiQRDisplay from "@/components/guru/AbsensiQRDisplay";

export const metadata = { title: "QR Absensi" };

export default async function AbsensiQRPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const { id } = await params;

  const attendance = await db.attendance.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, teacherId: true } },
      records: {
        include: { student: { select: { name: true } } },
      },
    },
  });

  if (!attendance || attendance.class.teacherId !== session.user.id) {
    redirect("/guru/absensi");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const initialRecords = attendance.records.map((r) => ({
    name: r.student.name,
    status: r.status,
  }));

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/guru/absensi" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Absensi</h1>
          <p className="text-sm text-gray-500">Siswa scan QR untuk hadir otomatis</p>
        </div>
      </div>

      <AbsensiQRDisplay
        attendanceId={id}
        className={attendance.class.name}
        date={attendance.date.toISOString()}
        baseUrl={baseUrl}
      />
    </div>
  );
}
