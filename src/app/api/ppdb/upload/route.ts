import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak upload. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Layanan upload belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const documentTypeId = formData.get("documentTypeId") as string | null;

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!documentTypeId) return NextResponse.json({ error: "Document type wajib diisi" }, { status: 400 });

  const docType = await db.documentType.findUnique({
    where: { id: documentTypeId },
  });
  if (!docType || !docType.isActive) {
    return NextResponse.json({ error: "Jenis dokumen tidak valid" }, { status: 400 });
  }

  const allowedTypes = docType.allowedTypes as string[];
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  if (!allowedTypes.includes(fileExt)) {
    return NextResponse.json(
      { error: `Format tidak didukung. Diterima: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const maxBytes = docType.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Ukuran file melebihi batas ${docType.maxSizeMb}MB` },
      { status: 400 }
    );
  }

  const allowedMimePrefixes = ["image/", "application/pdf", "application/msword", "application/vnd.openxmlformats"];
  const mimeOk = allowedMimePrefixes.some((p) => file.type.startsWith(p));
  if (!mimeOk) {
    return NextResponse.json({ error: `Tipe MIME tidak diizinkan: ${file.type}` }, { status: 400 });
  }

  const resourceType: "image" | "raw" = file.type.startsWith("image/") ? "image" : "raw";
  const buffer = Buffer.from(await file.arrayBuffer());
  const slug = file.name.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\.[^.]+$/, "");
  const filename = `ppdb_${slug}_${Date.now()}`;

  try {
    const result = await uploadToCloudinary(buffer, "ppdb", filename, resourceType);
    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      name: file.name,
      documentTypeId,
    });
  } catch (err: unknown) {
    console.error("[PPDB Upload] error:", err);
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: "Upload gagal", detail: message }, { status: 500 });
  }
}
