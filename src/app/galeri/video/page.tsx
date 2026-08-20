import { db } from "@/lib/db";
import PublicShell from "@/components/landing/PublicShell";
import VideoGalleryClient from "./VideoGalleryClient";

export const metadata = {
  title: "Galeri Video - EduBimbel",
  description: "Lihat video kegiatan pembelajaran kami",
};

export default async function VideoGalleryPage() {
  const videos = await db.siteVideo.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  }).catch(() => []);

  const categories = [...new Set(videos.map((v) => v.category))];

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-bold text-blue-900">Galeri Video</h1>
        <p className="mt-2 text-gray-500">Kegiatan pembelajaran dan aktivitas kami</p>
        <VideoGalleryClient videos={videos} categories={categories} />
      </div>
    </PublicShell>
  );
}
