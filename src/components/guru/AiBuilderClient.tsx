"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Sparkles, FileText, Image as ImageIcon, Palette, Volume2, Video, Database,
  History, Settings2, CheckCircle2, Loader2, Save, ExternalLink, Wand2, RotateCcw,
  Copy, Check, Link2, Layers,
} from "lucide-react";
import {
  AI_CAPABILITIES, AI_IMAGE_PROVIDERS, AI_PROVIDERS, AI_TTS_PROVIDERS, AI_VIDEO_MODES, AI_VIDEO_PROVIDERS,
  MAX_VIDEO_SCENES,
  type AICapability,
} from "@/lib/ai-providers";
import { DESIGN_PRESETS, type DesignPresetId } from "@/lib/ai-design-presets";
import { TTS_VOICES } from "@/lib/ai-tts-providers";
import AIQuestionGenerator from "@/components/guru/AIQuestionGenerator";
import type { AISettings, ProviderStatusMap } from "@/lib/ai-settings";

// ============================================================
// AI Builder (Fase 0 — Fondasi, lihat doc/future-commit.md)
// Semua kapabilitas (teks/gambar/desain/audio/video/soal) + wizard
// Paket Bab AI (Fase 5). Tab Pengaturan (Super Admin) menyimpan
// konfigurasi runtime di AppSetting.
// ============================================================

const ALL_ROLES = ["GURU", "ADMIN_CABANG", "ADMIN_AKADEMIK", "ADMIN", "SUPER_ADMIN"];

