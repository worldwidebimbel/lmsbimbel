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
  const branchId = searchParams.get("branchId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: Prisma.BranchTransactionWhereInput = {};
  if (branchId) where.branchId = branchId;
  if (session.user.role !== "SUPER_ADMIN" && session.user.defaultBranchId) {
    where.branchId = session.user.defaultBranchId;
  }
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);
  }

  const transactions = await db.branchTransaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  const summary = await db.branchTransaction.groupBy({
    by: ["branchId"],
    where: { ...where, type: { in: ["INCOME", "TRANSFER_IN"] } },
    _sum: { amount: true },
  });

  const expenseSummary = await db.branchTransaction.groupBy({
    by: ["branchId"],
    where: { ...where, type: { in: ["EXPENSE", "TRANSFER_OUT"] } },
    _sum: { amount: true },
  });

  return NextResponse.json({ transactions, summary, expenseSummary });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { branchId, type, category, amount, date, note, attachmentUrl } = body;

  if (!branchId || !type || !category || !amount || !date) {
    return NextResponse.json({ error: "branchId, type, category, amount, date wajib diisi" }, { status: 400 });
  }

  if (session.user.role !== "SUPER_ADMIN" && branchId !== session.user.defaultBranchId) {
    return NextResponse.json({ error: "Cabang tidak sesuai" }, { status: 403 });
  }

  const transaction = await db.branchTransaction.create({
    data: {
      branchId,
      type,
      category,
      amount: Number(amount),
      date: new Date(date),
      note: note || null,
      attachmentUrl: attachmentUrl || null,
      createdBy: session.user.id,
    },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
