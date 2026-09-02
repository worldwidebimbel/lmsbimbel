import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  const items = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const baseSlug = body.slug || slugify(body.title);
  let slug = baseSlug;
  let count = 1;
  while (await db.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count++}`;
  }
  const item = await db.blogPost.create({
    data: {
      slug,
      title: body.title,
      excerpt: body.excerpt ?? null,
      content: body.content,
      coverImage: body.coverImage ?? null,
      author: body.author ?? null,
      category: body.category ?? "Umum",
      tags: body.tags ?? [],
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : null,
    },
  });
  await logAudit({ entity: "BlogPost", entityId: item.id, action: "CREATE", after: { title: body.title, slug } });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  if (data.isPublished && !data.publishedAt) {
    data.publishedAt = new Date();
  }
  const item = await db.blogPost.update({ where: { id }, data });
  await logAudit({ entity: "BlogPost", entityId: id, action: "UPDATE" });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await db.blogPost.delete({ where: { id } });
  await logAudit({ entity: "BlogPost", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
