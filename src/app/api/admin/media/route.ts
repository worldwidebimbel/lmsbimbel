import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "image" | "raw" | null
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 60;

  const where = {
    ...(type ? { resourceType: type } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [files, total] = await Promise.all([
    db.mediaFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { uploadedBy: { select: { name: true, role: true } } },
    }),
    db.mediaFile.count({ where }),
  ]);

  return NextResponse.json({ files, total, page, pageSize });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  const file = await db.mediaFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });

  try {
    await cloudinary.uploader.destroy(file.publicId, {
      resource_type: file.resourceType as "image" | "raw" | "video",
    });
  } catch (e) {
    console.error("[Media delete] Cloudinary destroy error:", e);
  }

  await db.mediaFile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
