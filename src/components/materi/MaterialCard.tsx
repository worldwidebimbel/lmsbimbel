"use client";

import { useState } from "react";
import { FileText, Video, Link2, BookOpen, Youtube, CheckCircle, ExternalLink, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Subject = { id: string; name: string; color: string; code: string };
type Class = { id: string; name: string };

interface MaterialCardProps {
  material: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    fileUrl: string | null;
    uploader: { name: string };
    subject: Subject | null;
    class: Class | null;
    createdAt: Date | string;
  };
  isCompleted: boolean;
  studentId: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  PDF: FileText,
  VIDEO: Video,
  YOUTUBE: Youtube,
  PRESENTATION: FileText,
  DOCUMENT: FileText,
  LINK: Link2,
  TEXT: BookOpen,
};

const TYPE_COLOR: Record<string, string> = {
  PDF: "bg-red-100 text-red-600",
  VIDEO: "bg-blue-100 text-blue-600",
  YOUTUBE: "bg-red-100 text-red-500",
  PRESENTATION: "bg-orange-100 text-orange-600",
  DOCUMENT: "bg-indigo-100 text-indigo-600",
  LINK: "bg-teal-100 text-teal-600",
  TEXT: "bg-green-100 text-green-600",
};

const TYPE_LABEL: Record<string, string> = {
  PDF: "PDF",
  VIDEO: "Video",
  YOUTUBE: "YouTube",
  PRESENTATION: "PPT",
  DOCUMENT: "Dokumen",
  LINK: "Link",
  TEXT: "Teks",
};

export function MaterialCard({ material, isCompleted: initialCompleted, studentId }: MaterialCardProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  const Icon = TYPE_ICON[material.type] ?? FileText;

  const handleOpen = async () => {
    if (material.fileUrl) {
      window.open(material.fileUrl, "_blank", "noopener,noreferrer");
    }
    if (!completed) {
      setLoading(true);
      try {
        const res = await fetch(`/api/materi/${material.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        if (res.ok) setCompleted(true);
      } catch {
        // fail silently — progress tracking is non-critical
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/materi/${material.id}/progress`, {
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

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${completed ? "border-green-200 bg-green-50/30" : "border-gray-200 hover:shadow-sm hover:border-blue-200"}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLOR[material.type]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-900 text-sm truncate">{material.title}</p>
              {completed && (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[material.type]}`}>
                {TYPE_LABEL[material.type]}
              </span>
              {material.subject && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: material.subject.color }} />
                  {material.subject.name}
                </span>
              )}
            </div>
            {material.description && (
              <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{material.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {material.fileUrl ? (
            <button
              onClick={handleOpen}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Materi
            </button>
          ) : (
            <span className="flex-1 text-center text-xs text-gray-400 py-2">Materi belum tersedia</span>
          )}

          {!completed && (
            <button
              onClick={handleMarkDone}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Selesai
            </button>
          )}

          <Link
            href={`/siswa/materi/${material.id}`}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Detail <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
