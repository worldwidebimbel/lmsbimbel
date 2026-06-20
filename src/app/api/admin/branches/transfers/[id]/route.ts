import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;
  if (!status || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "status harus APPROVED atau REJECTED" }, { status: 400 });
  }

  const transfer = await db.branchCashTransfer.findUnique({ where: { id } });
  if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (transfer.status !== "PENDING") return NextResponse.json({ error: "Transfer sudah diproses" }, { status: 400 });

  const updated = await db.$transaction(async (tx) => {
    const upd = await tx.branchCashTransfer.update({
      where: { id },
      data: { status, approvedBy: session.user.id, approvedAt: new Date() },
    });
    if (status === "APPROVED") {
      await tx.branchTransaction.create({
        data: { branchId: transfer.fromBranchId, type: "TRANSFER_OUT", category: "Transfer Keluar", amount: transfer.amount, date: new Date(), note: `Transfer ke ${transfer.toBranchId}`, createdBy: session.user.id },
      });
      await tx.branchTransaction.create({
        data: { branchId: transfer.toBranchId, type: "TRANSFER_IN", category: "Transfer Masuk", amount: transfer.amount, date: new Date(), note: `Transfer dari ${transfer.fromBranchId}`, createdBy: session.user.id },
      });
    }
    return upd;
  });

  return NextResponse.json(updated);
}
