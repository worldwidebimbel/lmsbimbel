"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Mail, MessageSquare, FileText } from "lucide-react";

type Template = {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  _count?: { logs: number };
};

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<{ data: unknown[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", channel: "WA", subject: "", body: "", variables: "", isActive: true });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notifications/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/admin/notifications/logs?limit=20");
    if (res.ok) setLogs(await res.json());
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, [fetchTemplates, fetchLogs]);

  function openCreate() {
    setEditing(null);
    setForm({ code: "", name: "", channel: "WA", subject: "", body: "", variables: "", isActive: true });
    setOpen(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({
      code: t.code,
      name: t.name,
      channel: t.channel,
      subject: t.subject ?? "",
      body: t.body,
      variables: t.variables.join(", "),
      isActive: t.isActive,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      ...(editing && { id: editing.id }),
      code: form.code,
      name: form.name,
      channel: form.channel,
      subject: form.subject || null,
      body: form.body,
      variables: form.variables.split(",").map((v: string) => v.trim()).filter(Boolean),
      isActive: form.isActive,
    };

    const method = editing ? "PATCH" : "POST";
    const res = await fetch("/api/admin/notifications/templates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpen(false);
      fetchTemplates();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus template ini?")) return;
    await fetch(`/api/admin/notifications/templates?id=${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Notifikasi</h1>
          <p className="text-sm text-gray-500">Kelola template WA & Email untuk notifikasi otomatis</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Template Baru
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            Belum ada template. Buat template pertama Anda.
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {t.channel === "WA" ? (
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <Mail className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{t.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {t.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  {t._count && t._count.logs > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {t._count.logs} log
                    </span>
                  )}
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {t.subject && <p className="text-sm font-medium mb-1 text-gray-700">Subject: {t.subject}</p>}
                <p className="text-sm text-gray-500 line-clamp-3">{t.body}</p>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.variables.map((v) => (
                      <span key={v} className="text-xs font-mono px-2 py-0.5 rounded border border-gray-200 text-gray-600">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {logs && logs.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-base">Log Pengiriman Terbaru</h3>
          <p className="text-sm text-gray-500 mt-1">{logs.total} total log terkirim</p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? "Edit Template" : "Template Baru"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Kode Template</label>
                    <input
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="PAYMENT_REMINDER"
                      disabled={!!editing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Channel</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    >
                      <option value="WA">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="IN_APP">In-App</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Template</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject (opsional, untuk Email)</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Isi Pesan</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={6}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Halo {{nama}}, tagihan Anda {{jumlah}} jatuh tempo {{jatuhTempo}}."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Variabel (pisahkan dengan koma)</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.variables}
                    onChange={(e) => setForm({ ...form, variables: e.target.value })}
                    placeholder="nama, jumlah, jatuhTempo"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm">Aktif</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">{editing ? "Simpan" : "Buat"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
