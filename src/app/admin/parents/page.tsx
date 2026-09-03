import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users2, ArrowRight } from "lucide-react";

export const metadata = { title: "Orang Tua & Anak" };

export default async function AdminParentsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const parents = await db.user.findMany({
    where: { role: "ORANG_TUA", isActive: true },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const parentsWithCount = await Promise.all(
    parents.map(async (p) => {
      const count = await db.parentChild.count({ where: { parentId: p.id } });
      return { ...p, count };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Users2 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orang Tua & Anak</h1>
          <p className="text-sm text-gray-500">Kelola hubungan orang tua dengan siswa</p>
        </div>
      </div>

      {parentsWithCount.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Users2 className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada data orang tua</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="divide-y divide-gray-100">
            {parentsWithCount.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.count > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.count} anak
                  </span>
                  <Link href={`/admin/parents/${p.id}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Kelola <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
