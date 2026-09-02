import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { branchId, isSuperAdmin } = await getBranchScope();

  const record = await db.teacherAttendance.findUnique({
    where: { id },
    select: { id: true, branchId: true, verifiedAt: true },
  });

  if (!record) return NextResponse.json({ error: "Absensi tidak ditemukan" }, { status: 404 });

  if (!isSuperAdmin && branchId && record.branchId !== branchId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  if (record.verifiedAt) {
    return NextResponse.json({ error: "Absensi sudah diverifikasi" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { note } = body;

  const updated = await db.teacherAttendance.update({
    where: { id },
    data: {
      verifiedAt: new Date(),
      verifiedBy: session.user.id,
      note: note ?? null,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
  });

  await logAudit({ entity: "TeacherAttendance", entityId: id, action: "UPDATE", after: { verified: true } });
  return NextResponse.json(updated);
}
