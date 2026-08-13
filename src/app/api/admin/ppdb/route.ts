import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId") || scope.branchId;
  const programId = searchParams.get("programId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (programId) where.programId = programId;
  if (session.user.role !== "SUPER_ADMIN" && scope.branchId) {
    where.branchId = scope.branchId;
  } else if (branchId) {
    where.branchId = branchId;
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { registrationNo: { contains: search, mode: "insensitive" } },
      { whatsapp: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [registrations, total] = await Promise.all([
    db.registration.findMany({
      where,
      include: {
        program: { select: { name: true } },
        branch: { select: { name: true, code: true } },
        documents: { select: { id: true, isVerified: true, documentType: { select: { name: true } } } },
        _count: { select: { documents: true, statusLogs: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.registration.count({ where }),
  ]);

  return NextResponse.json({
    registrations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
