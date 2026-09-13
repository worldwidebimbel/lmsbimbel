"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, FileText, Image as ImageIcon, Palette, Volume2, Video, Database,
  History, Settings2, CheckCircle2, Loader2, Save, ExternalLink,
} from "lucide-react";
import {
  AI_CAPABILITIES, AI_IMAGE_PROVIDERS, AI_PROVIDERS, AI_TTS_PROVIDERS, AI_VIDEO_MODES,
  type AICapability,
} from "@/lib/ai-providers";
import type { AISettings, ProviderStatusMap } from "@/lib/ai-settings";

// ============================================================
// AI Builder (Fase 0 — Fondasi, lihat doc/future-commit.md)
// Tab kapabilitas menampilkan status & rencana; generator menyusul
// per fase. Tab Pengaturan (Super Admin) menyimpan konfigurasi
// runtime di AppSetting.
// ============================================================

const ALL_ROLES = ["GURU", "ADMIN_CABANG", "ADMIN_AKADEMIK", "ADMIN", "SUPER_ADMIN"];

const PHASE_INFO: Record<string, { fase: string; features: string[] }> = {
  TEXT: {
    fase: "Fase 1",
    features: [
      "Artikel/ringkasan materi otomatis (rich text + key points + tips)",
      "Parameter: jenjang, kurikulum, mapel, topik, panjang, gaya bahasa",
      "Konteks dari materi sumber (sourceMaterial)",
      "Hasil masuk sebagai draft Material — attach ke Bab",
    ],
  },
  IMAGE: {
    fase: "Fase 2",
    features: [
      "Ilustrasi & diagram untuk materi pelajaran",
      "Preset gaya edukatif: flat vector, diagram berlabel, kartun, whiteboard",
      "Langsung tersimpan ke Media Manager (Cloudinary)",
      "Upgrade imageMode soal: generate gambar langsung dari prompt",
    ],
  },
  DESIGN: {
    fase: "Fase 2b",
    features: [
      "Banner hero & slider (SiteBanner)",
      "Cover program, gambar popup promo, cover blog",
      "Gambar section Landing Page & Custom Page",
      "Tombol \"Pasang ke...\" — langsung terpasang di tujuannya",
    ],
  },
  AUDIO: {
    fase: "Fase 3",
    features: [
      "Narasi materi (text-to-speech) dengan voice Indonesia",
      "Input dari teks materi (termasuk hasil AI Writer)",
      "Tersimpan sebagai Material audio + durasi",
    ],
  },
  VIDEO: {
    fase: "Fase 4",
    features: [
      "Video audio-visual: naskah AI → gambar per scene → TTS → FFmpeg",
      "Subtitle otomatis dari naskah, batas durasi 5 menit",
      "Job background dengan progress per tahap",
    ],
  },
};

interface JobRow {
  id: string;
  capability: string;
  status: string;
  provider: string | null;
  model: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
  costEstimate: number | null;
  durationMs: number | null;
  createdAt: string;
}

interface UsageRow {
  capability: AICapability;
  units: number;
  cost: number;
  count: number;
}

type Tab = "teks" | "gambar" | "desain" | "audio" | "video" | "soal" | "riwayat" | "pengaturan";

const TAB_ICONS: Record<Tab, React.ElementType> = {
  teks: FileText, gambar: ImageIcon, desain: Palette, audio: Volume2,
  video: Video, soal: Database, riwayat: History, pengaturan: Settings2,
};

