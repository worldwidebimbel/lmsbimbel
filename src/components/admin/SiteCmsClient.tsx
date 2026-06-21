"use client";

import { useState } from "react";
import { Save, Plus, Trash2, Loader2, Eye, EyeOff, Globe, Image, MessageSquare, Palette, Bell } from "lucide-react";

type Tab = "branding" | "banners" | "gallery" | "popup" | "inquiries";

interface Banner { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; linkLabel: string | null; isActive: boolean; order: number; }
interface Gallery { id: string; title: string; description: string | null; imageUrl: string; category: string; isActive: boolean; order: number; }
interface Inquiry { id: string; name: string; phone: string; email: string | null; program: string | null; message: string | null; status: string; createdAt: string; }

const INQ_STATUS: Record<string, string> = { NEW: "Baru", CONTACTED: "Dihubungi", ENROLLED: "Terdaftar", CLOSED: "Ditutup" };

export default function SiteCmsClient({
  initialConfig,
  initialBanners,
  initialGallery,
  initialInquiries,
}: {
  initialConfig: Record<string, string>;
  initialBanners: Banner[];
  initialGallery: Gallery[];
  initialInquiries: Inquiry[];
}) {
  const [tab, setTab] = useState<Tab>("branding");
  const [cfg, setCfg] = useState(initialConfig);
  const [banners, setBanners] = useState(initialBanners);
  const [gallery, setGallery] = useState(initialGallery);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [newBanner, setNewBanner] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "", order: 0 });
  const [newGallery, setNewGallery] = useState({ title: "", description: "", imageUrl: "", category: "AKTIVITAS", order: 0 });

  async function saveCfg() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    setMsg(res.ok ? "Pengaturan disimpan!" : "Gagal menyimpan");
    setSaving(false);
  }

  async function addBanner() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBanner) });
    if (res.ok) { const d = await res.json(); setBanners((b) => [...b, d]); setNewBanner({ title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "", order: 0 }); setMsg("Banner ditambahkan"); }
    else { setMsg("Gagal menambahkan banner"); }
    setSaving(false);
  }

  async function deleteBanner(id: string) {
    if (!confirm("Hapus banner?")) return;
    setSaving(true);
    const res = await fetch("/api/admin/site/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setBanners((b) => b.filter((x) => x.id !== id));
    setSaving(false);
  }

  async function toggleBanner(banner: Banner) {
    const res = await fetch("/api/admin/site/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }) });
    if (res.ok) { const d = await res.json(); setBanners((b) => b.map((x) => x.id === d.id ? d : x)); }
  }

  async function addGallery() {
    if (!newGallery.imageUrl || !newGallery.title) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newGallery) });
    if (res.ok) { const d = await res.json(); setGallery((g) => [...g, d]); setNewGallery({ title: "", description: "", imageUrl: "", category: "AKTIVITAS", order: 0 }); setMsg("Foto ditambahkan"); }
    else { setMsg("Gagal menambahkan foto"); }
    setSaving(false);
  }

  async function deleteGallery(id: string) {
    if (!confirm("Hapus foto ini?")) return;
    await fetch("/api/admin/site/gallery", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setGallery((g) => g.filter((x) => x.id !== id));
  }

  async function updateInquiryStatus(id: string, status: string) {
    const res = await fetch("/api/admin/site/inquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) setInquiries((items) => items.map((i) => i.id === id ? { ...i, status } : i));
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "branding", label: "Branding & Konten", icon: <Palette className="w-4 h-4" /> },
    { key: "banners", label: "Banner / Slider", icon: <Image className="w-4 h-4" /> },
    { key: "gallery", label: "Gallery", icon: <Globe className="w-4 h-4" /> },
    { key: "popup", label: "Popup Promo", icon: <Bell className="w-4 h-4" /> },
    { key: "inquiries", label: "Pendaftaran Masuk", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const field = (key: string, label: string, type = "text", placeholder = "") => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={cfg[key] ?? ""}
        onChange={(e) => setCfg((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CMS Landing Page</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola konten, branding, banner, gallery, dan pendaftaran publik.</p>
      </div>

      {msg && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{msg}</div>}

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "branding" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Identitas Lembaga</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {field("siteName", "Nama Lembaga", "text", "EduBimbel")}
              {field("phone", "Nomor Telepon", "text", "0812-3456-7890")}
              {field("email", "Email", "email", "info@edubimbel.id")}
              {field("whatsapp", "WhatsApp (tanpa +)", "text", "6281234567890")}
            </div>
            {field("address", "Alamat Lengkap")}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Hero Section</h2>
            {field("tagline", "Tagline (judul besar hero)", "text", "Wujudkan Mimpi Cemerlang Bersama Kami")}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={cfg.description ?? ""}
                onChange={(e) => setCfg((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {field("trialText", "Teks CTA Section")}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Warna Branding</h2>
            <div className="grid grid-cols-3 gap-4">
              {[["colorPrimary", "Warna Primer"], ["colorSecondary", "Warna Sekunder"], ["colorAccent", "Warna Aksen"]].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={cfg[key] ?? "#2563EB"}
                      onChange={(e) => setCfg((p) => ({ ...p, [key]: e.target.value }))}
                      className="h-9 w-12 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={cfg[key] ?? ""}
                      onChange={(e) => setCfg((p) => ({ ...p, [key]: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: cfg.colorPrimary }}></div>
              <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: cfg.colorSecondary }}></div>
              <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: cfg.colorAccent }}></div>
            </div>
          </div>

          <button onClick={saveCfg} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
          </button>
        </div>
      )}

      {tab === "banners" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tambah Banner Baru</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Judul *</label><input value={newBanner.title} onChange={(e) => setNewBanner((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Judul banner" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Subtitle</label><input value={newBanner.subtitle} onChange={(e) => setNewBanner((p) => ({ ...p, subtitle: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">URL Gambar</label><input value={newBanner.imageUrl} onChange={(e) => setNewBanner((p) => ({ ...p, imageUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">URL Link (opsional)</label><input value={newBanner.linkUrl} onChange={(e) => setNewBanner((p) => ({ ...p, linkUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Label Tombol</label><input value={newBanner.linkLabel} onChange={(e) => setNewBanner((p) => ({ ...p, linkLabel: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Daftar Sekarang" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Urutan</label><input type="number" value={newBanner.order} onChange={(e) => setNewBanner((p) => ({ ...p, order: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
            </div>
            <button onClick={addBanner} disabled={saving || !newBanner.title} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
              <Plus className="w-4 h-4" /> Tambah Banner
            </button>
          </div>

          <div className="space-y-3">
            {banners.length === 0 && <p className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada banner.</p>}
            {banners.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title} className="w-20 h-12 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-12 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-gray-500 truncate">{b.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{b.isActive ? "Aktif" : "Nonaktif"}</span>
                  <button onClick={() => toggleBanner(b)} className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">{b.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "gallery" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tambah Foto Gallery</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Judul *</label><input value={newGallery.title} onChange={(e) => setNewGallery((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Kategori</label>
                <select value={newGallery.category} onChange={(e) => setNewGallery((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                  {["AKTIVITAS", "PRESTASI", "EVENT", "KELAS"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">URL Gambar *</label><input value={newGallery.imageUrl} onChange={(e) => setNewGallery((p) => ({ ...p, imageUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Deskripsi</label><input value={newGallery.description} onChange={(e) => setNewGallery((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Urutan</label><input type="number" value={newGallery.order} onChange={(e) => setNewGallery((p) => ({ ...p, order: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
            </div>
            <button onClick={addGallery} disabled={saving || !newGallery.title || !newGallery.imageUrl} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
              <Plus className="w-4 h-4" /> Tambah Foto
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((g) => (
              <div key={g.id} className="group relative rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{g.title}</p>
                  <span className="text-xs text-gray-400">{g.category}</span>
                </div>
                <button onClick={() => deleteGallery(g.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {gallery.length === 0 && <div className="col-span-4 text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada foto gallery.</div>}
          </div>
        </div>
      )}

      {tab === "popup" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Popup Promosi</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfg.popupEnabled === "true"} onChange={(e) => setCfg((p) => ({ ...p, popupEnabled: e.target.checked ? "true" : "false" }))} className="rounded" />
              <span className="text-sm text-gray-700">Tampilkan popup saat homepage dibuka</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {field("popupTitle", "Judul Popup", "text", "Promo Spesial!")}
              {field("popupLinkLabel", "Label Tombol", "text", "Daftar Sekarang")}
              {field("popupLinkUrl", "URL Tombol (opsional)", "text", "/login")}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Popup</label>
              <textarea rows={3} value={cfg.popupMessage ?? ""} onChange={(e) => setCfg((p) => ({ ...p, popupMessage: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Daftar sekarang dan dapatkan sesi trial gratis..." />
            </div>
          </div>
          <button onClick={saveCfg} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
          </button>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pendaftaran Masuk ({inquiries.length})</h2>
            <span className="text-xs text-gray-400">50 terbaru</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nama</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kontak</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Program</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Belum ada pendaftaran</td></tr>}
              {inquiries.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{i.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{i.phone}</div>
                    {i.email && <div className="text-xs text-gray-400">{i.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{i.program || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={i.status}
                      onChange={(e) => updateInquiryStatus(i.id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2 py-0.5 border-0 focus:outline-none bg-transparent cursor-pointer ${i.status === "NEW" ? "text-blue-700 bg-blue-100" : i.status === "ENROLLED" ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100"}`}
                    >
                      {Object.entries(INQ_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(i.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
