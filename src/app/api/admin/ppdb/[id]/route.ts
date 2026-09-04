import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();
  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, price: true } },
      branch: { select: { id: true, name: true, code: true } },
      educationLevel: { select: { id: true, name: true, code: true } },
      documents: {
        include: { documentType: true },
      },
      statusLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  }
  if (!isSuperAdmin && registration.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(registration);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();

  const existing = await db.registration.findUnique({ where: { id }, select: { branchId: true } });
  if (!existing) return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  if (!isSuperAdmin && existing.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.registrationFee === "number") {
    updateData.registrationFee = body.registrationFee;
  }
  if (typeof body.adminNote === "string") {
    updateData.adminNote = body.adminNote;
  }
  if (body.preferredClassId !== undefined) {
    if (body.preferredClassId === null || body.preferredClassId === "") {
      updateData.preferredClassId = null;
    } else if (typeof body.preferredClassId === "string") {
      const cls = await db.class.findUnique({
        where: { id: body.preferredClassId },
        select: { id: true },
      });
      if (!cls) {
        return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 400 });
      }
      updateData.preferredClassId = body.preferredClassId;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
  }

  const updated = await db.registration.update({
    where: { id },
    data: updateData,
  });

  await logAudit({ entity: "Registration", entityId: id, action: "UPDATE", after: updateData });
  return NextResponse.json(updated);
}
