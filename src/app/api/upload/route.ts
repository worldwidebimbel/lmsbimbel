import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (!configured) {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di .env.local" },
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const slug = file.name.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\.[^.]+$/, "");
  const filename = `${slug}_${Date.now()}`;

  try {
    const result = await uploadToCloudinary(buffer, folder, filename);
    return NextResponse.json({ url: result.url, publicId: result.publicId, name: file.name });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
