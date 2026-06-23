import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import MediaManagerClient from "@/components/admin/MediaManagerClient";

export const metadata = { title: "Media Manager" };

export default async function AdminMediaPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [files, total] = await Promise.all([
    db.mediaFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { uploadedBy: { select: { name: true, role: true } } },
    }),
    db.mediaFile.count(),
  ]);

  return (
    <MediaManagerClient
      initialFiles={files.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        size: f.size ?? null,
        mimeType: f.mimeType ?? null,
        uploadedBy: f.uploadedBy,
      }))}
      initialTotal={total}
    />
  );
}
