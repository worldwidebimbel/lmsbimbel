import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const members = await db.siteTeamMember.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, role, bio, photoUrl, email, phone, linkedin, order } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "name dan role wajib diisi" }, { status: 400 });
  }

  const member = await db.siteTeamMember.create({
    data: {
      name,
      role,
      bio: bio ?? null,
      photoUrl: photoUrl ?? null,
      email: email ?? null,
      phone: phone ?? null,
      linkedin: linkedin ?? null,
      order: Number(order ?? 0),
    },
  });

  await logAudit({ entity: "SiteTeamMember", entityId: member.id, action: "CREATE", after: { name, role } });
  return NextResponse.json(member, { status: 201 });
}
