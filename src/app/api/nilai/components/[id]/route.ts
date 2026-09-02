import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.grade.deleteMany({ where: { componentId: id } });
  await db.gradeComponent.delete({ where: { id } });

  await logAudit({ entity: "GradeComponent", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
