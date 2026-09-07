"use client";

import { useState } from "react";
import { Plus, Save, Trash2, X, GraduationCap, HeartHandshake, Info } from "lucide-react";
import { StarRating } from "@/components/raport/StarRating";

type RubricType = "ACADEMIC" | "ATTITUDE";

interface RubricLevel {
  id: string;
  type: RubricType;
  stars: number;
  minScore: number;
  maxScore: number;
  category: string;
  description: string | null;
  colorHex: string | null;
  order: number;
  isActive: boolean;
}

interface AttitudeAspect {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  order: number;
  isActive: boolean;
}

const TABS: { key: RubricType | "ASPECTS"; label: string; icon: typeof GraduationCap }[] = [
  { key: "ACADEMIC", label: "Rubrik Nilai Akademik", icon: GraduationCap },
  { key: "ATTITUDE", label: "Rubrik Sikap Belajar", icon: HeartHandshake },
  { key: "ASPECTS", label: "Aspek Sikap", icon: Info },
];

export default function RubrikAdminClient({
  initialLevels,
  initialAspects,
}: {
  initialLevels: RubricLevel[];
  initialAspects: AttitudeAspect[];
}) {
  const [levels, setLevels] = useState(initialLevels);
  const [aspects, setAspects] = useState(initialAspects);
  const [tab, setTab] = useState<RubricType | "ASPECTS">("ACADEMIC");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "ASPECTS" ? (
        <AspectManager aspects={aspects} setAspects={setAspects} />
      ) : (
        <LevelManager type={tab} levels={levels} setLevels={setLevels} />
      )}
    </div>
  );
}

