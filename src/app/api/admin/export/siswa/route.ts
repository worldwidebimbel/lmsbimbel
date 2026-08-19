import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { role: "SISWA" };
  if (branchId) where.defaultBranchId = branchId;
  if (status) where.profile = { studentStatus: status };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const students = await db.user.findMany({
    where,
    include: {
      profile: { select: { phone: true, schoolName: true, gradeLevel: true, studentStatus: true } },
      defaultBranch: { select: { name: true } },
      classStudents: { select: { class: { select: { name: true, subject: { select: { name: true } } } } }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = students.map((s) => ({
    nama: s.name,
    email: s.email ?? "",
    telepon: s.profile?.phone ?? "",
    sekolah: s.profile?.schoolName ?? "",
    kelas: s.profile?.gradeLevel ?? "",
    cabang: s.defaultBranch?.name ?? "",
    kelasAktif: s.classStudents[0]?.class.name ?? "",
    mapel: s.classStudents[0]?.class.subject.name ?? "",
    status: s.profile?.studentStatus ?? "AKTIF",
    bergabung: s.createdAt.toISOString().split("T")[0],
  }));

  const buffer = await generateExcelBuffer({
    filename: "data-siswa",
    sheetName: "Data Siswa",
    columns: [
      { header: "Nama", key: "nama", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Telepon", key: "telepon", width: 15 },
      { header: "Sekolah", key: "sekolah", width: 20 },
      { header: "Kelas", key: "kelas", width: 10 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "Kelas Aktif", key: "kelasAktif", width: 15 },
      { header: "Mapel", key: "mapel", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Bergabung", key: "bergabung", width: 12 },
    ],
    data,
  });

  return excelResponse(buffer, "data-siswa");
}
