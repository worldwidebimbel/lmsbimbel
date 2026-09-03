"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";

interface Rule {
  id: string; type: string; programId: string | null; programName: string | null;
  nominal: number | null; percentage: number | null; stage: string | null;
  priority: number; isActive: boolean;
}

interface Program { id: string; name: string; }

const RULE_TYPES = ["NOMINAL", "PERCENTAGE", "PER_PROGRAM", "TIERED"];
const TYPE_LABELS: Record<string, string> = {
  NOMINAL: "Nominal Tetap", PERCENTAGE: "Persentase", PER_PROGRAM: "Per Program", TIERED: "Tiered",
};

export function CommissionRulesManager({ rules, programs }: { rules: Rule[]; programs: Program[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "NOMINAL", programId: "", nominal: "", percentage: "", stage: "", priority: "0", isActive: true,
  });

  function resetForm() {
    setForm({ type: "NOMINAL", programId: "", nominal: "", percentage: "", stage: "", priority: "0", isActive: true });
    setEditing(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(r: Rule) {
    setEditing(r);
    setForm({
      type: r.type,
      programId: r.programId || "",
      nominal: r.nominal?.toString() || "",
      percentage: r.percentage?.toString() || "",
      stage: r.stage || "",
      priority: r.priority.toString(),
      isActive: r.isActive,
    });
    setShowForm(true);
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        type: form.type,
        programId: form.programId || null,
        nominal: form.nominal ? parseFloat(form.nominal) : null,
        percentage: form.percentage ? parseFloat(form.percentage) : null,
        stage: form.stage || null,
        priority: parseInt(form.priority) || 0,
        isActive: form.isActive,
      };

      if (editing) {
        // No direct PATCH endpoint for rules; use POST for now (create new)
        // In production, add PATCH endpoint
        const res = await fetch("/api/admin/affiliate/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          resetForm();
          window.location.reload();
        } else {
          const data = await res.json();
          setError(data.error || "Gagal menyimpan");
        }
      } else {
        const res = await fetch("/api/admin/affiliate/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          resetForm();
          window.location.reload();
        } else {
          const data = await res.json();
          setError(data.error || "Gagal menyimpan");
        }
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Kelola aturan perhitungan komisi afiliator</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Tambah Aturan
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{editing ? "Edit Aturan" : "Tambah Aturan Komisi"}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {RULE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Semua Program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {(form.type === "NOMINAL" || form.type === "TIERED") && (
              <input value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} placeholder="Nominal (Rp)" type="number" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            )}
            {(form.type === "PERCENTAGE" || form.type === "PER_PROGRAM") && (
              <input value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} placeholder="Persentase (%)" type="number" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            )}
            <input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} placeholder="Stage (mis. REGISTRATION)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} placeholder="Prioritas" type="number" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Aktif
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
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
                <th className="text-left px-4 py-2 font-medium">Tipe</th>
                <th className="text-left px-4 py-2 font-medium">Program</th>
                <th className="text-left px-4 py-2 font-medium">Nominal/Persentase</th>
                <th className="text-left px-4 py-2 font-medium">Stage</th>
                <th className="text-center px-4 py-2 font-medium">Prioritas</th>
                <th className="text-center px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[r.type] || r.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{r.programName || "Semua"}</td>
                  <td className="px-4 py-3 font-medium">
                    {r.nominal ? `Rp ${r.nominal.toLocaleString("id-ID")}` : r.percentage ? `${r.percentage}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.stage || "-"}</td>
                  <td className="px-4 py-3 text-center">{r.priority}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(r)} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rules.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">Belum ada aturan komisi.</p>}
      </div>
    </div>
  );
}