const PHASE_INFO: Record<string, { fase: string; features: string[] }> = {
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

type Tab = "teks" | "gambar" | "desain" | "audio" | "video" | "paket" | "soal" | "riwayat" | "pengaturan";

const TAB_ICONS: Record<Tab, React.ElementType> = {
  teks: FileText, gambar: ImageIcon, desain: Palette, audio: Volume2,
  video: Video, paket: Layers, soal: Database, riwayat: History, pengaturan: Settings2,
};

export default function AiBuilderClient({
  settings,
  providerStatus,
  moduleActive,
  jobs,
  usage,
  role,
  quotaForRole,
  classes,
  subjects,
}: {
  settings: AISettings;
  providerStatus: ProviderStatusMap;
  moduleActive: boolean;
  jobs: JobRow[];
  usage: UsageRow[];
  role: string;
  quotaForRole: Partial<Record<AICapability, number>>;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
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
    { id: "paket", label: "Paket Bab" },
    { id: "soal", label: "Soal" },
    { id: "riwayat", label: "Riwayat" },
    ...(isSuperAdmin ? [{ id: "pengaturan" as Tab, label: "Pengaturan" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("teks");

  const [jobList, setJobList] = useState<JobRow[]>(jobs);
  const [usageList, setUsageList] = useState<UsageRow[]>(usage);
  async function refreshUsage() {
    try {
      const res = await fetch("/api/ai/jobs");
      if (res.ok) {
        const d = await res.json();
        setJobList(d.jobs ?? []);
        setUsageList(d.usage ?? []);
      }
    } catch {
      // abaikan — data lama tetap dipakai
    }
  }

  const usedTotal = usageList.reduce((s, u) => s + (u.cost ?? 0), 0);

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
      {tab === "teks" && (
        <TextGeneratorTab
          subjects={subjects}
          classes={classes}
          defaultProvider={settings.textProvider}
          onDone={refreshUsage}
        />
      )}
      {tab === "gambar" && (
        <ImageGeneratorTab
          subjects={subjects}
          classes={classes}
          defaultProvider={settings.imageProvider}
          providerStatus={providerStatus}
          onDone={refreshUsage}
        />
      )}
      {tab === "desain" && (
        <DesignGeneratorTab
          defaultProvider={settings.designProvider}
          providerStatus={providerStatus}
          onDone={refreshUsage}
        />
      )}
      {tab === "audio" && (
        <AudioGeneratorTab
          subjects={subjects}
          classes={classes}
          defaultProvider={settings.ttsProvider}
          providerStatus={providerStatus}
          onDone={refreshUsage}
        />
      )}
      {tab === "video" && (
        <VideoGeneratorTab
          subjects={subjects}
          defaultMode={settings.videoMode}
          defaultTextProvider={settings.textProvider}
          defaultImageProvider={settings.imageProvider}
          defaultTtsProvider={settings.ttsProvider}
          providerStatus={providerStatus}
          onDone={refreshUsage}
        />
      )}
      {tab === "paket" && (
        <BabPackageTab
          subjects={subjects}
          classes={classes}
          onDone={refreshUsage}
        />
      )}
      {tab === "soal" && <QuestionTab subjects={subjects} onDone={refreshUsage} />}
      {tab === "riwayat" && <HistoryTab jobs={jobList} usage={usageList} quotaForRole={quotaForRole} />}
      {tab === "pengaturan" && isSuperAdmin && <SettingsTab initial={settings} />}
    </div>
  );
}

/* ============ Tab Teks — AI Writer (Fase 1) ============ */

const JENJANG_OPTIONS = ["Umum", "SD", "SMP", "SMA", "SMK", "Madrasah"];

interface MaterialDraftState {
  title: string;
  description: string | null;
  content: string;
  tips: string | null;
  estDurationMenit: number | null;
}

function TextGeneratorTab({
  subjects,
  classes,
  defaultProvider,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  defaultProvider: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    topic: "",
    subjectName: "",
    jenjang: "Umum",
    kurikulum: "Kurikulum Merdeka",
    length: "sedang",
    style: "",
    detailInstruction: "",
    sourceMaterial: "",
  });
  const [aiProvider, setAiProvider] = useState(defaultProvider);
  const [aiModel, setAiModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<MaterialDraftState | null>(null);
  const [keyPointsText, setKeyPointsText] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveForm, setSaveForm] = useState({ classId: "", subjectId: "", chapterTitle: "" });

  const provider = AI_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_PROVIDERS[0];

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function generate() {
    if (!form.topic.trim()) {
      setError("Topik wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setDraft(null);
    setSavedId(null);
    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aiProvider, aiModel: aiModel || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal generate materi.");
        return;
      }
      setDraft({
        title: d.draft.title,
        description: d.draft.description,
        content: d.draft.content,
        tips: d.draft.tips,
        estDurationMenit: d.draft.estDurationMenit,
      });
      setKeyPointsText((d.draft.keyPoints ?? []).join("\n"));
      setJobId(d.jobId);
      onDone();
    } catch {
      setError("Gagal generate materi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      setError("Judul dan konten wajib diisi sebelum menyimpan.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveDraft: {
            ...draft,
            keyPoints: keyPointsText.split("\n").map((s) => s.trim()).filter(Boolean),
            classId: saveForm.classId || null,
            subjectId: saveForm.subjectId || null,
            chapterTitle: saveForm.chapterTitle || null,
            chapterOrder: 0,
          },
          jobId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal menyimpan materi.");
        return;
      }
      setSavedId(d.material.id);
      toast.success("Draft materi tersimpan — tinjau lalu publikasikan di halaman Materi.");
      onDone();
    } catch {
      setError("Gagal menyimpan materi. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form generate */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Buat Materi Teks dengan AI</h2>
        <p className="mt-1 text-sm text-gray-500">
          AI menulis draft materi lengkap (HTML + poin kunci + tips) — Anda review, edit, lalu simpan sebagai draft Materi.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Topik * </label>
            <input
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="mis. Persamaan Kuadrat — fungsi dan grafiknya"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <input
              value={form.subjectName}
              onChange={(e) => set("subjectName", e.target.value)}
              placeholder="mis. Matematika"
              list="ai-text-subjects"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <datalist id="ai-text-subjects">
              {subjects.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jenjang</label>
            <select value={form.jenjang} onChange={(e) => set("jenjang", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {JENJANG_OPTIONS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kurikulum</label>
            <input value={form.kurikulum} onChange={(e) => set("kurikulum", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Panjang</label>
            <select value={form.length} onChange={(e) => set("length", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="pendek">Pendek (±300 kata)</option>
              <option value="sedang">Sedang (±600 kata)</option>
              <option value="panjang">Panjang (±1000 kata)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Gaya Bahasa (opsional)</label>
            <input
              value={form.style}
              onChange={(e) => set("style", e.target.value)}
              placeholder="mis. santai namun terstruktur, banyak contoh"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Instruksi Tambahan (opsional)</label>
            <textarea
              value={form.detailInstruction}
              onChange={(e) => set("detailInstruction", e.target.value)}
              rows={2}
              placeholder="mis. fokus pada penerapan di soal UTBK, sertakan 2 contoh soal bertingkat"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Materi Sumber / Acuan (opsional)</label>
            <textarea
              value={form.sourceMaterial}
              onChange={(e) => set("sourceMaterial", e.target.value)}
              rows={4}
              placeholder="Tempel teks materi/rangkuman — AI akan menjadikannya acuan utama"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Provider AI</label>
            <select value={aiProvider} onChange={(e) => { setAiProvider(e.target.value); setAiModel(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Default ({providerConfigLabel(provider)})</option>
              {provider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Sedang menulis..." : "Generate Materi"}
        </button>
      </div>

      {/* Preview & edit draft */}
      {draft && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Draft Materi — review & edit</h2>
            {draft.estDurationMenit != null && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                ± {draft.estDurationMenit} menit belajar
              </span>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Judul</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
              <input
                value={draft.description ?? ""}
                onChange={(e) => setDraft((p) => (p ? { ...p, description: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Konten (markdown-lite — dirender oleh halaman belajar siswa)
              </label>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft((p) => (p ? { ...p, content: e.target.value } : p))}
                rows={12}
                placeholder="# Judul Bagian&#10;Paragraf...&#10;## Sub Bagian&#10;1. poin pertama&#10;2. poin kedua"
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: <code># Judul</code>, <code>## Sub judul</code>, <code>**tebal**</code>, <code>1. daftar</code>, tabel <code>| Kolom |</code>
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Poin Kunci (satu per baris)</label>
              <textarea
                value={keyPointsText}
                onChange={(e) => setKeyPointsText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tips Belajar</label>
              <input
                value={draft.tips ?? ""}
                onChange={(e) => setDraft((p) => (p ? { ...p, tips: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {/* Penempatan */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Kelas (opsional)</label>
                <select value={saveForm.classId} onChange={(e) => setSaveForm((p) => ({ ...p, classId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">— Tanpa kelas —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mapel (opsional)</label>
                <select value={saveForm.subjectId} onChange={(e) => setSaveForm((p) => ({ ...p, subjectId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">— Tanpa mapel —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bab / chapterTitle (opsional)</label>
                <input
                  value={saveForm.chapterTitle}
                  onChange={(e) => setSaveForm((p) => ({ ...p, chapterTitle: e.target.value }))}
                  placeholder="mis. Bab 3 — Persamaan Kuadrat"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {savedId ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Draft tersimpan.
                <Link href="/guru/materi" className="font-semibold underline">
                  Buka halaman Materi <ExternalLink className="inline h-3 w-3" />
                </Link>
                <button
                  onClick={() => { setDraft(null); setJobId(null); setSavedId(null); setForm((p) => ({ ...p, topic: "" })); }}
                  className="ml-auto flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Buat materi baru
                </button>
              </div>
            ) : (
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan sebagai Draft Materi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function providerConfigLabel(provider: { models: { value: string; label: string }[] }): string {
  return provider.models[0]?.label ?? "model default";
}

/* ============ Tab Gambar — AI Image (Fase 2) ============ */

const IMAGE_STYLES = [
  { value: "custom", label: "Custom (prompt apa adanya)" },
  { value: "flatvector", label: "Flat Vector (ilustrasi minimalis)" },
  { value: "diagram", label: "Diagram Berlabel (teknis)" },
  { value: "kartun", label: "Kartun Edukatif (ramah siswa)" },
  { value: "whiteboard", label: "Whiteboard Sketch" },
  { value: "realistic", label: "Realistis" },
];

const IMAGE_ASPECTS = [
  { value: "1:1", label: "1:1 (Persegi)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "4:3", label: "4:3 (Klasik)" },
];

interface GeneratedImageRow {
  url: string;
  mediaId: string;
  publicId: string;
}

function ImageGeneratorTab({
  subjects,
  classes,
  defaultProvider,
  providerStatus,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  defaultProvider: string;
  providerStatus: ProviderStatusMap;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    prompt: "",
    style: "flatvector",
    aspectRatio: "1:1",
    count: 1,
  });
  const [aiProvider, setAiProvider] = useState(defaultProvider);
  const [aiModel, setAiModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<GeneratedImageRow[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  // Save form per image index
  const [saveIdx, setSaveIdx] = useState<number | null>(null);
  const [saveForm, setSaveForm] = useState({ title: "", classId: "", subjectId: "", chapterTitle: "" });
  const [saving, setSaving] = useState(false);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const provider = AI_IMAGE_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_IMAGE_PROVIDERS[0];
  const providerConfigured = providerStatus.image.find((p) => p.id === aiProvider)?.configured ?? false;

  function set(k: keyof typeof form, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function generate() {
    if (!form.prompt.trim()) {
      setError("Prompt wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setImages([]);
    setSavedIdx(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.prompt,
          style: form.style,
          aspectRatio: form.aspectRatio,
          count: form.count,
          provider: aiProvider,
          model: aiModel || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal generate gambar.");
        return;
      }
      setImages(d.images ?? []);
      setJobId(d.jobId);
      onDone();
    } catch {
      setError("Gagal generate gambar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl(idx: number, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // abaikan
    }
  }

  function openSave(idx: number) {
    setSaveIdx(idx);
    setSavedIdx(null);
    setSaveForm((p) => ({
      ...p,
      title: p.title || form.prompt.trim().slice(0, 60) || `Gambar AI ${idx + 1}`,
    }));
  }

  async function save(idx: number, img: GeneratedImageRow) {
    if (!saveForm.title.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveImage: {
            url: img.url,
            mediaId: img.mediaId,
            title: saveForm.title,
            classId: saveForm.classId || null,
            subjectId: saveForm.subjectId || null,
            chapterTitle: saveForm.chapterTitle || null,
          },
          jobId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal menyimpan gambar.");
        return;
      }
      setSavedIdx(idx);
      toast.success("Draft gambar tersimpan — tinjau lalu publikasikan di halaman Materi.");
      onDone();
    } catch {
      setError("Gagal menyimpan gambar. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form generate */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Buat Gambar Materi dengan AI</h2>
        <p className="mt-1 text-sm text-gray-500">
          AI menghasilkan ilustrasi/diagram dari prompt — tersimpan otomatis ke Media Manager (Cloudinary).
          Simpan sebagai draft Materi gambar, atau salin URL untuk dipakai di soal/materi lain.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Prompt * </label>
            <textarea
              value={form.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              rows={3}
              placeholder="mis. Diagram alur fotosintesis dengan label kloroplas, cahaya matahari, CO₂, dan O₂"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gaya</label>
            <select value={form.style} onChange={(e) => set("style", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {IMAGE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rasio</label>
            <select value={form.aspectRatio} onChange={(e) => set("aspectRatio", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {IMAGE_ASPECTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah Gambar</label>
            <input
              type="number"
              min={1}
              max={4}
              value={form.count}
              onChange={(e) => set("count", Math.min(4, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Provider Gambar</label>
            <select
              value={aiProvider}
              onChange={(e) => { setAiProvider(e.target.value); setAiModel(""); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {AI_IMAGE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Default ({provider.models[0]?.label ?? "model"})</option>
              {provider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!providerConfigured && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Provider <strong>{provider.label}</strong> belum dikonfigurasi — Super Admin perlu set API key
            di environment variables. Pilih provider lain atau hubungi admin.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Sedang membuat..." : "Generate Gambar"}
          </button>
          {images.length > 0 && (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Generate ulang
            </button>
          )}
        </div>
      </div>

      {/* Gallery hasil */}
      {images.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Hasil — {images.length} gambar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pilih gambar → "Simpan ke Materi" untuk menjadikannya draft Materi gambar (perlu review sebelum publish).
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, idx) => (
              <div key={img.mediaId} className="overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`AI ${idx + 1}`} className="h-48 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyUrl(idx, img.url)}
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {copiedIdx === idx ? <><Check className="h-3 w-3" /> URL</> : <><Copy className="h-3 w-3" /> Salin URL</>}
                    </button>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Link2 className="h-3 w-3" /> Buka
                    </a>
                    <button
                      onClick={() => openSave(idx)}
                      className="ml-auto flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Save className="h-3 w-3" /> Simpan ke Materi
                    </button>
                  </div>

                  {saveIdx === idx && savedIdx !== idx && (
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                      <input
                        value={saveForm.title}
                        onChange={(e) => setSaveForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Judul gambar materi"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <div className="grid grid-cols-1 gap-2">
                        <select value={saveForm.classId} onChange={(e) => setSaveForm((p) => ({ ...p, classId: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs">
                          <option value="">— Tanpa kelas —</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select value={saveForm.subjectId} onChange={(e) => setSaveForm((p) => ({ ...p, subjectId: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs">
                          <option value="">— Tanpa mapel —</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input
                          value={saveForm.chapterTitle}
                          onChange={(e) => setSaveForm((p) => ({ ...p, chapterTitle: e.target.value }))}
                          placeholder="Bab / chapterTitle (opsional)"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => save(idx, img)}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Simpan Draft
                        </button>
                        <button onClick={() => setSaveIdx(null)} className="text-xs text-gray-500 hover:underline">
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                  {savedIdx === idx && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan sebagai draft.
                      <Link href="/guru/materi" className="font-semibold underline">
                        Buka Materi <ExternalLink className="inline h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Tab Desain — Aset Visual CMS (Fase 2b) ============ */

function DesignGeneratorTab({
  defaultProvider,
  providerStatus,
  onDone,
}: {
  defaultProvider: string;
  providerStatus: ProviderStatusMap;
  onDone: () => void;
}) {
  const [presetId, setPresetId] = useState<DesignPresetId>("hero_banner");
  const [prompt, setPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState(defaultProvider);
  const [aiModel, setAiModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<GeneratedImageRow[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Install state
  const [installIdx, setInstallIdx] = useState<number | null>(null);
  const [installForm, setInstallForm] = useState({
    title: "",
    subtitle: "",
    linkUrl: "",
    linkLabel: "",
    programId: "",
    blogId: "",
    category: "AKTIVITAS",
    description: "",
  });
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([]);
  const [blogPosts, setBlogPosts] = useState<{ id: string; title: string }[]>([]);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState<{ idx: number; target: string } | null>(null);

  const preset = DESIGN_PRESETS.find((p) => p.id === presetId) ?? DESIGN_PRESETS[0];
  const provider = AI_IMAGE_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_IMAGE_PROVIDERS[0];
  const providerConfigured = providerStatus.image.find((p) => p.id === aiProvider)?.configured ?? false;

  async function generate() {
    if (!prompt.trim()) {
      setError("Prompt wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setImages([]);
    setInstalled(null);
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          presetId,
          provider: aiProvider,
          model: aiModel || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal generate aset visual.");
        return;
      }
      setImages(d.images ?? []);
      setJobId(d.jobId);
      onDone();
    } catch {
      setError("Gagal generate aset visual. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl(idx: number, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // abaikan
    }
  }

  async function openInstall(idx: number) {
    setInstallIdx(idx);
    setInstalled(null);
    setInstallForm((p) => ({ ...p, title: p.title || prompt.trim().slice(0, 50) || `Aset AI ${idx + 1}` }));
    // Fetch daftar program/blog bila preset butuh
    if (preset.installTarget === "SiteProgram" && programs.length === 0) {
      try {
        const res = await fetch("/api/admin/site/programs");
        if (res.ok) setPrograms(await res.json());
      } catch {
        // abaikan
      }
    }
    if (preset.installTarget === "BlogPost" && blogPosts.length === 0) {
      try {
        const res = await fetch("/api/admin/site/blog");
        if (res.ok) setBlogPosts(await res.json());
      } catch {
        // abaikan
      }
    }
  }

  async function install(idx: number, img: GeneratedImageRow) {
    setInstalling(true);
    setError("");
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          install: {
            url: img.url,
            mediaId: img.mediaId,
            presetId,
            title: installForm.title,
            subtitle: installForm.subtitle,
            linkUrl: installForm.linkUrl,
            linkLabel: installForm.linkLabel,
            programId: installForm.programId,
            blogId: installForm.blogId,
            category: installForm.category,
            description: installForm.description,
          },
          jobId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal memasang aset.");
        return;
      }
      setInstalled({ idx, target: d.installed });
      toast.success(`Aset terpasang ke ${d.installed}.`);
      onDone();
    } catch {
      setError("Gagal memasang aset. Coba lagi.");
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form generate */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Buat Aset Visual CMS dengan AI</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate banner, cover program, popup promo, cover blog, galeri — lalu langsung pasang ke tujuannya.
          Hasil tersimpan otomatis di Media Manager (Cloudinary folder <code>ai-cms</code>).
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Preset Use Case *</label>
            <select
              value={presetId}
              onChange={(e) => { setPresetId(e.target.value as DesignPresetId); setInstalled(null); setInstallIdx(null); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {DESIGN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label} — {p.size}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {preset.description} Rasio {preset.aspectRatio}, target: {preset.installTarget}.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Prompt * </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="mis. Banner promosi pendaftaran kelas SNBT dengan tema merah-biru, gambar siswa ceria"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Saran tema: sebutkan warna brand, suasana, dan elemen kunci.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Provider Gambar</label>
            <select
              value={aiProvider}
              onChange={(e) => { setAiProvider(e.target.value); setAiModel(""); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {AI_IMAGE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Default ({provider.models[0]?.label ?? "model"})</option>
              {provider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!providerConfigured && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Provider <strong>{provider.label}</strong> belum dikonfigurasi — Super Admin perlu set API key
            di environment variables.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Sedang membuat..." : "Generate Aset"}
          </button>
          {images.length > 0 && (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Generate ulang
            </button>
          )}
        </div>
      </div>

      {/* Gallery hasil */}
      {images.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Hasil — {images.length} aset</h2>
          <p className="mt-1 text-sm text-gray-500">
            Klik <strong>"Pasang ke {preset.installTarget}"</strong> untuk memasang langsung, atau salin URL untuk dipakai manual.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {images.map((img, idx) => (
              <div key={img.mediaId} className="overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`AI ${idx + 1}`} className="h-48 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyUrl(idx, img.url)}
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {copiedIdx === idx ? <><Check className="h-3 w-3" /> URL</> : <><Copy className="h-3 w-3" /> Salin URL</>}
                    </button>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <Link2 className="h-3 w-3" /> Buka
                    </a>
                    {preset.installTarget !== "MediaOnly" && (
                      <button
                        onClick={() => openInstall(idx)}
                        className="ml-auto flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Save className="h-3 w-3" /> Pasang ke {preset.installTarget}
                      </button>
                    )}
                  </div>

                  {installIdx === idx && installed?.idx !== idx && (
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                      {(preset.installTarget === "SiteBanner" || preset.installTarget === "SiteGallery") && (
                        <input
                          value={installForm.title}
                          onChange={(e) => setInstallForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Judul"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      )}
                      {preset.installTarget === "SiteBanner" && (
                        <>
                          <input
                            value={installForm.subtitle}
                            onChange={(e) => setInstallForm((p) => ({ ...p, subtitle: e.target.value }))}
                            placeholder="Subtitle (opsional)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            value={installForm.linkUrl}
                            onChange={(e) => setInstallForm((p) => ({ ...p, linkUrl: e.target.value }))}
                            placeholder="Link URL (opsional)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            value={installForm.linkLabel}
                            onChange={(e) => setInstallForm((p) => ({ ...p, linkLabel: e.target.value }))}
                            placeholder="Label tombol (opsional)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                        </>
                      )}
                      {preset.installTarget === "SiteProgram" && (
                        <select
                          value={installForm.programId}
                          onChange={(e) => setInstallForm((p) => ({ ...p, programId: e.target.value }))}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                        >
                          <option value="">— Pilih program —</option>
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      )}
                      {preset.installTarget === "BlogPost" && (
                        <select
                          value={installForm.blogId}
                          onChange={(e) => setInstallForm((p) => ({ ...p, blogId: e.target.value }))}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                        >
                          <option value="">— Pilih artikel —</option>
                          {blogPosts.map((b) => (
                            <option key={b.id} value={b.id}>{b.title}</option>
                          ))}
                        </select>
                      )}
                      {preset.installTarget === "SiteGallery" && (
                        <>
                          <input
                            value={installForm.category}
                            onChange={(e) => setInstallForm((p) => ({ ...p, category: e.target.value }))}
                            placeholder="Kategori (mis. AKTIVITAS)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            value={installForm.description}
                            onChange={(e) => setInstallForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Deskripsi (opsional)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                        </>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => install(idx, img)}
                          disabled={installing}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {installing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Pasang sekarang
                        </button>
                        <button onClick={() => setInstallIdx(null)} className="text-xs text-gray-500 hover:underline">
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                  {installed?.idx === idx && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Terpasang ke {installed.target}.
                      <Link href="/admin/site" className="font-semibold underline">
                        Buka CMS <ExternalLink className="inline h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Tab Audio — Materi Audio / TTS (Fase 3) ============ */

const TTS_SPEEDS = [
  { value: 0.75, label: "0.75× (lambat)" },
  { value: 1, label: "1× (normal)" },
  { value: 1.25, label: "1.25× (cepat)" },
  { value: 1.5, label: "1.5× (lebih cepat)" },
];

interface GeneratedAudioRow {
  url: string;
  mediaId: string;
  publicId: string;
  durationSec: number;
  mimeType: string;
}

function AudioGeneratorTab({
  subjects,
  classes,
  defaultProvider,
  providerStatus,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  defaultProvider: string;
  providerStatus: ProviderStatusMap;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [aiProvider, setAiProvider] = useState(defaultProvider);
  const [aiModel, setAiModel] = useState("");
  const [voice, setVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audio, setAudio] = useState<GeneratedAudioRow | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Save form
  const [saveForm, setSaveForm] = useState({ title: "", classId: "", subjectId: "", chapterTitle: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const provider = AI_TTS_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_TTS_PROVIDERS[0];
  const providerConfigured = providerStatus.tts.find((p) => p.id === aiProvider)?.configured ?? false;
  const voices = TTS_VOICES[aiProvider] ?? [];

  async function generate() {
    if (!text.trim()) {
      setError("Teks wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setAudio(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: voice || undefined,
          speed,
          provider: aiProvider,
          model: aiModel || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal generate audio.");
        return;
      }
      setAudio(d.audio);
      setJobId(d.jobId);
      setSaveForm((p) => ({ ...p, title: p.title || text.trim().slice(0, 50) || "Narasi AI" }));
      onDone();
    } catch {
      setError("Gagal generate audio. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!audio) return;
    try {
      await navigator.clipboard.writeText(audio.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // abaikan
    }
  }

  async function save() {
    if (!audio) return;
    if (!saveForm.title.trim()) {
      setError("Judul wajib diisi sebelum menyimpan.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ai/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveAudio: {
            url: audio.url,
            mediaId: audio.mediaId,
            title: saveForm.title,
            durationSec: audio.durationSec,
            classId: saveForm.classId || null,
            subjectId: saveForm.subjectId || null,
            chapterTitle: saveForm.chapterTitle || null,
          },
          jobId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal menyimpan audio.");
        return;
      }
      setSaved(true);
      toast.success("Draft audio tersimpan — tinjau lalu publikasikan di halaman Materi.");
      onDone();
    } catch {
      setError("Gagal menyimpan audio. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form generate */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Buat Narasi Materi dengan AI (Text-to-Speech)</h2>
        <p className="mt-1 text-sm text-gray-500">
          AI mengubah teks materi menjadi audio narasi — siswa bisa mendengarkan materinya. Tersimpan otomatis ke Media Manager.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teks Narasi * (maks 4000 karakter)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Tempel teks materi di sini — bisa dari hasil AI Writer, atau ketik manual. AI akan membacakannya menjadi audio."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {text.length} / 4000 karakter • estimasi ±{Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 2.5))} detik
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Provider TTS</label>
              <select
                value={aiProvider}
                onChange={(e) => { setAiProvider(e.target.value); setAiModel(""); setVoice(""); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {AI_TTS_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
              <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Default ({provider.models[0]?.label ?? "model"})</option>
                {provider.models.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Default</option>
                {voices.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Prioritas voice Bahasa Indonesia natural.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kecepatan Baca</label>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {TTS_SPEEDS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!providerConfigured && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Provider <strong>{provider.label}</strong> belum dikonfigurasi — Super Admin perlu set API key
            di environment variables.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Sedang membuat narasi..." : "Generate Audio"}
        </button>
      </div>

      {/* Preview player & save */}
      {audio && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Hasil Audio — review & simpan</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
              ± {audio.durationSec} detik
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <audio controls src={audio.url} className="w-full" />

            <div className="flex items-center gap-2">
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {copied ? <><Check className="h-3 w-3" /> URL tersalin</> : <><Copy className="h-3 w-3" /> Salin URL</>}
              </button>
              <a href={audio.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Link2 className="h-3 w-3" /> Buka
              </a>
            </div>

            {/* Penempatan */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Judul Materi Audio *</label>
                <input
                  value={saveForm.title}
                  onChange={(e) => setSaveForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="mis. Narasi Bab 3 — Persamaan Kuadrat"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Kelas (opsional)</label>
                <select value={saveForm.classId} onChange={(e) => setSaveForm((p) => ({ ...p, classId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">— Tanpa kelas —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mapel (opsional)</label>
                <select value={saveForm.subjectId} onChange={(e) => setSaveForm((p) => ({ ...p, subjectId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">— Tanpa mapel —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Bab / chapterTitle (opsional)</label>
                <input
                  value={saveForm.chapterTitle}
                  onChange={(e) => setSaveForm((p) => ({ ...p, chapterTitle: e.target.value }))}
                  placeholder="mis. Bab 3 — Persamaan Kuadrat"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {saved ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Draft audio tersimpan.
                <Link href="/guru/materi" className="font-semibold underline">
                  Buka halaman Materi <ExternalLink className="inline h-3 w-3" />
                </Link>
                <button
                  onClick={() => { setAudio(null); setJobId(null); setSaved(false); setText(""); setSaveForm({ title: "", classId: "", subjectId: "", chapterTitle: "" }); }}
                  className="ml-auto flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Buat audio baru
                </button>
              </div>
            ) : (
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan sebagai Draft Materi Audio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Tab Video — Video Audio-Visual (Fase 4) ============ */

const VIDEO_STAGES: { id: string; label: string }[] = [
  { id: "naskah", label: "Naskah" },
  { id: "gambar", label: "Gambar" },
  { id: "audio", label: "Narasi" },
  { id: "render", label: "Render" },
  { id: "upload", label: "Upload" },
];

interface VideoJobState {
  id: string;
  status: string;
  mode?: "composite" | "direct";
  progress?: { stage: string; current: number; total: number; message?: string; mode?: string };
  resultUrl?: string | null;
  resultMaterialId?: string | null;
  errorMessage?: string | null;
  title?: string;
  sceneCount?: number;
  totalDurationSec?: number;
}

function VideoGeneratorTab({
  subjects,
  defaultMode,
  defaultTextProvider,
  defaultImageProvider,
  defaultTtsProvider,
  providerStatus,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  defaultMode: "composite" | "direct";
  defaultTextProvider: string;
  defaultImageProvider: string;
  defaultTtsProvider: string;
  providerStatus: ProviderStatusMap;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"composite" | "direct">(defaultMode);
  const [form, setForm] = useState({
    topic: "",
    subjectName: "",
    jenjang: "Umum",
    sceneCount: 5,
  });
  // Direct mode (premium — OpenRouter video API)
  const [videoModel, setVideoModel] = useState("");
  const [durationSec, setDurationSec] = useState(8);
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [textProvider, setTextProvider] = useState(defaultTextProvider);
  const [textModel, setTextModel] = useState("");
  const [imageProvider, setImageProvider] = useState(defaultImageProvider);
  const [imageModel, setImageModel] = useState("");
  const [ttsProvider, setTtsProvider] = useState(defaultTtsProvider);
  const [ttsModel, setTtsModel] = useState("");
  const [voice, setVoice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<VideoJobState | null>(null);

  const textProv = AI_PROVIDERS.find((p) => p.id === textProvider) ?? AI_PROVIDERS[0];
  const imageProv = AI_IMAGE_PROVIDERS.find((p) => p.id === imageProvider) ?? AI_IMAGE_PROVIDERS[0];
  const ttsProv = AI_TTS_PROVIDERS.find((p) => p.id === ttsProvider) ?? AI_TTS_PROVIDERS[0];
  const videoProv = AI_VIDEO_PROVIDERS.find((p) => p.id === "openrouter") ?? AI_VIDEO_PROVIDERS[0];
  const textConfigured = providerStatus.text.find((p) => p.id === textProvider)?.configured ?? false;
  const imageConfigured = providerStatus.image.find((p) => p.id === imageProvider)?.configured ?? false;
  const ttsConfigured = providerStatus.tts.find((p) => p.id === ttsProvider)?.configured ?? false;
  // Direct video memakai OPENROUTER_API_KEY (sama seperti provider teks OpenRouter)
  const directConfigured = providerStatus.text.find((p) => p.id === "openrouter")?.configured ?? false;
  const voices = TTS_VOICES[ttsProvider] ?? [];

  const running = job?.status === "PENDING" || job?.status === "PROCESSING";
  const jobMode = (job?.mode ?? job?.progress?.mode ?? "composite") as "composite" | "direct";
  const stages = jobMode === "direct" ? VIDEO_STAGES.filter((s) => ["naskah", "render", "upload"].includes(s.id)) : VIDEO_STAGES;

  // Polling progress job
  useEffect(() => {
    if (!job?.id || !running) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/jobs/${job.id}`);
        if (!res.ok) return;
        const d = await res.json();
        const p = d.job?.params ?? {};
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: d.job.status,
                mode: p.mode,
                progress: p.progress,
                resultUrl: d.job.resultUrl,
                resultMaterialId: d.job.resultMaterialId,
                errorMessage: d.job.errorMessage,
                title: p.title,
                sceneCount: p.sceneCount,
                totalDurationSec: p.totalDurationSec,
              }
            : prev
        );
        if (d.job.status === "DONE") {
          onDone();
        }
      } catch {
        // abaikan — polling berikutnya
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [job?.id, running, onDone]);

  async function submit() {
    if (!form.topic.trim()) {
      setError("Topik wajib diisi.");
      return;
    }
    setSubmitting(true);
    setError("");
    setJob(null);
    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...form,
          // Direct (premium)
          ...(mode === "direct"
            ? {
                videoModel: videoModel || undefined,
                durationSec,
                resolution,
                aspectRatio,
              }
            : {}),
          // Composite
          ...(mode === "composite"
            ? {
                voice: voice || undefined,
                imageProvider,
                imageModel: imageModel || undefined,
                ttsProvider,
                ttsModel: ttsModel || undefined,
              }
            : {}),
          textProvider,
          textModel: textModel || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal memulai job video.");
        return;
      }
      setJob({ id: d.jobId, status: "PENDING", mode });
      onDone();
    } catch {
      setError("Gagal memulai job video. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function retry() {
    if (!job?.id) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryJobId: job.id }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal retry.");
        return;
      }
      setJob({ id: d.jobId, status: "PENDING" });
    } catch {
      setError("Gagal retry. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Buat Video Pembelajaran dengan AI</h2>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "composite"
            ? "Pipeline composite: AI menulis naskah per scene → generate ilustrasi → narasi TTS → dirakit menjadi video MP4 (subtitle otomatis, maks 5 menit, maks " + MAX_VIDEO_SCENES + " scene). Hemat & cocok untuk materi edukatif."
            : "Direct video-gen (premium): AI menyusun prompt sinematik → model video (Veo/Hailuo/Wan) via OpenRouter membuat klip pendek berkualitas tinggi. Biaya jauh lebih tinggi per video."}
          {" "}Berjalan di background — progress bisa dipantau di bawah.
        </p>

        {/* Mode toggle */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("composite")}
            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              mode === "composite"
                ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Composite (hemat)
          </button>
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              mode === "direct"
                ? "border-purple-500 bg-purple-50 text-purple-800"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Direct video-gen (premium)
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Topik *</label>
            <input
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="mis. Fotosintesis — proses dan faktor yang memengaruhi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <input
              value={form.subjectName}
              onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))}
              placeholder="mis. Biologi"
              list="ai-video-subjects"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <datalist id="ai-video-subjects">
              {subjects.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jenjang</label>
            <input
              value={form.jenjang}
              onChange={(e) => setForm((p) => ({ ...p, jenjang: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {mode === "composite" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah Scene (3–{MAX_VIDEO_SCENES})</label>
                <input
                  type="number"
                  min={3}
                  max={MAX_VIDEO_SCENES}
                  value={form.sceneCount}
                  onChange={(e) => setForm((p) => ({ ...p, sceneCount: Math.min(MAX_VIDEO_SCENES, Math.max(3, Number(e.target.value) || 5)) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Estimasi durasi: ±{form.sceneCount * 30} detik (2–4 kalimat per scene).</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Voice Narasi</label>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Default</option>
                  {voices.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">AI Gambar</label>
                <select value={imageProvider} onChange={(e) => { setImageProvider(e.target.value); setImageModel(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {AI_IMAGE_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Model Gambar</label>
                <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Default ({imageProv.models[0]?.label ?? "model"})</option>
                  {imageProv.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">AI Narasi (TTS)</label>
                <select value={ttsProvider} onChange={(e) => { setTtsProvider(e.target.value); setTtsModel(""); setVoice(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {AI_TTS_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Model TTS</label>
                <select value={ttsModel} onChange={(e) => setTtsModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Default ({ttsProv.models[0]?.label ?? "model"})</option>
                  {ttsProv.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {mode === "direct" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Model Video</label>
                <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Default ({videoProv.models[0]?.label ?? "model"})</option>
                  {videoProv.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Via OpenRouter — butuh OPENROUTER_API_KEY.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Durasi (detik)</label>
                <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {[4, 6, 8, 10].map((d) => (
                    <option key={d} value={d}>{d}s</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Dukungan durasi bergantung model (mis. Veo 3.1: 4/6/8s).</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Resolusi</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rasio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Persegi)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">AI Naskah (Teks)</label>
            <select value={textProvider} onChange={(e) => { setTextProvider(e.target.value); setTextModel(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model Naskah</label>
            <select value={textModel} onChange={(e) => setTextModel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Default ({textProv.models[0]?.label ?? "model"})</option>
              {textProv.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {mode === "composite" && (!textConfigured || !imageConfigured || !ttsConfigured) && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Pipeline butuh 3 provider: {!textConfigured && `naskah (${textProv.label}) `}
            {!imageConfigured && `gambar (${imageProv.label}) `}
            {!ttsConfigured && `TTS (${ttsProv.label})`} — Super Admin perlu set API key di environment variables.
          </p>
        )}
        {mode === "direct" && !directConfigured && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Mode direct butuh OpenRouter (OPENROUTER_API_KEY) — Super Admin perlu set di environment variables.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {!running && (
          <button
            onClick={submit}
            disabled={submitting}
            className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {submitting ? "Memulai job..." : "Generate Video"}
          </button>
        )}
      </div>

      {/* Progress job */}
      {job && running && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Video sedang dibuat
            </h2>
            <span className="text-xs text-gray-400">job {job.id.slice(0, 8)}…</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {stages.map((s, i) => {
              const stageIdx = stages.findIndex((x) => x.id === job.progress?.stage);
              const state = stageIdx === -1 ? "wait" : i < stageIdx ? "done" : i === stageIdx ? "active" : "wait";
              return (
                <div key={s.id} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-0.5 w-6 ${state === "wait" ? "bg-gray-200" : "bg-indigo-500"}`} />}
                  <span
                    className={`flex h-7 items-center rounded-full px-3 text-xs font-medium ${
                      state === "active"
                        ? "bg-indigo-600 text-white"
                        : state === "done"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {state === "done" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {job.progress?.message && (
            <p className="mt-3 text-sm text-gray-600">{job.progress.message}</p>
          )}
          {(job.progress?.total ?? 0) > 0 && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, ((job.progress?.current || 0) / (job.progress?.total || 1)) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Hasil */}
      {job?.status === "DONE" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Video selesai
              {job.title && <span className="font-normal text-gray-500">— {job.title}</span>}
            </h2>
            {job.totalDurationSec && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {job.sceneCount} scene • {job.totalDurationSec}s
              </span>
            )}
          </div>

          {job.resultUrl && (
            <video controls src={job.resultUrl} className="mt-4 w-full rounded-lg border border-gray-200" />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/guru/materi" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Buka halaman Materi <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={() => { setJob(null); setForm((p) => ({ ...p, topic: "" })); }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" /> Buat video baru
            </button>
          </div>
        </div>
      )}

      {/* Gagal + retry */}
      {job?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800">Video gagal dibuat</h2>
          {job.errorMessage && <p className="mt-1 text-sm text-red-700">{job.errorMessage}</p>}
          <button
            onClick={retry}
            disabled={submitting}
            className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Coba lagi (parameter sama)
          </button>
        </div>
      )}
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

/* ============ Tab Paket Bab AI — wizard satu pintu (Fase 5) ============ */

type PartKey = "artikel" | "gambar" | "audio" | "soal" | "video";
type PartState = { status: "pending" | "running" | "done" | "failed"; message?: string };

const PART_LABELS: Record<PartKey, string> = {
  artikel: "Artikel Materi",
  gambar: "Gambar Ilustrasi",
  audio: "Narasi Audio",
  soal: "Latihan Soal",
  video: "Video (background)",
};

/** Buang markdown-lite agar teks cocok untuk narasi TTS. */
function stripMarkdownForTts(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // header
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, "") // baris pemisah tabel
    .replace(/\|/g, " — ") // sel tabel
    .replace(/^\s*\d+\.\s+/gm, "") // nomor daftar
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface PackageDraft {
  title: string;
  content: string;
  keyPoints: string[];
}

function BabPackageTab({
  subjects,
  classes,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    topic: "",
    subjectId: "",
    jenjang: "Umum",
    chapterTitle: "",
    classId: "",
  });
  const [parts, setParts] = useState({ artikel: true, gambar: true, audio: true, soal: true, video: false });
  const [questionCount, setQuestionCount] = useState(5);
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Partial<Record<PartKey, PartState>>>({});
  const [draft, setDraft] = useState<PackageDraft | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const subjectName = subjects.find((s) => s.id === form.subjectId)?.name ?? "";
  const chapter = form.chapterTitle.trim() || `Bab — ${form.topic.trim()}`;

  function setPart(key: PartKey, state: PartState) {
    setStatuses((p) => ({ ...p, [key]: state }));
  }

  async function callJson(url: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${res.status}`);
    return d as Record<string, unknown>;
  }

  // ---------- Part implementations (pakai API yang sudah ada) ----------

  async function doArtikel(): Promise<string> {
    const gen = await callJson("/api/ai/text", {
      topic: form.topic,
      subjectName,
      jenjang: form.jenjang,
      length: "sedang",
    });
    const d = gen.draft as { title: string; content: string; keyPoints?: string[] };
    setDraft({ title: d.title, content: d.content, keyPoints: d.keyPoints ?? [] });
    await callJson("/api/ai/text", {
      saveDraft: {
        title: d.title,
        description: null,
        content: d.content,
        keyPoints: d.keyPoints ?? [],
        tips: null,
        estDurationMenit: null,
        classId: form.classId || null,
        subjectId: form.subjectId || null,
        chapterTitle: chapter,
        chapterOrder: 0,
      },
      jobId: gen.jobId as string,
    });
    return `Draft "${d.title}" tersimpan`;
  }

  async function doGambar(): Promise<string> {
    const prompt = `Ilustrasi utama materi: ${form.topic}${subjectName ? ` (${subjectName})` : ""} — visual edukatif yang mewakili inti materi`;
    const gen = await callJson("/api/ai/image", { prompt, style: "flatvector", aspectRatio: "16:9", count: 1 });
    const img = (gen.images as { url: string; mediaId: string }[])[0];
    if (!img) throw new Error("Tidak ada gambar dihasilkan");
    await callJson("/api/ai/image", {
      saveImage: {
        url: img.url,
        mediaId: img.mediaId,
        title: `${chapter} — Ilustrasi`,
        classId: form.classId || null,
        subjectId: form.subjectId || null,
        chapterTitle: chapter,
      },
      jobId: gen.jobId as string,
    });
    return "Ilustrasi tersimpan sebagai draft";
  }

  async function doAudio(): Promise<string> {
    const sourceText = draft?.content ?? form.topic;
    const text = stripMarkdownForTts(sourceText).slice(0, 4000);
    const gen = await callJson("/api/ai/audio", { text });
    const audio = gen.audio as { url: string; mediaId: string; durationSec: number };
    await callJson("/api/ai/audio", {
      saveAudio: {
        url: audio.url,
        mediaId: audio.mediaId,
        title: `${chapter} — Narasi`,
        durationSec: audio.durationSec,
        classId: form.classId || null,
        subjectId: form.subjectId || null,
        chapterTitle: chapter,
      },
      jobId: gen.jobId as string,
    });
    return `Narasi ±${audio.durationSec}s tersimpan`;
  }

  async function doSoal(): Promise<string> {
    const gen = await callJson("/api/guru/bank-soal/ai-generate", {
      topic: form.topic,
      questionType: "PILGAN",
      difficulty: 2,
      count: questionCount,
      subjectId: form.subjectId || undefined,
      jenjang: form.jenjang,
      bahasa: "Bahasa Indonesia",
    });
    const questions = gen.questions as unknown[];
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("Tidak ada soal dihasilkan");
    const saved = await callJson("/api/guru/bank-soal/ai-generate", {
      questionsToSave: questions,
      subjectId: form.subjectId || null,
      topic: form.topic,
    });
    return `${saved.saved ?? questions.length} soal masuk Bank Soal`;
  }

  async function doVideo(): Promise<string> {
    const gen = await callJson("/api/ai/video", {
      mode: "composite",
      topic: form.topic,
      subjectName,
      jenjang: form.jenjang,
      sceneCount: 5,
    });
    setVideoJobId(gen.jobId as string);
    return "Job video dimulai — pantau progress di tab Video / Riwayat";
  }

  const partFns: Record<PartKey, () => Promise<string>> = {
    artikel: doArtikel,
    gambar: doGambar,
    audio: doAudio,
    soal: doSoal,
    video: doVideo,
  };

  async function runPart(key: PartKey): Promise<boolean> {
    setPart(key, { status: "running" });
    try {
      const message = await partFns[key]();
      setPart(key, { status: "done", message });
      return true;
    } catch (e) {
      setPart(key, { status: "failed", message: e instanceof Error ? e.message : "Gagal" });
      return false;
    }
  }

  async function generatePackage() {
    if (!form.topic.trim()) {
      toast.error("Topik wajib diisi.");
      return;
    }
    setRunning(true);
    setFinished(false);
    setStatuses({});
    setDraft(null);
    setVideoJobId(null);
    for (const key of ["artikel", "gambar", "audio", "soal", "video"] as PartKey[]) {
      if (parts[key]) await runPart(key);
    }
    setRunning(false);
    setFinished(true);
    onDone();
    toast.success("Paket Bab selesai — periksa status tiap bagian.");
  }

  const partKeys = ["artikel", "gambar", "audio", "soal", "video"] as PartKey[];

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Paket Bab AI — satu topik jadi Bab lengkap</h2>
        <p className="mt-1 text-sm text-gray-500">
          Satu form → artikel + gambar ilustrasi + narasi audio + latihan soal (video opsional) — semuanya masuk sebagai
          draft Materi dalam satu <strong>chapterTitle</strong> (Bab). Review & publikasikan lewat halaman Materi.
          Mengotomatisasi alur di <code>guide-pembuatan-bab.md</code>.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Topik *</label>
            <input
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="mis. Fotosintesis — proses dan faktor yang memengaruhi"
              disabled={running}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mapel</label>
            <select value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))} disabled={running} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">— Tanpa mapel —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jenjang</label>
            <input value={form.jenjang} onChange={(e) => setForm((p) => ({ ...p, jenjang: e.target.value }))} disabled={running} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bab / chapterTitle (opsional)</label>
            <input
              value={form.chapterTitle}
              onChange={(e) => setForm((p) => ({ ...p, chapterTitle: e.target.value }))}
              placeholder={`default: "Bab — ${form.topic.trim() || "topik"}"`}
              disabled={running}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kelas (opsional)</label>
            <select value={form.classId} onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))} disabled={running} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">— Tanpa kelas —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bagian paket */}
        <div className="mt-5 rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Bagian yang dibuat:</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {partKeys.map((key) => (
              <label key={key} className={`flex items-center gap-2 text-sm ${running ? "opacity-60" : ""}`}>
                <input
                  type="checkbox"
                  checked={parts[key]}
                  disabled={running}
                  onChange={(e) => setParts((p) => ({ ...p, [key]: e.target.checked }))}
                />
                {PART_LABELS[key]}
              </label>
            ))}
          </div>
          {parts.soal && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Jumlah soal:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value) || 5)))}
                disabled={running}
                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          )}
          {parts.video && (
            <p className="mt-2 text-xs text-gray-500">Video berjalan sebagai job background (composite) — progress di tab Video.</p>
          )}
        </div>

        <button
          onClick={generatePackage}
          disabled={running || !form.topic.trim()}
          className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {running ? "Sedang membuat paket..." : "Buat Paket Bab"}
        </button>
      </div>

      {/* Progress per bagian */}
      {(partKeys.some((k) => statuses[k]) || running) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Progress paket</h3>
          <div className="mt-4 space-y-2">
            {partKeys.filter((k) => parts[k]).map((key) => {
              const st = statuses[key];
              const state = st?.status ?? "pending";
              return (
                <div key={key} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                  state === "done" ? "border-green-200 bg-green-50"
                  : state === "failed" ? "border-red-200 bg-red-50"
                  : state === "running" ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-200"
                }`}>
                  <span className="w-36 shrink-0 text-sm font-medium text-gray-800">{PART_LABELS[key]}</span>
                  {state === "running" && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                  {state === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {state === "failed" && <span className="text-xs font-medium text-red-600">GAGAL</span>}
                  {state === "pending" && <span className="text-xs text-gray-400">menunggu…</span>}
                  {st?.message && <span className="min-w-0 flex-1 truncate text-xs text-gray-600">{st.message}</span>}
                  {state === "failed" && !running && (
                    <button
                      onClick={() => runPart(key)}
                      className="ml-auto flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <RotateCcw className="h-3 w-3" /> Retry
                    </button>
                  )}
                  {key === "video" && videoJobId && state === "done" && (
                    <span className="ml-auto text-xs text-gray-500">job {videoJobId.slice(0, 8)}…</span>
                  )}
                </div>
              );
            })}
          </div>

          {finished && !running && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Paket selesai — semua hasil tersimpan sebagai <strong>draft</strong>.
              <Link href="/guru/materi" className="font-semibold underline">
                Review di halaman Materi <ExternalLink className="inline h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ Tab Soal — AI Question Generator (Fase 5: disatukan ke AI Hub) ============ */

function QuestionTab({
  subjects,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  onDone: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">Soal (AI Question Generator)</h2>
      <p className="mt-1 text-sm text-gray-500">
        Generate soal dengan AI — pilih provider/model, tipe soal, difficulty, jumlah, jenjang & kurikulum.
        Hasil masuk ke Bank Soal untuk direview lalu dipakai di ujian.
      </p>
      <div className="mt-4">
        <AIQuestionGenerator subjects={subjects} onSaved={onDone} />
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Generator juga masih tersedia langsung di halaman <Link href="/guru/bank-soal" className="font-medium text-indigo-600 hover:underline">Bank Soal</Link> dengan integrasi pemilihan mapel & ujian.
      </p>
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
