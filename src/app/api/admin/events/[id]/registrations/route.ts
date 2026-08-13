import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && branchId && event.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: { select: { name: true, price: true } },
    },
    orderBy: [{ rank: "asc" }, { score: "desc" }, { registeredAt: "asc" }],
  });

  return NextResponse.json(registrations);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && branchId && event.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { registrationId, status, paymentStatus } = body;
  if (!registrationId) return NextResponse.json({ error: "registrationId wajib" }, { status: 400 });

  const updated = await db.eventRegistration.update({
    where: { id: registrationId },
    data: {
      ...(status !== undefined && { status }),
      ...(paymentStatus !== undefined && { paymentStatus, paidAt: paymentStatus === "PAID" ? new Date() : undefined }),
    },
  });

  return NextResponse.json(updated);
}
