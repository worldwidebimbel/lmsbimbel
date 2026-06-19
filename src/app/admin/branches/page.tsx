import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Building2, Users, BookOpen, Wallet, Plus, MapPin, Phone, Mail, User } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Manajemen Cabang" };

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const branches = await db.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, classes: true, invoices: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Cabang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola multi-cabang bimbel</p>
        </div>
        <Link href="/admin/branches/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Tambah Cabang
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{b.name}</h3>
                  <p className="text-xs text-gray-500">{b.code}</p>
                </div>
              </div>
              {b.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {b.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {b.address}</div>}
              {b.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {b.phone}</div>}
              {b.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {b.email}</div>}
              {b.managerName && <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /> {b.managerName}</div>}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{b._count.users}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> User</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{b._count.classes}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><BookOpen className="h-3 w-3" /> Kelas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{b._count.invoices}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Wallet className="h-3 w-3" /> Tagihan</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
