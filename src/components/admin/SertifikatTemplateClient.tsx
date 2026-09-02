"use client";

import { useState, useTransition } from "react";
import { Award, Save, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";

interface Cert { id: string; code: string; type: string; title: string; recipientName: string; issuedAt: string; user: { name: string } }

interface Props {
  template: Record<string, string>;
  recentCerts: Cert[];
}

const TYPE_LABEL: Record<string, string> = {
  LMS_COMPLETION: "Kelulusan LMS",
  EVENT_PARTICIPATION: "Peserta Event",
  EVENT_WINNER: "Juara Event",
};

const FIELDS = [
  { key: "cert_org_name",        label: "Nama Organisasi",         placeholder: "EduBimbel LMS" },
  { key: "cert_title_prefix",    label: "Judul Utama Sertifikat",  placeholder: "SERTIFIKAT" },
  { key: "cert_subtitle",        label: "Sub-teks (di bawah judul)", placeholder: "diberikan kepada" },
  { key: "cert_signature_name",  label: "Nama Penanda Tangan",     placeholder: "Kepala Lembaga" },
  { key: "cert_signature_title", label: "Jabatan Penanda Tangan",  placeholder: "EduBimbel LMS" },
  { key: "cert_logo_url",        label: "URL Logo",                placeholder: "https://..." },
  { key: "cert_bg_url",          label: "URL Gambar Latar",        placeholder: "https://... (optional)" },
];

export default function SertifikatTemplateClient({ template, recentCerts }: Props) {
  const [form, setForm] = useState<Record<string, string>>(template);
  const [isPending, startTransition] = useTransition();
  const [previewCode, setPreviewCode] = useState(recentCerts[0]?.code ?? "");

  function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/admin/sertifikat/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Template sertifikat disimpan");
      else toast.error("Gagal menyimpan template");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Template Sertifikat</h1>
            <p className="text-sm text-gray-500">Konfigurasi tampilan sertifikat yang dikeluarkan sistem</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pengaturan Template</h2>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input
                type="text"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}

          {/* Preview link */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Preview dengan sertifikat nyata</p>
            <div className="flex gap-2">
              <select
                value={previewCode}
                onChange={(e) => setPreviewCode(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {recentCerts.length === 0 && <option value="">Belum ada sertifikat</option>}
                {recentCerts.map((c) => (
                  <option key={c.code} value={c.code}>{c.user.name} — {TYPE_LABEL[c.type] ?? c.type}</option>
                ))}
              </select>
              <a
                href={previewCode ? `/sertifikat/${previewCode}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" /> Preview
              </a>
            </div>
          </div>
        </div>

        {/* Recent certificates */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Sertifikat Terbaru</h2>
          </div>
          {recentCerts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Belum ada sertifikat dikeluarkan</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentCerts.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cert.recipientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        {TYPE_LABEL[cert.type] ?? cert.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(cert.issuedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/sertifikat/${cert.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