function LevelManager({
  type,
  levels,
  setLevels,
}: {
  type: RubricType;
  levels: RubricLevel[];
  setLevels: React.Dispatch<React.SetStateAction<RubricLevel[]>>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const rows = levels.filter((l) => l.type === type).sort((a, b) => b.stars - a.stars);

  function patchLocal(id: string, patch: Partial<RubricLevel>) {
    setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function save(level: RubricLevel) {
    setSavingId(level.id);
    setError("");
    const res = await fetch(`/api/admin/rubrik/${level.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stars: level.stars,
        minScore: level.minScore,
        maxScore: level.maxScore,
        category: level.category,
        description: level.description,
        colorHex: level.colorHex,
        isActive: level.isActive,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menyimpan level rubrik");
      return;
    }
    const updated = await res.json();
    patchLocal(level.id, updated);
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/admin/rubrik/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menghapus level");
      return;
    }
    setLevels((prev) => prev.filter((l) => l.id !== id));
  }

  async function add(payload: { stars: number; minScore: number; maxScore: number; category: string; description: string; colorHex: string }) {
    setError("");
    const res = await fetch("/api/admin/rubrik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menambah level");
      return;
    }
    const created = await res.json();
    setLevels((prev) => [...prev, created]);
    setShowAdd(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {type === "ACADEMIC"
            ? "Bintang akademik ditentukan otomatis dari nilai akhir siswa (hasil latihan & ujian) sesuai rentang di bawah."
            : "Kategori sikap dipilih tutor. Deskripsi di bawah otomatis mengisi kolom penjelasan sikap di rapor dan tetap bisa diubah per siswa."}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" /> Tambah Level
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          Belum ada level rubrik. Klik &quot;Tambah Level&quot; untuk membuat.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((level) => (
            <div key={level.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={level.stars} size="lg" />
                <span className="text-sm font-semibold text-gray-700">Bintang {level.stars}</span>
                <label className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={level.isActive}
                    onChange={(e) => patchLocal(level.id, { isActive: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  Aktif
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Bintang</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={level.stars}
                    onChange={(e) => patchLocal(level.id, { stars: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Nilai Minimum</label>
                  <input
                    type="number"
                    value={level.minScore}
                    onChange={(e) => patchLocal(level.id, { minScore: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Nilai Maksimum</label>
                  <input
                    type="number"
                    value={level.maxScore}
                    onChange={(e) => patchLocal(level.id, { maxScore: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
                  <input
                    value={level.category}
                    onChange={(e) => patchLocal(level.id, { category: e.target.value })}
                    placeholder="EXCELLENT"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Warna Kategori</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={level.colorHex ?? "#1e3a8a"}
                      onChange={(e) => patchLocal(level.id, { colorHex: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-gray-200"
                      aria-label="Pilih warna kategori"
                    />
                    <input
                      value={level.colorHex ?? ""}
                      onChange={(e) => patchLocal(level.id, { colorHex: e.target.value })}
                      placeholder="#1e3a8a"
                      className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Deskripsi (penjelasan yang tampil di rapor)
                </label>
                <textarea
                  value={level.description ?? ""}
                  onChange={(e) => patchLocal(level.id, { description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                  placeholder="Contoh: Menunjukkan sikap yang sangat baik, disiplin, aktif, fokus, dan konsisten selama proses pembelajaran."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => save(level)}
                  disabled={savingId === level.id}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {savingId === level.id ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => remove(level.id)}
                  className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddLevelModal onClose={() => setShowAdd(false)} onSubmit={add} />}
    </div>
  );
}

function AddLevelModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: { stars: number; minScore: number; maxScore: number; category: string; description: string; colorHex: string }) => void;
}) {
  const [stars, setStars] = useState(5);
  const [minScore, setMinScore] = useState(90);
  const [maxScore, setMaxScore] = useState(100);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState("#1e3a8a");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg space-y-4 rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Tambah Level Rubrik</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Tutup">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Bintang *</label>
            <input type="number" min={1} max={5} value={stars} onChange={(e) => setStars(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nilai Min *</label>
            <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nilai Maks *</label>
            <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Kategori *</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="EXCELLENT" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Warna</label>
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-16 cursor-pointer rounded border border-gray-200" aria-label="Pilih warna kategori" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Deskripsi</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
          <button
            onClick={() => onSubmit({ stars, minScore, maxScore, category, description, colorHex })}
            disabled={!category.trim()}
            className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}

function AspectManager({
  aspects,
  setAspects,
}: {
  aspects: AttitudeAspect[];
  setAspects: React.Dispatch<React.SetStateAction<AttitudeAspect[]>>;
}) {
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWeight, setNewWeight] = useState("1");

  function patchLocal(id: string, patch: Partial<AttitudeAspect>) {
    setAspects((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function save(aspect: AttitudeAspect) {
    setSavingId(aspect.id);
    setError("");
    const res = await fetch(`/api/admin/rubrik/aspek/${aspect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: aspect.name,
        description: aspect.description,
        weight: aspect.weight,
        isActive: aspect.isActive,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menyimpan aspek");
      return;
    }
    patchLocal(aspect.id, await res.json());
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/admin/rubrik/aspek/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menghapus aspek");
      return;
    }
    setAspects((prev) => prev.filter((a) => a.id !== id));
  }

  async function add() {
    setError("");
    const res = await fetch("/api/admin/rubrik/aspek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc, weight: newWeight }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Gagal menambah aspek");
      return;
    }
    const created = await res.json();
    setAspects((prev) => [...prev, created]);
    setNewName("");
    setNewDesc("");
    setNewWeight("1");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Tutor menilai tiap aspek dengan bintang 1-5. Rata-rata berbobot semua aspek menjadi kesimpulan sikap keseluruhan.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Tambah Aspek Sikap</h3>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama aspek (mis. Kedisiplinan)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Bobot"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          rows={2}
          placeholder="Penjelasan singkat aspek ini (opsional)"
          className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={add}
          disabled={!newName.trim()}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Tambah Aspek
        </button>
      </div>

      {aspects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          Belum ada aspek sikap.
        </div>
      ) : (
        <div className="space-y-2">
          {aspects.map((aspect) => (
            <div key={aspect.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[2fr_100px_auto]">
                <input
                  value={aspect.name}
                  onChange={(e) => patchLocal(aspect.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={aspect.weight}
                  onChange={(e) => patchLocal(aspect.id, { weight: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  aria-label="Bobot aspek"
                />
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={aspect.isActive}
                    onChange={(e) => patchLocal(aspect.id, { isActive: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  Aktif
                </label>
              </div>
              <textarea
                value={aspect.description ?? ""}
                onChange={(e) => patchLocal(aspect.id, { description: e.target.value })}
                rows={2}
                placeholder="Penjelasan aspek"
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => save(aspect)}
                  disabled={savingId === aspect.id}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {savingId === aspect.id ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => remove(aspect.id)}
                  className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
