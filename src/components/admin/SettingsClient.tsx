"use client";

import { useState, useEffect } from "react";
import { Save, Database, Mail, Info, AlertTriangle, CheckCircle, Loader2, Trash2, Download, Globe, QrCode, Upload, ExternalLink, Key, RefreshCw } from "lucide-react";
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
  resendConfigured: boolean;
  oauth2Configured: boolean;
  oauth2Vars: { clientId: boolean; clientSecret: boolean; refreshToken: boolean; gmailFrom: boolean };
  oauth2DbConfig: { clientId: string; clientSecret: string; connectedEmail: string; hasRefreshToken: boolean };
  activeEmailMethod: "resend" | "oauth2" | "smtp" | "none";
  appVersion: string;
  branches: { id: string; name: string; code: string }[];
  isSuperAdmin: boolean;
  defaultBranchId: string | null;
}

type Tab = "umum" | "pembayaran" | "demo" | "email" | "info";

export default function SettingsClient({ initialSettings, demoStatus, smtpConfigured, resendConfigured, oauth2Configured, oauth2Vars, oauth2DbConfig, activeEmailMethod, appVersion, branches, isSuperAdmin, defaultBranchId }: Props) {
  const [tab, setTab] = useState<Tab>("umum");
  const [settings, setSettings] = useState(initialSettings);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(defaultBranchId);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoType>("AKADEMIK");
  const [importingDemo, setImportingDemo] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [currentDemoStatus, setCurrentDemoStatus] = useState(demoStatus);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [loadingAuthUrl, setLoadingAuthUrl] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [removingConnection, setRemovingConnection] = useState(false);
  const [oauthClientId, setOauthClientId] = useState(oauth2DbConfig.clientId ?? "");
  const [oauthClientSecret, setOauthClientSecret] = useState(oauth2DbConfig.clientSecret ?? "");
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<{
    method: string;
    callbackUri: string;
    checks: Record<string, { ok: boolean; detail: string }>;
    refreshTest: { ok: boolean; detail: string } | null;
    commonIssues: string[];
  } | null>(null);

  const [uploadingQris, setUploadingQris] = useState(false);

  const [duitkuConfig, setDuitkuConfig] = useState<{
    merchantCode: string;
    apiKey: string;
    sandbox: boolean;
    gatewayEnabled: boolean;
    manualPaymentInstructions: string;
  }>({ merchantCode: "", apiKey: "", sandbox: true, gatewayEnabled: false, manualPaymentInstructions: "" });
  const [loadingDuitku, setLoadingDuitku] = useState(false);
  const [savingDuitku, setSavingDuitku] = useState(false);
  const [showDuitkuKey, setShowDuitkuKey] = useState(false);

  useEffect(() => {
    if (tab === "pembayaran" && !duitkuConfig.merchantCode && !loadingDuitku) {
      loadDuitkuConfig();
    }
  }, [tab]);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "umum", label: "Umum", icon: <Globe className="h-4 w-4" /> },
    { id: "pembayaran", label: "Pembayaran", icon: <QrCode className="h-4 w-4" /> },
    { id: "demo", label: "Demo Data", icon: <Database className="h-4 w-4" /> },
    { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { id: "info", label: "Info Sistem", icon: <Info className="h-4 w-4" /> },
  ];

  async function loadBranchSettings(branchId: string | null) {
    setLoadingBranch(true);
    try {
      const res = await fetch(`/api/admin/settings?branchId=${branchId ?? ""}`);
      if (!res.ok) {
        toast.error("Gagal memuat pengaturan cabang");
        return;
      }
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data.settings }));
    } finally {
      setLoadingBranch(false);
    }
  }

  async function handleBranchChange(branchId: string | null) {
    setSelectedBranchId(branchId);
    await loadBranchSettings(branchId);
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
    setUploadingQris(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "qris");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "Gagal upload QRIS");
        return;
      }
      const newUrl = d.url as string;
      setSettings((prev) => ({ ...prev, qris_image_url: newUrl }));
      // Auto-save to DB immediately
      const saveRes = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qris_image_url: newUrl, branchId: selectedBranchId }),
      });
      if (saveRes.ok) {
        toast.success("Gambar QRIS berhasil diupload dan disimpan");
      } else {
        toast.warning("Upload berhasil, tapi gagal menyimpan ke database. Klik Simpan.");
      }
    } finally {
      setUploadingQris(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, branchId: selectedBranchId }),
      });
      if (res.ok) toast.success("Pengaturan berhasil disimpan");
      else toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadDuitkuConfig() {
    setLoadingDuitku(true);
    try {
      const res = await fetch("/api/admin/payment-gateway");
      if (res.ok) {
        const data = await res.json();
        setDuitkuConfig({
          merchantCode: data.merchantCode ?? "",
          apiKey: data.apiKey ?? "",
          sandbox: data.sandbox ?? true,
          gatewayEnabled: data.gatewayEnabled ?? false,
          manualPaymentInstructions: data.manualPaymentInstructions ?? "",
        });
      }
    } finally {
      setLoadingDuitku(false);
    }
  }

  async function saveDuitkuConfig() {
    setSavingDuitku(true);
    try {
      const res = await fetch("/api/admin/payment-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duitkuConfig),
      });
      if (res.ok) toast.success("Konfigurasi payment gateway disimpan");
      else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal menyimpan konfigurasi");
      }
    } finally {
      setSavingDuitku(false);
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

  async function handleGetAuthUrl() {
    setLoadingAuthUrl(true);
    try {
      const res = await fetch("/api/admin/email/auth-url");
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Gagal mendapatkan auth URL");
      window.open(data.url, "_blank", "width=600,height=700");
    } finally {
      setLoadingAuthUrl(false);
    }
  }

  async function handleSaveCreds() {
    if (!oauthClientId.trim() || !oauthClientSecret.trim()) {
      return toast.error("Client ID dan Client Secret wajib diisi");
    }
    setSavingCreds(true);
    try {
      const res = await fetch("/api/admin/email/oauth-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: oauthClientId.trim(), clientSecret: oauthClientSecret.trim() }),
      });
      if (res.ok) {
        toast.success("Kredensial OAuth2 berhasil disimpan");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal menyimpan kredensial");
      }
    } finally {
      setSavingCreds(false);
    }
  }

  async function handleRemoveConnection() {
    if (!confirm("Putuhkan koneksi Gmail OAuth2? Refresh token dan email terhubung akan dihapus dari database.")) return;
    setRemovingConnection(true);
    try {
      const res = await fetch("/api/admin/email/oauth-connection", { method: "DELETE" });
      if (res.ok) {
        toast.success("Koneksi Gmail OAuth2 berhasil diputus");
        setOauthClientId("");
        setOauthClientSecret("");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal memutus koneksi");
      }
    } finally {
      setRemovingConnection(false);
    }
  }

  async function handleDiagnose() {
    setDiagnosing(true);
    try {
      const res = await fetch("/api/admin/email/diagnose");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal melakukan diagnosa");
        return;
      }
      setDiagnosis(data);
      toast.success("Diagnosa email selesai");
    } finally {
      setDiagnosing(false);
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

              {branches.length > 0 && (
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-600">Cabang</label>
                  {isSuperAdmin ? (
                    <select
                      value={selectedBranchId ?? ""}
                      onChange={(e) => handleBranchChange(e.target.value || null)}
                      disabled={loadingBranch}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                    >
                      <option value="">Global (semua cabang)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-700">
                      {branches.find((b) => b.id === selectedBranchId)?.name ?? "Cabang default"}
                    </p>
                  )}
                </div>
              )}

              {loadingBranch && (
                <p className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat pengaturan cabang...
                </p>
              )}

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

            {/* ── Payment Gateway (Duitku) ── */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-800">Payment Gateway (Duitku)</h3>
                <button
                  onClick={loadDuitkuConfig}
                  disabled={loadingDuitku}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {loadingDuitku ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Muat Konfigurasi
                </button>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Integrasi <a href="https://docs.duitku.com/pop/id/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Duitku POP API</a> untuk pembayaran online otomatis (VA, QRIS, e-Wallet, dll). Callback URL: <code className="bg-gray-100 px-1 rounded text-xs">{typeof window !== "undefined" ? `${window.location.origin}/api/payments/webhook/duitku` : "[NEXTAUTH_URL]/api/payments/webhook/duitku"}</code>
              </p>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={duitkuConfig.gatewayEnabled}
                    onChange={(e) => setDuitkuConfig({ ...duitkuConfig, gatewayEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktifkan Payment Gateway</span>
                </label>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Merchant Code</label>
                  <input
                    value={duitkuConfig.merchantCode}
                    onChange={(e) => setDuitkuConfig({ ...duitkuConfig, merchantCode: e.target.value })}
                    placeholder="DXXXX"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">API Key (Merchant Key)</label>
                  <div className="flex gap-2">
                    <input
                      type={showDuitkuKey ? "text" : "password"}
                      value={duitkuConfig.apiKey}
                      onChange={(e) => setDuitkuConfig({ ...duitkuConfig, apiKey: e.target.value })}
                      placeholder="XXXXXXXCX17XXXX5XX5XXXXXX0X3XXAF"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDuitkuKey(!showDuitkuKey)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      {showDuitkuKey ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={duitkuConfig.sandbox}
                        onChange={() => setDuitkuConfig({ ...duitkuConfig, sandbox: true })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Sandbox (uji coba)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!duitkuConfig.sandbox}
                        onChange={() => setDuitkuConfig({ ...duitkuConfig, sandbox: false })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Production</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Instruksi Pembayaran Manual (opsional)</label>
                  <textarea
                    value={duitkuConfig.manualPaymentInstructions}
                    onChange={(e) => setDuitkuConfig({ ...duitkuConfig, manualPaymentInstructions: e.target.value })}
                    placeholder="Silakan transfer ke rekening berikut:&#10;BCA 1234567890 a.n. Bimbel EduBimbel&#10;Kirim bukti transfer ke WhatsApp 0812-xxxx"
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Ditampilkan kepada siswa/orang tua sebagai alternatif pembayaran manual.</p>
                </div>

                <button onClick={saveDuitkuConfig} disabled={savingDuitku}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {savingDuitku ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Konfigurasi Gateway
                </button>
              </div>
            </div>
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
          <div className="space-y-6 max-w-xl">

            {/* Active method banner */}
            <div className={`flex items-center gap-3 rounded-xl border p-4 ${
              activeEmailMethod === "resend" ? "border-purple-200 bg-purple-50" :
              activeEmailMethod === "oauth2" ? "border-blue-200 bg-blue-50" :
              activeEmailMethod === "smtp"   ? "border-green-200 bg-green-50" :
                                              "border-amber-200 bg-amber-50"
            }`}>
              {activeEmailMethod === "none"
                ? <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                : <CheckCircle className={`h-5 w-5 shrink-0 ${
                    activeEmailMethod === "resend" ? "text-purple-600" :
                    activeEmailMethod === "oauth2" ? "text-blue-600" : "text-green-600"}`} />}
              <div>
                <p className={`font-medium ${
                  activeEmailMethod === "resend" ? "text-purple-800" :
                  activeEmailMethod === "oauth2" ? "text-blue-800" :
                  activeEmailMethod === "smtp"   ? "text-green-800" : "text-amber-800"
                }`}>
                  {activeEmailMethod === "resend" && "Aktif: Resend"}
                  {activeEmailMethod === "oauth2" && "Aktif: Gmail OAuth2"}
                  {activeEmailMethod === "smtp"   && "Aktif: SMTP"}
                  {activeEmailMethod === "none"   && "Email Belum Dikonfigurasi"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeEmailMethod === "resend" && "Email dikirim via Resend API — cepat, andal, tanpa konfigurasi SMTP."}
                  {activeEmailMethod === "oauth2" && "Email dikirim via Gmail API (OAuth2) — tanpa password, lebih aman."}
                  {activeEmailMethod === "smtp"   && "Email dikirim via SMTP. Pertimbangkan Resend atau OAuth2 untuk keamanan lebih baik."}
                  {activeEmailMethod === "none"   && "Konfigurasi salah satu metode di bawah agar notifikasi email aktif."}
                </p>
              </div>
            </div>

            {/* ── Resend ── */}
            <div className="rounded-xl border border-purple-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-100 bg-purple-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-900 text-sm">
                    Opsi 1 — Resend
                    <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Direkomendasikan</span>
                  </h4>
                </div>
                {resendConfigured
                  ? <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">✓ Dikonfigurasi</span>
                  : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Belum diset</span>}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-600">Mengirim email via <strong>Resend API</strong>. Cukup set API key dan alamat from — tanpa perlu SMTP, OAuth, atau App Password.</p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ["RESEND_API_KEY", resendConfigured ? "✓ diset" : "re_xxxxxxxxxxxx"],
                      ["RESEND_FROM", "EduBimbel <no-reply@namadomain.com>"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-gray-500 w-2/5">{k}</td>
                        <td className={`py-1.5 font-mono ${(v as string).startsWith("✓") ? "text-green-700" : "text-gray-400"}`}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 text-xs text-purple-900 space-y-1.5">
                  <p className="font-semibold">Cara setup (sekali saja):</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Buat akun di <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">resend.com</a> dan dapatkan API key</li>
                    <li>(Opsional) Verifikasi domain Anda di dashboard Resend untuk mengirim dari domain sendiri</li>
                    <li>Set <code className="bg-purple-100 px-1 rounded">RESEND_API_KEY</code> dan <code className="bg-purple-100 px-1 rounded">RESEND_FROM</code> di <code className="bg-purple-100 px-1 rounded">.env.local</code></li>
                    <li>Restart server — email siap digunakan</li>
                  </ol>
                </div>
                {resendConfigured && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Resend aktif dan siap mengirim email.
                  </div>
                )}
              </div>
            </div>

            {/* ── SMTP ── */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-800 text-sm">Opsi 2 — SMTP</h4>
                </div>
                {smtpConfigured
                  ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Dikonfigurasi</span>
                  : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Belum diset</span>}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500">Set variabel berikut di <code className="bg-gray-100 px-1 rounded">.env.local</code>:</p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ["SMTP_HOST", "smtp.gmail.com"],
                      ["SMTP_PORT", "587"],
                      ["SMTP_USER", smtpConfigured ? "✓ diset" : "akunemail@gmail.com"],
                      ["SMTP_PASS", smtpConfigured ? "✓ diset" : "app-password-gmail"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-gray-500 w-2/5">{k}</td>
                        <td className={`py-1.5 font-mono ${(v as string).startsWith("✓") ? "text-green-700" : "text-gray-400"}`}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400">Gmail: gunakan <strong>App Password</strong>, bukan password biasa. Aktifkan 2FA Gmail dulu.</p>
              </div>
            </div>

            {/* ── Gmail OAuth2 ── */}
            <div className="rounded-xl border border-blue-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-100 bg-blue-50">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 text-sm">
                    Opsi 3 — Gmail OAuth2
                    <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Direkomendasikan</span>
                  </h4>
                </div>
                {oauth2Configured
                  ? <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">✓ Terhubung</span>
                  : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Belum diset</span>}
              </div>
              <div className="p-4 space-y-4">
                <p className="text-xs text-gray-600">Mengirim email via <strong>Gmail API</strong> menggunakan OAuth2. Tidak memerlukan password SMTP — lebih aman dan tidak terpengaruh kebijakan Google App Password. Kredensial dan token disimpan di database.</p>

                {/* Connected email display */}
                {oauth2DbConfig.connectedEmail && (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Terhubung sebagai</p>
                        <p className="text-xs text-green-700 font-mono">{oauth2DbConfig.connectedEmail}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveConnection}
                      disabled={removingConnection}
                      className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingConnection ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Putus Koneksi
                    </button>
                  </div>
                )}

                {/* Inline Client ID / Secret form */}
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-700">Kredensial Google OAuth2</p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Client ID</label>
                    <input
                      type="text"
                      value={oauthClientId}
                      onChange={(e) => setOauthClientId(e.target.value)}
                      placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Client Secret</label>
                    <div className="flex gap-2">
                      <input
                        type={showClientSecret ? "text" : "password"}
                        value={oauthClientSecret}
                        onChange={(e) => setOauthClientSecret(e.target.value)}
                        placeholder="GOCSPX-xxxxxxxxxxxxx"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        {showClientSecret ? "Sembunyikan" : "Lihat"}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveCreds}
                    disabled={savingCreds}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingCreds ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Simpan Kredensial
                  </button>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 space-y-1.5">
                  <p className="font-semibold">Cara setup:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Buat project & aktifkan <strong>Gmail API</strong> di <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Buat <strong>OAuth 2.0 Client ID</strong> (tipe: Web application) → tambahkan Redirect URI di bawah</li>
                    <li>Masukkan <strong>Client ID</strong> & <strong>Client Secret</strong> ke form di atas lalu klik <strong>Simpan Kredensial</strong></li>
                    <li>Klik <strong>"Mulai Otorisasi Gmail"</strong> → login dengan akun Gmail pengirim</li>
                    <li>Setelah otorisasi berhasil, refresh token & email terhubung otomatis tersimpan ke database — tidak perlu edit .env.local</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs space-y-1">
                  <p className="text-gray-500 font-medium">Authorized Redirect URI (daftarkan di Google Cloud Console):</p>
                  <code className="text-gray-800 break-all select-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/admin/email/callback` : "[NEXTAUTH_URL]/api/admin/email/callback"}
                  </code>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGetAuthUrl}
                    disabled={loadingAuthUrl || (!oauthClientId.trim() && !oauth2Vars.clientId)}
                    className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {loadingAuthUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {oauth2DbConfig.hasRefreshToken ? "Otorisasi Ulang" : "Mulai Otorisasi Gmail"}
                  </button>
                  {oauth2Configured && (
                    <button
                      onClick={handleGetAuthUrl}
                      disabled={loadingAuthUrl}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Perbarui Token
                    </button>
                  )}
                </div>

                {oauth2Configured && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Gmail OAuth2 aktif dan siap mengirim email.
                  </div>
                )}
              </div>
            </div>

            {/* Test email */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Kirim Email Test</h4>
              <div className="flex gap-2">
                <input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="email@contoh.com" disabled={activeEmailMethod === "none"}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={handleTestEmail} disabled={activeEmailMethod === "none" || testingEmail || !testEmailTo}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
                  {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Kirim
                </button>
              </div>
              {activeEmailMethod === "none"
                ? <p className="text-xs text-amber-600">Konfigurasi salah satu metode email terlebih dahulu.</p>
                : <p className="text-xs text-gray-400">Mengirim via <strong>{activeEmailMethod === "resend" ? "Resend" : activeEmailMethod === "oauth2" ? "Gmail OAuth2" : "SMTP"}</strong>.</p>}
            </div>

            {/* Diagnose email */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Diagnosa Email</h4>
                <button onClick={handleDiagnose} disabled={diagnosing}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  {diagnosing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {diagnosing ? "Memeriksa..." : "Periksa Sekarang"}
                </button>
              </div>
              <p className="text-xs text-gray-500">Memeriksa status env vars, koneksi ke Google OAuth2, dan menguji refresh token.</p>

              {diagnosis && (
                <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Metode aktif</span>
                    <span className={`font-medium ${diagnosis.method === "none" ? "text-amber-600" : "text-green-700"}`}>{diagnosis.method}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Redirect URI</span>
                    <code className="max-w-[60%] break-all text-gray-700">{diagnosis.callbackUri}</code>
                  </div>
                  {Object.entries(diagnosis.checks).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-500">{key}</span>
                      <span className={`font-medium ${value.ok ? "text-green-700" : "text-red-500"}`}>{value.detail}</span>
                    </div>
                  ))}
                  {diagnosis.refreshTest && (
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                      <p className="font-medium text-blue-900 mb-1">Tes Refresh Token</p>
                      <p className={`${diagnosis.refreshTest.ok ? "text-green-700" : "text-red-600"}`}>
                        {diagnosis.refreshTest.ok ? "✓" : "✗"} {diagnosis.refreshTest.detail}
                      </p>
                    </div>
                  )}
                  <div className="rounded-md border border-amber-100 bg-amber-50 p-2">
                    <p className="font-medium text-amber-900 mb-1">Kemungkinan kendala umum:</p>
                    <ul className="list-disc pl-4 space-y-1 text-amber-800">
                      {diagnosis.commonIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  </div>
                </div>
              )}
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
