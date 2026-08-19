import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "LMS Bimbel";

  const wsInfo = wb.addWorksheet("PETUNJUK", { properties: { tabColor: { argb: "FF2563EB" } } });
  wsInfo.getCell("A1").value = "PETUNJUK IMPORT DATA SISWA";
  wsInfo.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2563EB" } };
  wsInfo.getCell("A3").value = "Sheet SISWA berisi data siswa. Jangan ubah baris header (baris 1).";
  wsInfo.getCell("A4").value = "Kolom bertanda * adalah wajib diisi.";
  wsInfo.getCell("A6").value = "Email harus unik. Jika email sudah terdaftar, siswa akan di-skip.";
  wsInfo.getCell("A7").value = "Password default untuk semua siswa: siswa123 (akan di-hash otomatis).";
  wsInfo.getCell("A8").value = "Tanggal lahir format: YYYY-MM-DD (contoh: 2010-05-15).";

  const ws = wb.addWorksheet("SISWA", { properties: { tabColor: { argb: "FFEA580C" } } });
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const columns = [
    { header: "nama *", key: "name", width: 30 },
    { header: "email *", key: "email", width: 35 },
    { header: "phone", key: "phone", width: 18 },
    { header: "jenis_kelamin", key: "gender", width: 15 },
    { header: "tanggal_lahir", key: "birthDate", width: 18 },
    { header: "alamat", key: "address", width: 40 },
    { header: "sekolah", key: "school", width: 25 },
    { header: "kelas", key: "gradeLevel", width: 10 },
  ];

  const headerStyle: Partial<ExcelJS.Style> = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    alignment: { horizontal: "center", wrapText: true },
  };

  columns.forEach((col, i) => {
    const cell = ws.getCell(`${String.fromCharCode(65 + i)}1`);
    cell.value = col.header;
    cell.style = headerStyle;
    ws.getColumn(i + 1).width = col.width;
  });

  ws.getRow(1).height = 28;

  const examples = [
    ["Ahmad Fauzi", "ahmad.fauzi@email.com", "081234567890", "L", "2010-05-15", "Jl. Merdeka No. 10", "SMP Negeri 1", "8"],
    ["Siti Nurhaliza", "siti.n@email.com", "081234567891", "P", "2011-03-20", "Jl. Sudirman No. 5", "SMP Negeri 2", "7"],
  ];

  examples.forEach((row) => {
    const dataRow = ws.addRow(row);
    dataRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
      cell.font = { color: { argb: "FF6B7280" }, italic: true };
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-siswa.xlsx"',
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const body = await req.json();
  const { rows, defaultPassword } = body as {
    rows: {
      name: string;
      email: string;
      phone?: string;
      gender?: string;
      birthDate?: string;
      address?: string;
      school?: string;
      gradeLevel?: string;
    }[];
    defaultPassword?: string;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows tidak boleh kosong" }, { status: 400 });
  }

  const password = defaultPassword || "siswa123";
  const { hash } = await import("bcryptjs");

  const results: { row: number; status: "ok" | "error" | "skip"; message?: string; name?: string }[] = [];
  const toCreate: { data: Parameters<typeof db.user.create>[0]["data"]; rowIdx: number }[] = [];

  const existingEmails = new Set(
    (await db.user.findMany({
      where: { email: { in: rows.map((r) => r.email?.toLowerCase()).filter(Boolean) } },
      select: { email: true },
    })).map((u) => u.email.toLowerCase())
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const name = (row.name ?? "").trim();
    if (!name) {
      results.push({ row: rowNum, status: "error", message: "Nama wajib diisi" });
      continue;
    }

    const email = (row.email ?? "").trim().toLowerCase();
    if (!email) {
      results.push({ row: rowNum, status: "error", message: "Email wajib diisi", name });
      continue;
    }

    if (existingEmails.has(email)) {
      results.push({ row: rowNum, status: "skip", message: "Email sudah terdaftar", name });
      continue;
    }

    const hashedPassword = await hash(password, 10);
    existingEmails.add(email);

    toCreate.push({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SISWA",
        defaultBranchId: branchId,
        isActive: true,
        profile: {
          create: {
            phone: row.phone?.trim() || null,
            address: row.address?.trim() || null,
            birthDate: row.birthDate ? new Date(row.birthDate) : null,
            gender: (row.gender?.toUpperCase() === "L" ? "L" : row.gender?.toUpperCase() === "P" ? "P" : null) as never,
            schoolName: row.school?.trim() || null,
            gradeLevel: row.gradeLevel?.trim() || null,
          },
        },
      },
      rowIdx: rowNum,
    });

    results.push({ row: rowNum, status: "ok", name });
  }

  let inserted = 0;
  for (const item of toCreate) {
    try {
      await db.user.create({ data: item.data });
      inserted++;
    } catch (err) {
      const idx = results.findIndex((r) => r.row === item.rowIdx);
      if (idx >= 0) {
        results[idx] = { row: item.rowIdx, status: "error", message: "Gagal membuat user", name: results[idx].name };
      }
    }
  }

  return NextResponse.json({
    inserted,
    total: rows.length,
    skipped: results.filter((r) => r.status === "skip").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
