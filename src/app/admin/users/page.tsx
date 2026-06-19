import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { getRoleLabel, getRoleColor, formatDate } from "@/lib/utils";
import { UserPlus, Search, Building2 } from "lucide-react";

async function getUsers(branchId: string | null, isSuperAdmin: boolean) {
  const where = branchId ? { defaultBranchId: branchId } : {};
  return db.user.findMany({
    where,
    include: { profile: true, defaultBranch: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export const metadata = { title: "Manajemen Pengguna" };

export default async function UsersPage() {
  const { branchId, isSuperAdmin, allBranches } = await getBranchScope();
  const users = await getUsers(branchId, isSuperAdmin);

  const roleGroups = {
    SISWA: users.filter((u) => u.role === "SISWA"),
    GURU: users.filter((u) => u.role === "GURU"),
    ADMIN: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"),
    ORANG_TUA: users.filter((u) => u.role === "ORANG_TUA"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total {users.length} pengguna terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && allBranches.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <Building2 className="w-4 h-4 text-gray-500" />
              <select name="branch" defaultValue={branchId ?? "all"} className="text-sm bg-transparent outline-none">
                <option value="all">Semua Cabang</option>
                {allBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <a href="/admin/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(roleGroups).map(([role, list]) => (
          <div key={role} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{list.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">{getRoleLabel(role)}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Cari pengguna..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cabang</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Terdaftar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.defaultBranch ? `${user.defaultBranch.name} (${user.defaultBranch.code})` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <a href={`/admin/users/${user.id}`} className="text-xs text-blue-600 hover:underline">Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
