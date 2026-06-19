import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { Plus, Users, BookOpen, Building2 } from "lucide-react";

async function getClasses(branchId: string | null) {
  const where = branchId ? { branchId } : {};
  return db.class.findMany({
    where,
    include: {
      subject: true,
      teacher: true,
      branch: { select: { name: true, code: true } },
      _count: { select: { students: true, schedules: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export const metadata = { title: "Manajemen Kelas" };

const CLASS_TYPE_LABEL: Record<string, string> = {
  REGULER: "Reguler",
  PRIVAT: "Privat",
  ONLINE: "Online",
};

const CLASS_TYPE_COLOR: Record<string, string> = {
  REGULER: "bg-blue-100 text-blue-700",
  PRIVAT: "bg-purple-100 text-purple-700",
  ONLINE: "bg-green-100 text-green-700",
};

export default async function ClassesPage() {
  const { branchId, isSuperAdmin, allBranches } = await getBranchScope();
  const classes = await getClasses(branchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{classes.length} kelas aktif</p>
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
          <a href="/admin/classes/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Buat Kelas
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada kelas. Buat kelas pertama!</p>
          </div>
        ) : (
          classes.map((cls) => (
            <a key={cls.id} href={`/admin/classes/${cls.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-blue-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: cls.subject.color }}>
                  {cls.subject.code.slice(0, 3)}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CLASS_TYPE_COLOR[cls.type]}`}>
                  {CLASS_TYPE_LABEL[cls.type]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{cls.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{cls.subject.name}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {cls._count.students}/{cls.maxStudents} siswa
                </span>
                <span>{cls.teacher.name}</span>
                {cls.branch && <span className="ml-auto text-xs font-medium text-blue-600">{cls.branch.name}</span>}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
