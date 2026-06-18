import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users2, ArrowLeft } from "lucide-react";
import ParentChildrenClient from "@/components/admin/ParentChildrenClient";

export const metadata = { title: "Detail Orang Tua" };

export default async function AdminParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { id } = await params;

  const parent = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, avatar: true },
  });
  if (!parent) redirect("/admin/parents");

  const linkedChildren = await db.parentChild.findMany({
    where: { parentId: id },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  const allStudents = await db.user.findMany({
    where: { role: "SISWA", isActive: true },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const linkedIds = new Set(linkedChildren.map((lc) => lc.childId));
  const availableStudents = allStudents.filter((s) => !linkedIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/parents" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{parent.name}</h1>
          <p className="text-sm text-gray-500">{parent.email}</p>
        </div>
      </div>

      <ParentChildrenClient
        parentId={parent.id}
        initialChildren={JSON.parse(JSON.stringify(linkedChildren.map((lc) => lc.child)))}
        availableStudents={JSON.parse(JSON.stringify(availableStudents))}
      />
    </div>
  );
}
