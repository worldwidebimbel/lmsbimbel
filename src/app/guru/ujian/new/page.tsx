import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileCheck, ArrowLeft } from "lucide-react";
import NewUjianClient from "@/components/guru/NewUjianClient";

export const metadata = { title: "Buat Ujian" };

export default async function NewUjianPage() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/guru");

  const classes = await db.class.findMany({
    where: { teacherId: session.user.id, isActive: true },
    select: { id: true, name: true, subject: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/guru/ujian" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <FileCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Ujian</h1>
          <p className="text-sm text-gray-500">Konfigurasi ujian baru</p>
        </div>
      </div>
      <NewUjianClient classes={classes} />
    </div>
  );
}
