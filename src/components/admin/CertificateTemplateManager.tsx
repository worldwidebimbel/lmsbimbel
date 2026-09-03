"use client";

import { useState, useTransition } from "react";
import { Award, Plus, Trash2, Edit3, X, Save, Move } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  type: string;
  backgroundImage: string | null;
  headerText: string | null;
  bodyText: string | null;
  footerText: string | null;
  signatureText: string | null;
  signatureImage: string | null;
  logoImage: string | null;
  fieldPositions: unknown;
  isActive: boolean;
  createdAt: string;
  _count: { certificates: number };
}

const TYPE_LABEL: Record<string, string> = {
  LMS_COMPLETION: "Kelulusan LMS",
  EVENT_PARTICIPATION: "Peserta Event",
  EVENT_WINNER: "Juara Event",
};

const FIELD_LABELS: Record<string, string> = {
  header: "Header Text",
  body: "Body Text",
  recipientName: "Nama Penerima",
  certificateNo: "Nomor Sertifikat",
  score: "Nilai",
  rank: "Peringkat",
  issuedDate: "Tanggal Terbit",
  signature: "Tanda Tangan",
  qrCode: "QR Code",
};

const EMPTY_FORM = {
  name: "",
  type: "LMS_COMPLETION",
  headerText: "SERTIFIKAT",
  bodyText: "Diberikan kepada",
  footerText: "",
  signatureText: "",
  backgroundImage: "",
  signatureImage: "",
  logoImage: "",
  isActive: true,
  fieldPositions: {} as Record<string, { x: number; y: number; fontSize: number }>,
};

export default function CertificateTemplateManager({ templates: initial }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setForm({
      name: t.name,
      type: t.type,
      headerText: t.headerText ?? "",
      bodyText: t.bodyText ?? "",
      footerText: t.footerText ?? "",
      signatureText: t.signatureText ?? "",
      backgroundImage: t.backgroundImage ?? "",
      signatureImage: t.signatureImage ?? "",
      logoImage: t.logoImage ?? "",
      isActive: t.isActive,
      fieldPositions: (t.fieldPositions as Record<string, { x: number; y: number; fontSize: number }>) ?? {},
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  function updateFieldPosition(field: string, axis: "x" | "y" | "fontSize", value: number) {
    setForm((p) => {
      const current = p.fieldPositions[field] ?? { x: 50, y: 50, fontSize: 14 };
      return {
        ...p,
        fieldPositions: {
          ...p.fieldPositions,
          [field]: { ...current, [axis]: value },
        },
      };
    });
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nama template wajib diisi");
      return;
    }
    startTransition(async () => {
      const url = editingId
        ? `/api/admin/sertifikat/templates/${editingId}`
        : "/api/admin/sertifikat/templates";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingId ? "Template diperbarui" : "Template dibuat");
        setShowForm(false);
        const updated = await fetch("/api/admin/sertifikat/templates").then((r) => r.json());
        setTemplates(updated);
      } else {
        toast.error("Gagal menyimpan template");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus template ini?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/sertifikat/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template dihapus");
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus template");
      }
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
            <p className="text-sm text-gray-500">Kelola template untuk sertifikat PDF dengan QR Code</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Template Baru
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editingId ? "Edit Template" : "Template Baru"}</h2>
            <button onClick={() => setShowForm(false)} title="Tutup" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Template</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Sertifikat</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Header Text</label>
              <input
                type="text"
                value={form.headerText}
                onChange={(e) => setForm((p) => ({ ...p, headerText: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Text</label>
              <input
                type="text"
                value={form.bodyText}
                onChange={(e) => setForm((p) => ({ ...p, bodyText: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Text</label>
              <input
                type="text"
                value={form.footerText}
                onChange={(e) => setForm((p) => ({ ...p, footerText: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penanda Tangan</label>
              <input
                type="text"
                value={form.signatureText}
                onChange={(e) => setForm((p) => ({ ...p, signatureText: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Logo (opsional)</label>
              <input
                type="text"
                value={form.logoImage}
                onChange={(e) => setForm((p) => ({ ...p, logoImage: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Background (opsional)</label>
              <input
                type="text"
                value={form.backgroundImage}
                onChange={(e) => setForm((p) => ({ ...p, backgroundImage: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {/* Field Position Editor */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Move className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Editor Posisi Field</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Atur posisi (x, y dalam %) dan ukuran font untuk setiap field di sertifikat PDF.</p>
            <div className="space-y-2">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const pos = form.fieldPositions[key];
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-32 text-gray-600 shrink-0">{label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pos?.x ?? ""}
                      onChange={(e) => updateFieldPosition(key, "x", Number(e.target.value))}
                      placeholder="X"
                      className="w-16 rounded border border-gray-200 px-2 py-1"
                    />
                    <span className="text-gray-500">%</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pos?.y ?? ""}
                      onChange={(e) => updateFieldPosition(key, "y", Number(e.target.value))}
                      placeholder="Y"
                      className="w-16 rounded border border-gray-200 px-2 py-1"
                    />
                    <span className="text-gray-500">%</span>
                    <input
                      type="number"
                      min={6}
                      max={72}
                      value={pos?.fontSize ?? ""}
                      onChange={(e) => updateFieldPosition(key, "fontSize", Number(e.target.value))}
                      placeholder="Font"
                      className="w-16 rounded border border-gray-200 px-2 py-1"
                    />
                    <span className="text-gray-500">px</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Template aktif</label>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Menyimpan..." : "Simpan Template"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
            Belum ada template. Klik &quot;Template Baru&quot; untuk membuat.
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">
                    {TYPE_LABEL[t.type] ?? t.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Header: {t.headerText ?? "-"}</p>
                <p>Body: {t.bodyText ?? "-"}</p>
                <p>Penanda tangan: {t.signatureText ?? "-"}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.isActive ? "Aktif" : "Nonaktif"}
                </span>
                <span className="text-[10px] text-gray-500">{t._count.certificates} sertifikat</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
