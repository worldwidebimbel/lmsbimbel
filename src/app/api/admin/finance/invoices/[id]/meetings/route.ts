import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json().catch(() => ({}));
  const { delta = 1 } = body;

  const invoice = await db.invoice.findUnique({ where: { id }, include: { branch: { select: { id: true } } } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && invoice.branchId && invoice.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!invoice.meetingCount) return NextResponse.json({ error: "Tagihan bukan paket pertemuan" }, { status: 400 });

  const newUsage = Math.max(0, Math.min(invoice.meetingUsage + Number(delta), invoice.meetingCount));
  const updated = await db.invoice.update({
    where: { id },
    data: { meetingUsage: newUsage },
    include: { student: { select: { id: true, name: true } }, plan: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
