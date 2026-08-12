"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit, Loader2, Copy } from "lucide-react";

interface Affiliate {
  id: string; code: string; name: string; whatsapp: string;
  email: string | null; category: string; isActive: boolean;
  clickCount: number; referralCount: number; createdAt: string;
}

interface Program { id: string; name: string; }

const CATEGORIES = ["SISWA", "ALUMNI", "TUTOR", "ORANG_TUA", "PARTNER", "UMUM"];

export function AffiliateManager({ affiliates, programs }: { affiliates: Affiliate[]; programs: Program[] }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", whatsapp: "", email: "", category: "UMUM",
    bankName: "", bankAccount: "", bankHolder: "",
  });

  const filtered = affiliates.filter((a) => {
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.whatsapp.includes(q);
  });

  function resetForm() {
    setForm({ name: "", whatsapp: "", email: "", category: "UMUM", bankName: "", bankAccount: "", bankHolder: "" });
    setEditing(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(a: Affiliate) {
    setEditing(a);
    setForm({ name: a.name, whatsapp: a.whatsapp, email: a.email || "", category: a.category, bankName: "", bankAccount: "", bankHolder: "" });
    setShowForm(true);
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/admin/affiliate/${editing.id}` : "/api/admin/affiliate";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        window.location.reload();
      } else {
        setError(data.error || "Gagal menyimpan");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  }

  async function deactivate(id: string) {
    if (!confirm("Nonaktifkan afiliator ini?")) return;
    await fetch(`/api/admin/affiliate/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari afiliator..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Afiliator
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{editing ? "Edit Afiliator" : "Tambah Afiliator Baru"}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Nama Bank" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="No. Rekening" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.bankHolder} onChange={(e) => setForm({ ...form, bankHolder: e.target.value })} placeholder="Atas Nama" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={loading || !form.name || !form.whatsapp} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Kode</th>
                <th className="text-left px-4 py-2 font-medium">Nama</th>
                <th className="text-left px-4 py-2 font-medium">Kategori</th>
                <th className="text-left px-4 py-2 font-medium">WhatsApp</th>
                <th className="text-center px-4 py-2 font-medium">Klik</th>
                <th className="text-center px-4 py-2 font-medium">Referral</th>
                <th className="text-center px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{a.code}</code>
                      <button onClick={() => { navigator.clipboard.writeText(a.code); }} className="text-gray-400 hover:text-gray-600">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a.category}</span></td>
                  <td className="px-4 py-3 text-gray-600">{a.whatsapp}</td>
                  <td className="px-4 py-3 text-center">{a.clickCount}</td>
                  <td className="px-4 py-3 text-center">{a.referralCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(a)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deactivate(a.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">Belum ada afiliator.</p>}
      </div>
    </div>
  );
}
