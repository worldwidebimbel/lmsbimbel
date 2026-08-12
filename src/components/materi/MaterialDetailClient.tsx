"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, Loader2, FileText, Video, Link2, Youtube, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface MaterialDetailClientProps {
  materialId: string;
  fileUrl: string | null;
  type: string;
  studentId: string;
  isCompleted: boolean;
}

export default function MaterialDetailClient({
  materialId, fileUrl, type, studentId, isCompleted: initialCompleted,
}: MaterialDetailClientProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
    if (!completed) {
      setLoading(true);
      try {
        const res = await fetch(`/api/materi/${materialId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        if (res.ok) setCompleted(true);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkDone = async () => {
    if (completed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/materi/${materialId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, isCompleted: true }),
      });
      if (res.ok) {
        setCompleted(true);
        toast.success("Materi ditandai selesai");
      }
    } catch {
      toast.error("Gagal menyimpan progress");
    } finally {
      setLoading(false);
    }
  };

  const isVideo = type === "VIDEO" || type === "YOUTUBE";
  const isEmbeddable = fileUrl && (fileUrl.includes("youtube.com/embed") || fileUrl.includes("player.vimeo.com"));

  return (
    <div className="space-y-4">
      {isVideo && isEmbeddable && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <iframe
            src={fileUrl!}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        {fileUrl && !isEmbeddable && (
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Buka Materi
          </button>
        )}

        {!completed && (
          <button
            onClick={handleMarkDone}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Tandai Selesai
          </button>
        )}

        {completed && (
          <span className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle className="h-4 w-4" /> Materi selesai
          </span>
        )}
      </div>
    </div>
  );
}
