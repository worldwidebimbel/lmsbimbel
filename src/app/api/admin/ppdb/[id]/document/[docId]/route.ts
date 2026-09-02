import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, docId } = await params;
  const body = await req.json();
  const { isVerified, note } = body;

  const doc = await db.registrationDocument.findFirst({
    where: { id: docId, registrationId: id },
  });

  if (!doc) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  }

  const updated = await db.registrationDocument.update({
    where: { id: docId },
    data: { isVerified, note: note || null },
  });

  await logAudit({ entity: "RegistrationDocument", entityId: docId, action: "UPDATE", after: { isVerified } });
  return NextResponse.json(updated);
}
