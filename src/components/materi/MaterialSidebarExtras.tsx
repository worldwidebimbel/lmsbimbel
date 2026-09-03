import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";

export function MaterialBabList({
  title, items, detailHref,
}: {
  title: string;
  items: string[];
  detailHref?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {detailHref && (
        <Link
          href={detailHref}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Lihat Detail Materi
        </Link>
      )}
    </div>
  );
}

export function MaterialHelpBox({ teacherId, teacherName }: { teacherId?: string | null; teacherName?: string | null }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1.5">Butuh Bantuan?</h3>
      <p className="text-xs text-gray-500 mb-3">
        Jika ada kesulitan{teacherName ? ` memahami materi dari ${teacherName}` : ""}, jangan ragu untuk menghubungi tutor kami.
      </p>
      <Link
        href={teacherId ? `/siswa/chat?to=${teacherId}` : "/siswa/chat"}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        <MessageCircle className="h-3.5 w-3.5" /> Hubungi Tutor
      </Link>
    </div>
  );
}
