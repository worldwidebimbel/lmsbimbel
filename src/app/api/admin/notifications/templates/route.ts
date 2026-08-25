import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permission";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await db.notificationTemplate.findMany({
    include: { _count: { select: { logs: true } } },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, name, channel, subject, body: templateBody, variables, isActive } = body;

  if (!code || !name || !templateBody) {
    return NextResponse.json({ error: "code, name, body wajib diisi" }, { status: 400 });
  }

  const existing = await db.notificationTemplate.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Kode template sudah ada" }, { status: 409 });
  }

  const template = await db.notificationTemplate.create({
    data: {
      code,
      name,
      channel: channel ?? "WA",
      subject: subject ?? null,
      body: templateBody,
      variables: variables ?? [],
      isActive: isActive ?? true,
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "NotificationTemplate",
    entityId: template.id,
    after: { code, name, channel },
  });

  return NextResponse.json(template, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, channel, subject, body: templateBody, variables, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  const template = await db.notificationTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(channel !== undefined && { channel }),
      ...(subject !== undefined && { subject: subject ?? null }),
      ...(templateBody !== undefined && { body: templateBody }),
      ...(variables !== undefined && { variables }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "NotificationTemplate",
    entityId: id,
    after: { name, channel, isActive },
  });

  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  await db.notificationTemplate.delete({ where: { id } });

  await logAudit({
    action: "DELETE",
    entity: "NotificationTemplate",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
