import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { generateAffiliateCode } from "@/lib/affiliate-code";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const isActive = searchParams.get("isActive");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { whatsapp: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (isActive !== null && isActive !== undefined && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const [affiliates, total] = await Promise.all([
    db.affiliate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { referrals: true } },
      },
    }),
    db.affiliate.count({ where }),
  ]);

  return NextResponse.json({
    data: affiliates,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, whatsapp, email, category, bankName, bankAccount, bankHolder, userId } = body;

  if (!name || !whatsapp) {
    return NextResponse.json({ error: "Nama dan WhatsApp wajib diisi" }, { status: 400 });
  }

  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "Akun user tidak ditemukan" }, { status: 400 });
    }
    const taken = await db.affiliate.findUnique({ where: { userId }, select: { id: true } });
    if (taken) {
      return NextResponse.json({ error: "Akun user sudah terhubung ke afiliator lain" }, { status: 409 });
    }
  }

  const code = await generateAffiliateCode(name);

  const affiliate = await db.affiliate.create({
    data: {
      code,
      name,
      whatsapp,
      email: email || null,
      category: category || "UMUM",
      bankName: bankName || null,
      bankAccount: bankAccount || null,
      bankHolder: bankHolder || null,
      userId: userId || null,
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "Affiliate",
    entityId: affiliate.id,
    after: { code, name, whatsapp },
  });

  return NextResponse.json(affiliate, { status: 201 });
}
