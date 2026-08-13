import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const where: Prisma.BranchCashTransferWhereInput = {};
  if (status) where.status = status as Prisma.EnumBranchTransferStatusFilter;
  if (session.user.role !== "SUPER_ADMIN" && session.user.defaultBranchId) {
    where.OR = [
      { fromBranchId: session.user.defaultBranchId },
      { toBranchId: session.user.defaultBranchId },
    ];
  }

  const transfers = await db.branchCashTransfer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      fromBranch: { select: { id: true, name: true, code: true } },
      toBranch: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { fromBranchId, toBranchId, amount, note } = body;

  if (!fromBranchId || !toBranchId || !amount || fromBranchId === toBranchId) {
    return NextResponse.json({ error: "fromBranchId, toBranchId, amount wajib diisi dan harus berbeda" }, { status: 400 });
  }

  if (session.user.role !== "SUPER_ADMIN" && fromBranchId !== session.user.defaultBranchId) {
    return NextResponse.json({ error: "Hanya bisa transfer dari cabang sendiri" }, { status: 403 });
  }

  const transfer = await db.branchCashTransfer.create({
    data: {
      fromBranchId,
      toBranchId,
      amount: Number(amount),
      note: note || null,
      requestedBy: session.user.id,
    },
    include: {
      fromBranch: { select: { id: true, name: true, code: true } },
      toBranch: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(transfer, { status: 201 });
}
