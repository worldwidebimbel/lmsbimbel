import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      plan: true,
      payments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && invoice.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();

  const existing = await db.invoice.findUnique({ where: { id }, select: { branchId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && existing.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.invoice.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.note !== undefined && { note: body.note }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
    },
    include: {
      student: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
  });

  await logAudit({ entity: "Invoice", entityId: id, action: "UPDATE", after: { status: body.status, amount: body.amount, dueDate: body.dueDate } });
  return NextResponse.json(updated);
}