export default function AiBuilderClient({
  settings,
  providerStatus,
  moduleActive,
  jobs,
  usage,
  role,
  quotaForRole,
}: {
  settings: AISettings;
  providerStatus: ProviderStatusMap;
  moduleActive: boolean;
  jobs: JobRow[];
  usage: UsageRow[];
  role: string;
  quotaForRole: Partial<Record<AICapability, number>>;
}) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const designRoles = settings.capabilityRoles.DESIGN ?? ["SUPER_ADMIN", "ADMIN"];
  const canDesign = designRoles.includes(role);

  const tabs: { id: Tab; label: string }[] = [
    { id: "teks", label: "Teks" },
    { id: "gambar", label: "Gambar" },
    ...(canDesign ? [{ id: "desain" as Tab, label: "Desain (CMS)" }] : []),
    { id: "audio", label: "Audio" },
    { id: "video", label: "Video" },
    { id: "soal", label: "Soal" },
    { id: "riwayat", label: "Riwayat" },
    ...(isSuperAdmin ? [{ id: "pengaturan" as Tab, label: "Pengaturan" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("teks");

  const usedTotal = usage.reduce((s, u) => s + (u.cost ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Sparkles className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">AI Builder</h1>
          <p className="text-sm text-gray-500">
            Satu pintu semua kapabilitas AI — soal, materi teks, gambar, desain, audio, video
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {moduleActive ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Modul aktif</span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Modul nonaktif — aktifkan FEAT_AI_BUILDER di Fitur & Modul
            </span>
          )}
        </div>
      </div>

      {/* Budget bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Estimasi pemakaian AI bulan ini (semua kapabilitas)
          </span>
          <span className="text-gray-500">
            Rp {usedTotal.toLocaleString("id-ID")}
            {settings.monthlyBudget > 0 && ` / Rp ${settings.monthlyBudget.toLocaleString("id-ID")}`}
          </span>
        </div>
        {settings.monthlyBudget > 0 && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${usedTotal >= settings.monthlyBudget ? "bg-red-500" : "bg-indigo-500"}`}
              style={{ width: `${Math.min(100, (usedTotal / settings.monthlyBudget) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => {
          const Icon = TAB_ICONS[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "teks" && <ComingSoonTab capability="TEXT" settings={settings} providerStatus={providerStatus} />}
      {tab === "gambar" && <ComingSoonTab capability="IMAGE" settings={settings} providerStatus={providerStatus} />}
      {tab === "desain" && <ComingSoonTab capability="DESIGN" settings={settings} providerStatus={providerStatus} />}
      {tab === "audio" && <ComingSoonTab capability="AUDIO" settings={settings} providerStatus={providerStatus} />}
      {tab === "video" && <ComingSoonTab capability="VIDEO" settings={settings} providerStatus={providerStatus} />}
      {tab === "soal" && <QuestionTab />}
      {tab === "riwayat" && <HistoryTab jobs={jobs} usage={usage} quotaForRole={quotaForRole} />}
      {tab === "pengaturan" && isSuperAdmin && <SettingsTab initial={settings} />}
    </div>
  );
}

/* ============ Tab kapabilitas (menyusul per fase) ============ */

function ComingSoonTab({
  capability,
  settings,
  providerStatus,
}: {
  capability: AICapability;
  settings: AISettings;
  providerStatus: ProviderStatusMap;
}) {
  const meta = AI_CAPABILITIES.find((c) => c.id === capability)!;
  const info = PHASE_INFO[capability];

  // Status provider aktif untuk kapabilitas ini
  let provider: { label: string; configured: boolean; keyEnvName?: string } | null = null;
  if (capability === "TEXT") {
    const p = providerStatus.text.find((x) => x.id === settings.textProvider);
    provider = p ? { label: p.label, configured: p.configured, keyEnvName: p.keyEnvName } : null;
  } else if (capability === "IMAGE") {
    const p = providerStatus.image.find((x) => x.id === settings.imageProvider);
    provider = p ? { label: p.label, configured: p.configured, keyEnvName: p.keyEnvName } : null;
  } else if (capability === "DESIGN") {
    const p = providerStatus.image.find((x) => x.id === settings.designProvider);
    provider = p ? { label: p.label, configured: p.configured, keyEnvName: p.keyEnvName } : null;
  } else if (capability === "AUDIO") {
    const p = providerStatus.tts.find((x) => x.id === settings.ttsProvider);
    provider = p ? { label: p.label, configured: p.configured, keyEnvName: p.keyEnvName } : null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {info.fase} — menyusul
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {info.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-medium text-gray-700">Provider aktif (diatur di tab Pengaturan):</p>
        {capability === "VIDEO" ? (
          <p className="mt-1 text-gray-600">
            Mode <span className="font-medium">{settings.videoMode === "direct" ? "Direct video-gen (premium)" : "Composite (naskah + gambar + TTS + FFmpeg)"}</span> —
            composite tidak butuh API key eksternal (FFmpeg di server); penyimpanan: {settings.videoStorage}.
          </p>
        ) : provider ? (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-600">
            {provider.label}
            {provider.configured ? (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">key terkonfigurasi</span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                key belum diisi ({provider.keyEnvName}) — Super Admin perlu set env var
              </span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-gray-500">—</p>
        )}
      </div>
    </div>
  );
}

/* ============ Tab Soal (link ke fitur existing) ============ */

function QuestionTab() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">Soal (AI Question Generator)</h2>
      <p className="mt-1 text-sm text-gray-500">
        Generator soal sudah tersedia di Bank Soal — pilih provider/model, tipe soal, difficulty, jumlah, jenjang & kurikulum.
        Pada Fase 5 UI-nya akan dipindah ke AI Builder (API tidak berubah).
      </p>
      <Link
        href="/guru/bank-soal"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Buka AI Question Generator <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ============ Tab Riwayat ============ */

function HistoryTab({
  jobs,
  usage,
  quotaForRole,
}: {
  jobs: JobRow[];
  usage: UsageRow[];
  quotaForRole: Partial<Record<AICapability, number>>;
}) {
  const statusBadge: Record<string, string> = {
    DONE: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PENDING: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Pemakaian bulan ini</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_CAPABILITIES.map((c) => {
            const u = usage.find((x) => x.capability === c.id);
            const quota = quotaForRole[c.id] ?? 0;
            const used = u?.units ?? 0;
            return (
              <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{c.label}</span>
                  <span className="text-xs text-gray-500">
                    {used} / {quota > 0 ? quota : "—"} {c.unitLabel}
                  </span>
                </div>
                {quota > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${used >= quota ? "bg-red-500" : "bg-indigo-500"}`}
                      style={{ width: `${Math.min(100, (used / quota) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Riwayat job generate</h2>
        </div>
        {jobs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            Belum ada job. Riwayat generate AI akan muncul di sini.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Kapabilitas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Provider / Model</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{j.capability}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[j.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {j.status}
                    </span>
                    {j.errorMessage && <p className="mt-1 max-w-xs truncate text-xs text-red-500">{j.errorMessage}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{[j.provider, j.model].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(j.createdAt).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {j.costEstimate != null ? `Rp ${j.costEstimate.toLocaleString("id-ID")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============ Tab Pengaturan (Super Admin) ============ */

function SettingsTab({ initial }: { initial: AISettings }) {
  const [textProvider, setTextProvider] = useState(initial.textProvider);
  const [imageProvider, setImageProvider] = useState(initial.imageProvider);
  const [designProvider, setDesignProvider] = useState(initial.designProvider);
  const [ttsProvider, setTtsProvider] = useState(initial.ttsProvider);
  const [videoMode, setVideoMode] = useState(initial.videoMode);
  const [videoStorage, setVideoStorage] = useState(initial.videoStorage);
  const [labelEnabled, setLabelEnabled] = useState(initial.labelEnabled);
  const [monthlyBudget, setMonthlyBudget] = useState(String(initial.monthlyBudget));
  const [unitCosts, setUnitCosts] = useState<Record<string, number>>({ ...initial.unitCosts });
  const [accessRoles, setAccessRoles] = useState<string[]>(initial.accessRoles);
  const [designRoles, setDesignRoles] = useState<string[]>(initial.capabilityRoles.DESIGN ?? ["SUPER_ADMIN", "ADMIN"]);
  const [quotas, setQuotas] = useState(initial.quotas);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/ai/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ai_text_provider: textProvider,
        ai_image_provider: imageProvider,
        ai_design_provider: designProvider,
        ai_tts_provider: ttsProvider,
        ai_video_mode: videoMode,
        ai_video_storage: videoStorage,
        ai_label_enabled: labelEnabled ? "true" : "false",
        ai_monthly_budget: monthlyBudget,
        ai_unit_costs: JSON.stringify(unitCosts),
        ai_access_roles: accessRoles.join(","),
        ai_capability_roles: JSON.stringify({ DESIGN: designRoles }),
        ai_quotas: JSON.stringify(quotas),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="space-y-4">
      {/* Provider */}
      <SettingsSection title="Provider per Kapabilitas" description="Pilihan hanya berpengaruh setelah fase terkait tersedia. Kunci API diisi lewat environment variables server.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProviderSelect label="Materi Teks" value={textProvider} onChange={setTextProvider} options={AI_PROVIDERS} />
          <ProviderSelect label="Materi Gambar" value={imageProvider} onChange={setImageProvider} options={AI_IMAGE_PROVIDERS} />
          <ProviderSelect label="Aset Visual CMS (Desain)" value={designProvider} onChange={setDesignProvider} options={AI_IMAGE_PROVIDERS} />
          <ProviderSelect label="Materi Audio (TTS)" value={ttsProvider} onChange={setTtsProvider} options={AI_TTS_PROVIDERS} />
        </div>
      </SettingsSection>

      {/* Video & storage */}
      <SettingsSection title="Video & Penyimpanan">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mode Video</label>
            <select value={videoMode} onChange={(e) => setVideoMode(e.target.value as AISettings["videoMode"])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {AI_VIDEO_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Penyimpanan Video</label>
            <select value={videoStorage} onChange={(e) => setVideoStorage(e.target.value as AISettings["videoStorage"])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="cloudinary">Cloudinary</option>
              <option value="local">VPS lokal (serve via Nginx)</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      {/* Budget & label */}
      <SettingsSection title="Budget & Transparansi">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Budget AI Bulanan (Rp)</label>
            <input
              type="number" min={0} value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">0 = tanpa batas budget. Estimasi biaya per unit di bawah.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={labelEnabled} onChange={(e) => setLabelEnabled(e.target.checked)} />
            <span className="font-medium text-gray-700">Tampilkan label "Dibuat dengan AI" di view siswa</span>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {AI_CAPABILITIES.map((c) => (
            <div key={c.id}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{c.label} (Rp/{c.unitLabel})</label>
              <input
                type="number" min={0}
                value={unitCosts[c.id] ?? 0}
                onChange={(e) => setUnitCosts((p) => ({ ...p, [c.id]: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Akses */}
      <SettingsSection title="Akses Role" description="Gate modul berlaku untuk semua kapabilitas; DESIGN punya daftar role sendiri.">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Role yang boleh mengakses AI Builder</p>
          <div className="flex flex-wrap gap-4">
            {ALL_ROLES.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={accessRoles.includes(r)} onChange={() => toggle(accessRoles, setAccessRoles, r)} />
                {r}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Role untuk kapabilitas DESIGN (Aset Visual CMS)</p>
          <div className="flex flex-wrap gap-4">
            {ALL_ROLES.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={designRoles.includes(r)} onChange={() => toggle(designRoles, setDesignRoles, r)} />
                {r}
              </label>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Kuota */}
      <SettingsSection title="Kuota Bulanan per Role" description="Jumlah unit per bulan (0 = tidak tersedia untuk role tersebut).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Role</th>
                {AI_CAPABILITIES.map((c) => (
                  <th key={c.id} className="px-3 py-2 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(quotas).map((r) => (
                <tr key={r} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{r}</td>
                  {AI_CAPABILITIES.map((c) => (
                    <td key={c.id} className="px-3 py-2">
                      <input
                        type="number" min={0}
                        value={quotas[r]?.[c.id] ?? 0}
                        onChange={(e) =>
                          setQuotas((p) => ({
                            ...p,
                            [r]: { ...p[r], [c.id]: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      {/* Save */}
      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Pengaturan
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Tersimpan
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">Perubahan langsung aktif — tanpa deploy ulang</span>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ProviderSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; models: { value: string; label: string }[] }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
