import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canTransition } from "@/lib/ppdb-status";
import { advanceCommissionStatus } from "@/lib/commission";
import { RegistrationStatus } from "@prisma/client";
import { notifyPPDBStatus } from "@/lib/ppdb-notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, note, rejectionReason } = body as {
    status: RegistrationStatus;
    note?: string;
    rejectionReason?: string;
  };

  const registration = await db.registration.findUnique({ where: { id } });
  if (!registration) {
    return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  }

  if (!canTransition(registration.status, status)) {
    return NextResponse.json(
      { error: `Transisi dari ${registration.status} ke ${status} tidak diizinkan` },
      { status: 400 }
    );
  }

  const updated = await db.registration.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      adminNote: note ?? registration.adminNote,
    },
  });

  await db.registrationStatusLog.create({
    data: {
      registrationId: id,
      fromStatus: registration.status,
      toStatus: status,
      note: note || null,
      actorId: session.user.id,
    },
  });

  await logAudit({
    action: "STATUS_CHANGE",
    entity: "Registration",
    entityId: id,
    before: { status: registration.status },
    after: { status, note },
  });

  // Advance affiliate commission based on status change
  if (status === "VERIFIED") {
    await advanceCommissionStatus({ registrationId: id, trigger: "REGISTRATION_VERIFIED" });
  } else if (status === "PAYMENT_VERIFIED") {
    await advanceCommissionStatus({ registrationId: id, trigger: "PAYMENT_VERIFIED" });
  } else if (status === "REJECTED" || status === "CANCELLED") {
    await advanceCommissionStatus({ registrationId: id, trigger: "CANCELLED" });
  }

  // Send notification to applicant
  await notifyPPDBStatus({
    email: registration.email,
    whatsapp: registration.whatsapp,
    name: registration.fullName,
    registrationNo: registration.registrationNo,
    fromStatus: registration.status,
    toStatus: status,
    note: status === "REJECTED" ? rejectionReason : note,
  });

  return NextResponse.json(updated);
}
