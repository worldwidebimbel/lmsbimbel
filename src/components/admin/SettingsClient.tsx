"use client";

import { useState } from "react";
import { Save, Database, Mail, Info, AlertTriangle, CheckCircle, Loader2, Trash2, Download, Globe, QrCode, Upload } from "lucide-react";
import { toast } from "sonner";

type DemoType = "AKADEMIK" | "UTBK_SNBT" | "KEDINASAN" | "BAHASA";
const DEMO_OPTIONS: { value: DemoType; label: string; desc: string; icon: string }[] = [
  { value: "AKADEMIK", label: "Bimbel Akademik", desc: "SD/SMP/SMA — Matematika, IPA, Bahasa Indonesia (3 guru, 6 siswa, 3 kelas)", icon: "🏫" },
  { value: "UTBK_SNBT", label: "Bimbel Persiapan Ujian (UTBK/SNBT)", desc: "TPS & Literasi Penalaran — Tryout simulasi (2 guru, 5 siswa)", icon: "🎓" },
  { value: "KEDINASAN", label: "Bimbel Tes Masuk Kedinasan & CPNS", desc: "TWK, TIU, TKP — Simulasi SKD CPNS (2 guru, 4 siswa)", icon: "🏛️" },
  { value: "BAHASA", label: "Bimbel Kemampuan Bahasa", desc: "Inggris, Mandarin, Jepang — Kelas konversi bahasa (3 guru, 5 siswa)", icon: "🌐" },
];

interface Props {
  initialSettings: Record<string, string>;
  demoStatus: { exists: boolean; userCount: number; subjectCount: number };
  smtpConfigured: boolean;
  appVersion: string;
}

type Tab = "umum" | "pembayaran" | "demo" | "email" | "info";

