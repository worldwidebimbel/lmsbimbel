import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { Users2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import LinkAnakClient from "@/components/orangtua/LinkAnakClient";

export const metadata = { title: "Hubungkan Akun Anak" };

export default async function OrangTuaLinkAnakPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const { branchId } = await getBranchScope();
  const linked = await db.parentChild.findMany({
    where: {
      parentId: session.user.id,
      child: branchId ? { defaultBranchId: branchId } : {},
    },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orangtua" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hubungkan Akun Anak</h1>
          <p className="text-sm text-gray-500">Tambahkan atau lepaskan akun anak untuk monitoring</p>
        </div>
      </div>

      <LinkAnakClient initialChildren={JSON.parse(JSON.stringify(linked.map((l) => l.child)))} />
    </div>
  );
}
