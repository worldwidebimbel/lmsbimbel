import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { proofUrl } = body;

  if (!proofUrl) {
    return NextResponse.json({ error: "Bukti pembayaran wajib diupload" }, { status: 400 });
  }

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

  // Verifikasi invoice milik anak dari ortu ini
  const link = await db.parentChild.findFirst({
    where: { parentId: session.user.id, childId: invoice.studentId },
  });
  if (!link) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

  if (!["UNPAID", "OVERDUE"].includes(invoice.status)) {
    return NextResponse.json({ error: "Status tagihan tidak valid" }, { status: 400 });
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
    db.invoice.update({ where: { id }, data: { status: "PENDING" } }),
  ]);

  const admins = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
  if (admins.length > 0) {
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "INFO",
        title: "Bukti Pembayaran Masuk",
        content: `Orang tua dari ${invoice.student.name} mengirimkan bukti pembayaran QRIS.`,
        link: `/admin/finance/${id}`,
      })),
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
