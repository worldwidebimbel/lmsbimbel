"use client";

import { Award, Download, ExternalLink } from "lucide-react";

interface Cert {
  id: string;
  code: string;
  certificateNo: string | null;
  type: string;
  title: string;
  recipientName: string;
  eventName: string | null;
  score: number | null;
  rank: number | null;
  issuedAt: string;
  template: { name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  LMS_COMPLETION: "Kelulusan Program",
  EVENT_PARTICIPATION: "Peserta Event",
  EVENT_WINNER: "Juara Event",
};

const TYPE_COLOR: Record<string, string> = {
  LMS_COMPLETION: "bg-green-100 text-green-700",
  EVENT_PARTICIPATION: "bg-blue-100 text-blue-700",
  EVENT_WINNER: "bg-amber-100 text-amber-700",
};

export default function SertifikatSiswaClient({ certificates }: { certificates: Cert[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sertifikat Saya</h1>
          <p className="text-sm text-gray-500">Daftar sertifikat yang telah Anda peroleh</p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Belum ada sertifikat. Selesaikan program atau ikuti event untuk mendapatkan sertifikat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{cert.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${TYPE_COLOR[cert.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPE_LABEL[cert.type] ?? cert.type}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-0.5">
                <p>No: <span className="font-mono">{cert.certificateNo ?? cert.code}</span></p>
                {cert.eventName && <p>Event: {cert.eventName}</p>}
                {cert.score != null && <p>Nilai: <strong>{cert.score}</strong></p>}
                {cert.rank != null && <p>Peringkat: <strong>{cert.rank}</strong></p>}
                <p>Diterbitkan: {new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <a
                  href={`/sertifikat/${cert.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Lihat
                </a>
                <a
                  href={`/api/siswa/sertifikat/${cert.id}?download=pdf`}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
