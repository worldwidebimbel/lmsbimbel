"use client";

import { useState } from "react";
import {
  GraduationCap, Plus, Pencil, Trash2, X, Layers, BookOpen, Wallet,
} from "lucide-react";

type EducationLevel = {
  id: string;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
};

type Branch = { id: string; name: string; code: string };

type Level = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
};

type Program = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  targetAudience: string | null;
  materials: string | null;
  duration: string | null;
  price: number;
  promoPrice: number | null;
  promoUntil: string | null;
  isActive: boolean;
  order: number;
  branches: Branch[];
  educationLevels: EducationLevel[];
  levels: Level[];
  _count: { classes: number; invoices: number };
};

interface Props {
  initialPrograms: Program[];
  educationLevels: EducationLevel[];
  branches: Branch[];
}

export function ProgramsManager({ initialPrograms, educationLevels, branches }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [tab, setTab] = useState<"programs" | "levels">("programs");

  async function handleSave(data: Record<string, unknown>) {
    if (editing) {
      const res = await fetch(`/api/admin/programs/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = {
          ...updated,
          promoUntil: updated.promoUntil ? new Date(updated.promoUntil).toISOString() : null,
          branches: updated.branches ?? [],
          educationLevels: updated.educationLevels ?? [],
          levels: updated.levels ?? [],
          _count: updated._count ?? { classes: 0, invoices: 0 },
        };
        setPrograms((prev) => prev.map((p) => (p.id === editing.id ? normalized : p)));
        setShowForm(false);
        setEditing(null);
      }
    } else {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = {
          ...created,
          promoUntil: created.promoUntil ? new Date(created.promoUntil).toISOString() : null,
          branches: created.branches ?? [],
          educationLevels: created.educationLevels ?? [],
          levels: created.levels ?? [],
          _count: created._count ?? { classes: 0, invoices: 0 },
        };
        setPrograms((prev) => [...prev, normalized]);
        setShowForm(false);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Nonaktifkan program ini?")) return;
    const res = await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("programs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "programs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Program ({programs.length})
        </button>
        <button
          onClick={() => setTab("levels")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "levels" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Jenjang Pendidikan ({educationLevels.length})
        </button>
      </div>

      {tab === "programs" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Program
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <p className="text-xs text-gray-500">/{p.slug}</p>
                    </div>
                  </div>
                  {!p.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                  )}
                </div>

                {p.description && <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>}

                <div className="flex flex-wrap gap-1">
                  {(p.educationLevels ?? []).map((el) => (
                    <span key={el.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {el.name}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {(p.branches ?? []).map((b) => (
                    <span key={b.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {b.code}
                    </span>
                  ))}
                </div>

                {(p.levels ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(p.levels ?? []).map((l) => (
                      <span key={l.id} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                        <Layers className="w-3 h-3 inline mr-0.5" />{l.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Rp{p.price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Wallet className="h-3 w-3" /> Harga
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p._count.classes}</p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <BookOpen className="h-3 w-3" /> Kelas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p._count.invoices}</p>
                    <p className="text-xs text-gray-500">Tagihan</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setEditing(p); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {p.isActive && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <ProgramForm
              editing={editing}
              educationLevels={educationLevels}
              branches={branches}
              onSave={handleSave}
              onClose={() => { setShowForm(false); setEditing(null); }}
            />
          )}
        </>
      )}

      {tab === "levels" && <EducationLevelsManager initialLevels={educationLevels} />}
    </div>
  );
}

function ProgramForm({
  editing,
  educationLevels,
  branches,
  onSave,
  onClose,
}: {
  editing: Program | null;
  educationLevels: EducationLevel[];
  branches: Branch[];
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [targetAudience, setTargetAudience] = useState(editing?.targetAudience ?? "");
  const [duration, setDuration] = useState(editing?.duration ?? "");
  const [price, setPrice] = useState(editing?.price ?? 0);
  const [promoPrice, setPromoPrice] = useState(editing?.promoPrice ?? "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(editing?.branches.map((b) => b.id) ?? []);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(editing?.educationLevels.map((el) => el.id) ?? []);

  function toggleBranch(id: string) {
    setSelectedBranches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  }
  function toggleLevel(id: string) {
    setSelectedLevels((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Edit Program" : "Tambah Program"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Program *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bimbel Reguler"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="bimbel-reguler"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audiens</label>
              <input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SD/SMP/SMA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="6 bulan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Promo (opsional)</label>
              <input
                type="number"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cabang</label>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBranch(b.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedBranches.includes(b.id)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang Pendidikan</label>
            <div className="flex flex-wrap gap-2">
              {educationLevels.map((el) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => toggleLevel(el.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedLevels.includes(el.id)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {el.name}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Aktif</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onSave({
              name, slug, description: description || undefined,
              targetAudience: targetAudience || undefined,
              duration: duration || undefined, price,
              promoPrice: promoPrice === "" ? null : promoPrice,
              isActive, branchIds: selectedBranches, educationLevelIds: selectedLevels,
            })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function EducationLevelsManager({ initialLevels }: { initialLevels: EducationLevel[] }) {
  const [levels, setLevels] = useState(initialLevels);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function addLevel() {
    if (!name || !code) return;
    const res = await fetch("/api/admin/education-levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    if (res.ok) {
      const created = await res.json();
      setLevels((prev) => [...prev, created]);
      setName(""); setCode("");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/education-levels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l)));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Tambah Jenjang</h3>
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama (Sekolah Dasar)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Kode (SD)"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addLevel}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {levels.map((l) => (
          <div key={l.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{l.code}</span>
              <span className="font-medium text-gray-900">{l.name}</span>
            </div>
            <button
              onClick={() => toggleActive(l.id, l.isActive)}
              className={`text-xs px-2 py-1 rounded-full ${
                l.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {l.isActive ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
