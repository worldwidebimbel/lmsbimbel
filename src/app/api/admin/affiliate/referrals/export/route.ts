import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const affiliateId = searchParams.get("affiliateId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (affiliateId) where.affiliateId = affiliateId;

  const referrals = await db.referral.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: { select: { code: true, name: true } },
      registration: { select: { registrationNo: true, fullName: true, status: true } },
      program: { select: { name: true } },
      commissions: { select: { amount: true } },
    },
  });

  const data = referrals.map((r) => ({
    tanggal: new Date(r.createdAt).toLocaleDateString("id-ID"),
    kode: r.affiliate.code,
    afiliator: r.affiliate.name,
    calonSiswa: r.registration?.fullName ?? "-",
    noRegistrasi: r.registration?.registrationNo ?? "-",
    statusPendaftar: r.registration?.status ?? "-",
    program: r.program?.name ?? "-",
    totalKomisi: r.commissions.reduce((s, c) => s + c.amount, 0),
    statusReferral: r.status,
    fraud: r.fraudFlag ? `Ya${r.fraudReason ? ` — ${r.fraudReason}` : ""}` : "Tidak",
  }));

  const buffer = await generateExcelBuffer({
    filename: "referral-afiliator",
    sheetName: "Referral Afiliator",
    columns: [
      { header: "Tanggal", key: "tanggal", width: 12 },
      { header: "Kode", key: "kode", width: 12 },
      { header: "Afiliator", key: "afiliator", width: 25 },
      { header: "Calon Siswa", key: "calonSiswa", width: 25 },
      { header: "No. Registrasi", key: "noRegistrasi", width: 18 },
      { header: "Status Pendaftar", key: "statusPendaftar", width: 20 },
      { header: "Program", key: "program", width: 20 },
      { header: "Total Komisi", key: "totalKomisi", width: 15, format: "#,##0" },
      { header: "Status Referral", key: "statusReferral", width: 20 },
      { header: "Fraud", key: "fraud", width: 30 },
    ],
    data,
    summaryRows: [
      {
        afiliator: "TOTAL",
        totalKomisi: data.reduce((s, d) => s + d.totalKomisi, 0),
      },
    ],
  });

  return excelResponse(buffer, `referral-afiliator-${Date.now()}`);
}
