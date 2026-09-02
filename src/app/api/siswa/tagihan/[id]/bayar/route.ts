import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminIdsForBranch } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { proofUrl } = body;

  if (!proofUrl) {
    return NextResponse.json({ error: "Bukti pembayaran wajib diupload" }, { status: 400 });
  }

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.studentId !== session.user.id) {
    return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }
  if (!["UNPAID", "OVERDUE"].includes(invoice.status)) {
    return NextResponse.json({ error: "Status tagihan tidak valid untuk pembayaran" }, { status: 400 });
  }

  await db.$transaction([
    db.payment.create({
      data: {
        invoiceId: id,
        userId: session.user.id,
        amount: invoice.amount,
        method: "QRIS",
        proofUrl,
      },
    }),
    db.invoice.update({
      where: { id },
      data: { status: "PENDING" },
    }),
  ]);

  // Buat notifikasi untuk admin cabang terkait
  const adminIds = await getAdminIdsForBranch(invoice.branchId);
  if (adminIds.length > 0) {
    await db.notification.createMany({
      data: adminIds.map((adminId) => ({
        userId: adminId,
        type: "INFO",
        title: "Bukti Pembayaran Masuk",
        content: `${session.user.name} mengirimkan bukti pembayaran QRIS. Mohon dikonfirmasi.`,
        link: `/admin/finance/${id}`,
      })),
    });
  }

  await logAudit({ entity: "Payment", entityId: id, action: "CREATE", after: { invoiceId: id, amount: invoice.amount, method: "QRIS", byRole: "SISWA" } });
  return NextResponse.json({ success: true }, { status: 201 });
}
