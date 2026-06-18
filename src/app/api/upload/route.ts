import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configured = isCloudinaryConfigured();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  console.log("[Upload] Cloudinary configured?", configured, "cloud_name present?", !!cloudName);

  if (!configured) {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di .env.local lalu restart server." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "general";

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

  const maxMb = 20;
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `Ukuran file maksimal ${maxMb}MB` }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: `File harus gambar (image/*), diterima: ${file.type}` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const slug = file.name.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\.[^.]+$/, "");
  const filename = `${slug}_${Date.now()}`;

  try {
    const result = await uploadToCloudinary(buffer, folder, filename, "image");
    return NextResponse.json({ url: result.url, publicId: result.publicId, name: file.name });
  } catch (err: unknown) {
    console.error("[Upload] Cloudinary error:", err);
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json(
      { error: "Upload gagal", detail: message },
      { status: 500 }
    );
  }
}