export default function SettingsClient({ initialSettings, demoStatus, smtpConfigured, appVersion }: Props) {
  const [tab, setTab] = useState<Tab>("umum");
  const [settings, setSettings] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoType>("AKADEMIK");
  const [importingDemo, setImportingDemo] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [currentDemoStatus, setCurrentDemoStatus] = useState(demoStatus);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");

  const [uploadingQris, setUploadingQris] = useState(false);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "umum", label: "Umum", icon: <Globe className="h-4 w-4" /> },
    { id: "pembayaran", label: "Pembayaran", icon: <QrCode className="h-4 w-4" /> },
    { id: "demo", label: "Demo Data", icon: <Database className="h-4 w-4" /> },
    { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { id: "info", label: "Info Sistem", icon: <Info className="h-4 w-4" /> },
  ];

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQris(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "qris");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        setSettings((prev) => ({ ...prev, qris_image_url: d.url }));
        toast.success("Gambar QRIS berhasil diupload");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal upload QRIS");
      }
    } finally { setUploadingQris(false); }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success("Pengaturan berhasil disimpan");
      else toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleImportDemo() {
    if (!confirm(`Import data demo "${DEMO_OPTIONS.find((o) => o.value === selectedDemo)?.label}"?\n\nData demo akan ditambahkan ke database. Pengguna demo menggunakan password: demo123`)) return;
    setImportingDemo(true);
    try {
      const res = await fetch("/api/admin/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedDemo }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Demo berhasil diimport! ${data.users} user, ${data.classes} kelas`);
        const statusRes = await fetch("/api/admin/demo");
        if (statusRes.ok) setCurrentDemoStatus(await statusRes.json());
      } else {
        toast.error(data.error ?? "Gagal import demo");
      }
    } finally {
      setImportingDemo(false);
    }
  }

  async function handleClearDemo() {
    if (!confirm("⚠️ HAPUS semua data demo?\n\nSemua user, kelas, materi, ujian, dan data lain yang dibuat dari import demo akan dihapus permanen.\n\nLanjutkan?")) return;
    setClearingDemo(true);
    try {
      const res = await fetch("/api/admin/demo", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Data demo dihapus: ${data.deleted?.users ?? 0} user, ${data.deleted?.classes ?? 0} kelas`);
        setCurrentDemoStatus({ exists: false, userCount: 0, subjectCount: 0 });
      } else {
        toast.error(data.error ?? "Gagal hapus demo");
      }
    } finally {
      setClearingDemo(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmailTo) return toast.error("Masukkan alamat email tujuan");
    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      });
      if (res.ok) toast.success("Email test berhasil dikirim!");
      else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal kirim email test");
      }
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Tab nav */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── UMUM ── */}
        {tab === "umum" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="mb-4 font-semibold text-gray-800">Identitas Aplikasi</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Nama Aplikasi</label>
                  <input value={settings.app_name} onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Tagline</label>
                  <input value={settings.app_tagline} onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-800">Kontak & Informasi</h3>
              <div className="space-y-4">
                {[
                  { key: "contact_email", label: "Email Kontak", placeholder: "admin@bimbel.com", type: "email" },
                  { key: "contact_phone", label: "Nomor Telepon", placeholder: "021-1234567", type: "text" },
                  { key: "whatsapp_admin", label: "WhatsApp Admin", placeholder: "628123456789", type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-sm font-medium text-gray-600">{f.label}</label>
                    <input type={f.type} value={settings[f.key]} placeholder={f.placeholder}
                      onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Alamat</label>
                  <textarea value={settings.address} rows={2} placeholder="Jl. Pendidikan No. 1..."
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            <button onClick={saveSettings} disabled={savingSettings}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan
            </button>
          </div>
        )}

        {/* ── PEMBAYARAN ── */}
        {tab === "pembayaran" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="mb-1 font-semibold text-gray-800">Pengaturan QRIS</h3>
              <p className="mb-4 text-sm text-gray-500">Upload gambar QRIS yang akan ditampilkan kepada siswa saat melakukan pembayaran tagihan.</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">Gambar QRIS</label>
                  {settings.qris_image_url ? (
                    <div className="mb-3 flex items-start gap-4">
                      <div className="rounded-xl border-2 border-gray-200 p-2 bg-white">
                        <img src={settings.qris_image_url} alt="QRIS" className="h-40 w-40 object-contain" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> QRIS aktif
                        </p>
                        <p className="text-xs text-gray-400 break-all max-w-[200px]">{settings.qris_image_url}</p>
                        <button onClick={() => setSettings((s) => ({ ...s, qris_image_url: "" }))}
                          className="text-xs text-red-500 hover:underline">Hapus</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                      Belum ada gambar QRIS
                    </div>
                  )}
                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 w-fit ${uploadingQris ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingQris ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingQris ? "Mengupload..." : "Upload Gambar QRIS"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleQrisUpload} disabled={uploadingQris} />
                  </label>
                  <p className="mt-1 text-xs text-gray-400">Format JPG/PNG, maks 5MB. Gunakan Cloudinary untuk upload.</p>
                </div>

                {[
                  { key: "qris_bank_name",      label: "Nama Bank / E-Wallet", placeholder: "BCA, GoPay, OVO, Dana..." },
                  { key: "qris_account_name",   label: "Nama Pemilik Rekening", placeholder: "Bimbel EduBimbel" },
                  { key: "qris_account_number", label: "Nomor Rekening / ID (opsional)", placeholder: "1234567890" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-sm font-medium text-gray-600">{f.label}</label>
                    <input value={settings[f.key] ?? ""} placeholder={f.placeholder}
                      onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveSettings} disabled={savingSettings}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan QRIS
            </button>
          </div>
        )}

        {/* ── DEMO ── */}
        {tab === "demo" && (
          <div className="space-y-6 max-w-2xl">
            {/* Status */}
            <div className={`flex items-start gap-3 rounded-xl p-4 ${currentDemoStatus.exists ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
              {currentDemoStatus.exists
                ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                : <Database className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />}
              <div>
                <p className={`font-medium ${currentDemoStatus.exists ? "text-amber-800" : "text-gray-600"}`}>
                  {currentDemoStatus.exists ? "Data Demo Aktif" : "Belum Ada Data Demo"}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {currentDemoStatus.exists
                    ? `${currentDemoStatus.userCount} user demo, ${currentDemoStatus.subjectCount} mata pelajaran demo tersimpan di database.`
                    : "Database belum memiliki data demo. Pilih tipe di bawah untuk mengimport."}
                </p>
              </div>
            </div>

            {/* Import section */}
            <div className="rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">Import Data Demo</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DEMO_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSelectedDemo(opt.value)}
                    className={`rounded-xl border-2 p-3.5 text-left transition-all ${selectedDemo === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-semibold text-sm text-gray-900">{opt.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                <strong>Info:</strong> Semua user demo menggunakan password <code className="bg-blue-100 px-1 rounded">demo123</code>. Data demo dapat ditambahkan berulang kali (berbeda slug). Gunakan tombol hapus untuk membersihkan.
              </div>

              <button onClick={handleImportDemo} disabled={importingDemo}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                {importingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import Demo: {DEMO_OPTIONS.find((o) => o.value === selectedDemo)?.label}
              </button>
            </div>

            {/* Clear section */}
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Bersihkan Data Demo</h3>
              </div>
              <p className="text-sm text-gray-600">
                Menghapus <strong>semua</strong> data yang dibuat melalui import demo: user, kelas, materi, soal, ujian, absensi, tagihan, dan lainnya. Data real tidak terpengaruh.
              </p>
              <button onClick={handleClearDemo} disabled={clearingDemo || !currentDemoStatus.exists}
                className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">
                {clearingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus Semua Data Demo
              </button>
            </div>
          </div>
        )}

        {/* ── EMAIL ── */}
        {tab === "email" && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">Status Konfigurasi SMTP</h3>
              <div className={`flex items-center gap-3 rounded-xl border p-4 ${smtpConfigured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                {smtpConfigured
                  ? <CheckCircle className="h-5 w-5 text-green-600" />
                  : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                <div>
                  <p className={`font-medium ${smtpConfigured ? "text-green-800" : "text-amber-800"}`}>
                    {smtpConfigured ? "SMTP Terkonfigurasi" : "SMTP Belum Dikonfigurasi"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {smtpConfigured ? "Email siap digunakan untuk notifikasi." : "Set SMTP_USER dan SMTP_PASS di .env.local"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Variabel Lingkungan SMTP</h4>
              <table className="w-full text-xs">
                <tbody>
                  {[["SMTP_HOST", process.env.SMTP_HOST ?? "(tidak diset)"],
                    ["SMTP_PORT", process.env.SMTP_PORT ?? "587"],
                    ["SMTP_USER", process.env.SMTP_USER ? "✓ diset" : "(tidak diset)"],
                    ["SMTP_PASS", process.env.SMTP_PASS ? "✓ diset" : "(tidak diset)"],
                    ["APP_NAME", process.env.APP_NAME ?? "EduBimbel LMS"],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-gray-500">{k}</td>
                      <td className={`py-1.5 font-mono ${v.startsWith("✓") ? "text-green-700" : v === "(tidak diset)" ? "text-red-500" : "text-gray-800"}`}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Kirim Email Test</h4>
              <div className="flex gap-2">
                <input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="email@contoh.com" disabled={!smtpConfigured}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={handleTestEmail} disabled={!smtpConfigured || testingEmail || !testEmailTo}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
                  {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Kirim
                </button>
              </div>
              {!smtpConfigured && <p className="text-xs text-amber-600">Konfigurasi SMTP terlebih dahulu di .env.local</p>}
            </div>
          </div>
        )}

        {/* ── INFO SISTEM ── */}
        {tab === "info" && (
          <div className="space-y-5 max-w-xl">
            <h3 className="font-semibold text-gray-800">Informasi Sistem</h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {[
                ["Aplikasi", settings.app_name || "EduBimbel LMS"],
                ["Versi", appVersion],
                ["Framework", "Next.js 15 (App Router)"],
                ["ORM", "Prisma v5"],
                ["Auth", "NextAuth v5 (beta)"],
                ["Database", process.env.DATABASE_URL?.split(":")[0]?.replace("postgresql", "PostgreSQL") ?? "PostgreSQL"],
                ["Node.js", process.version],
                ["Environment", process.env.NODE_ENV ?? "development"],
              ].map(([k, v], i) => (
                <div key={k} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-800 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Modul Aktif</div>
              {[
                ["Manajemen Pengguna", "✅"], ["Kelas & Jadwal", "✅"], ["Materi Pembelajaran", "✅"],
                ["Tugas", "✅"], ["Ujian Online", "✅"], ["Absensi QR", "✅"],
                ["Nilai & Rapor", "✅"], ["Analitik", "✅"], ["Keuangan", "✅"],
                ["Notifikasi & Email", "✅"], ["Forum Diskusi", "✅"], ["Gamifikasi", "✅"],
                ["Portal Orang Tua", "✅"], ["PWA / Offline", "✅"], ["Landing Page", "✅"],
              ].map(([m, s], i) => (
                <div key={m} className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <span className="text-gray-700">{m}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
