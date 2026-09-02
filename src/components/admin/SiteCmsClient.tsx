"use client";

import { useState } from "react";
import { Save, Plus, Trash2, Loader2, Eye, EyeOff, Globe, Image, MessageSquare, Palette, Bell, Layers, Quote, Newspaper } from "lucide-react";

type Tab = "branding" | "banners" | "gallery" | "programs" | "testimonials" | "blog" | "popup" | "inquiries";

interface Banner { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; linkLabel: string | null; isActive: boolean; order: number; }
interface Gallery { id: string; title: string; description: string | null; imageUrl: string; category: string; isActive: boolean; order: number; }
interface Program { id: string; title: string; description: string | null; icon: string; color: string; linkUrl: string | null; isActive: boolean; order: number; }
interface Testimonial { id: string; name: string; role: string | null; text: string; avatarUrl: string | null; order: number; isActive: boolean; createdAt: string; updatedAt: string; }
interface BlogPost { id: string; slug: string; title: string; excerpt: string | null; content: string; coverImage: string | null; author: string | null; category: string; tags: string[]; isPublished: boolean; publishedAt: string | null; createdAt: string; updatedAt: string; }
interface Inquiry { id: string; name: string; phone: string; email: string | null; program: string | null; message: string | null; status: string; createdAt: string; }

const INQ_STATUS: Record<string, string> = { NEW: "Baru", CONTACTED: "Dihubungi", ENROLLED: "Terdaftar", CLOSED: "Ditutup" };

export default function SiteCmsClient({
  initialConfig,
  initialBanners,
  initialGallery,
  initialInquiries,
  initialPrograms,
  initialTestimonials,
  initialBlogPosts,
}: {
  initialConfig: Record<string, string>;
  initialBanners: Banner[];
  initialGallery: Gallery[];
  initialInquiries: Inquiry[];
  initialPrograms: Program[];
  initialTestimonials: Testimonial[];
  initialBlogPosts: BlogPost[];
}) {
  const [tab, setTab] = useState<Tab>("branding");
  const [cfg, setCfg] = useState(initialConfig);
  const [banners, setBanners] = useState(initialBanners);
  const [gallery, setGallery] = useState(initialGallery);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [programs, setPrograms] = useState(initialPrograms);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [blogPosts, setBlogPosts] = useState(initialBlogPosts);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [newBanner, setNewBanner] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "", order: 0 });
  const [newGallery, setNewGallery] = useState({ title: "", description: "", imageUrl: "", category: "AKTIVITAS", order: 0 });
  const [newProgram, setNewProgram] = useState({ title: "", description: "", icon: "GraduationCap", color: "bg-blue-100 text-blue-700", linkUrl: "", order: 0 });
  const [newTestimonial, setNewTestimonial] = useState({ name: "", role: "", text: "", avatarUrl: "", order: 0 });
  const [newBlog, setNewBlog] = useState({ title: "", slug: "", excerpt: "", content: "", coverImage: "", author: "", category: "Umum", tags: "", isPublished: false });

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

  async function addProgram() {
    if (!newProgram.title) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProgram) });
    if (res.ok) { const d = await res.json(); setPrograms((p) => [...p, d]); setNewProgram({ title: "", description: "", icon: "GraduationCap", color: "bg-blue-100 text-blue-700", linkUrl: "", order: 0 }); setMsg("Program ditambahkan"); }
    else { setMsg("Gagal menambahkan program"); }
    setSaving(false);
  }

  async function deleteProgram(id: string) {
    if (!confirm("Hapus program ini?")) return;
    setSaving(true);
    const res = await fetch("/api/admin/site/programs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setPrograms((p) => p.filter((x) => x.id !== id));
    setSaving(false);
  }

  async function toggleProgram(program: Program) {
    const res = await fetch("/api/admin/site/programs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: program.id, isActive: !program.isActive }) });
    if (res.ok) { const d = await res.json(); setPrograms((p) => p.map((x) => x.id === d.id ? d : x)); }
  }

  async function updateProgramField(id: string, key: keyof Program, value: unknown) {
    const res = await fetch("/api/admin/site/programs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [key]: value }) });
    if (res.ok) { const d = await res.json(); setPrograms((p) => p.map((x) => x.id === d.id ? d : x)); }
  }

  async function addTestimonial() {
    if (!newTestimonial.name || !newTestimonial.text) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newTestimonial, role: newTestimonial.role || null, avatarUrl: newTestimonial.avatarUrl || null }) });
    if (res.ok) { const d = await res.json(); setTestimonials((t) => [...t, d]); setNewTestimonial({ name: "", role: "", text: "", avatarUrl: "", order: 0 }); setMsg("Testimoni ditambahkan"); }
    else { setMsg("Gagal menambahkan testimoni"); }
    setSaving(false);
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("Hapus testimoni ini?")) return;
    setSaving(true);
    const res = await fetch("/api/admin/site/testimonials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setTestimonials((t) => t.filter((x) => x.id !== id));
    setSaving(false);
  }

  async function toggleTestimonial(t: Testimonial) {
    const res = await fetch("/api/admin/site/testimonials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, isActive: !t.isActive }) });
    if (res.ok) { const d = await res.json(); setTestimonials((items) => items.map((x) => x.id === d.id ? d : x)); }
  }

  async function updateTestimonialField(id: string, key: keyof Testimonial, value: unknown) {
    const res = await fetch("/api/admin/site/testimonials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [key]: value }) });
    if (res.ok) { const d = await res.json(); setTestimonials((items) => items.map((x) => x.id === d.id ? d : x)); }
  }

  async function addBlogPost() {
    if (!newBlog.title || !newBlog.content) return;
    setSaving(true); setMsg("");
    const payload = {
      ...newBlog,
      excerpt: newBlog.excerpt || null,
      coverImage: newBlog.coverImage || null,
      author: newBlog.author || null,
      tags: newBlog.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const res = await fetch("/api/admin/site/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { const d = await res.json(); setBlogPosts((b) => [d, ...b]); setNewBlog({ title: "", slug: "", excerpt: "", content: "", coverImage: "", author: "", category: "Umum", tags: "", isPublished: false }); setMsg("Artikel ditambahkan"); }
    else { setMsg("Gagal menambahkan artikel"); }
    setSaving(false);
  }

  async function deleteBlogPost(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    setSaving(true);
    const res = await fetch("/api/admin/site/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setBlogPosts((b) => b.filter((x) => x.id !== id));
    setSaving(false);
  }

  async function toggleBlogPost(b: BlogPost) {
    const res = await fetch("/api/admin/site/blog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, isPublished: !b.isPublished }) });
    if (res.ok) { const d = await res.json(); setBlogPosts((items) => items.map((x) => x.id === d.id ? d : x)); }
  }

  async function updateBlogField(id: string, key: keyof BlogPost, value: unknown) {
    const res = await fetch("/api/admin/site/blog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [key]: value }) });
    if (res.ok) { const d = await res.json(); setBlogPosts((items) => items.map((x) => x.id === d.id ? d : x)); }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "branding", label: "Branding & Konten", icon: <Palette className="w-4 h-4" /> },
    { key: "banners", label: "Banner / Slider", icon: <Image className="w-4 h-4" /> },
    { key: "gallery", label: "Gallery", icon: <Globe className="w-4 h-4" /> },
    { key: "programs", label: "Program", icon: <Layers className="w-4 h-4" /> },
    { key: "testimonials", label: "Testimoni", icon: <Quote className="w-4 h-4" /> },
    { key: "blog", label: "Blog / Artikel", icon: <Newspaper className="w-4 h-4" /> },
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
            {field("trialText", "Teks Paragraf CTA Section")}
            {field("ctaHeading", "Heading CTA Section (h2)", "text", "Siap Meraih Prestasi?")}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Tombol Utama (Daftar)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("ctaPrimaryLabel", "Label Tombol Utama", "text", "Daftar Sekarang")}
                {field("ctaPrimaryLink", "Link Tombol Utama", "text", "#daftar atau /daftar")}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna Tombol Utama</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cfg.ctaPrimaryColor ?? "#FFFFFF"}
                    onChange={(e) => setCfg((p) => ({ ...p, ctaPrimaryColor: e.target.value }))}
                    className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cfg.ctaPrimaryColor ?? "#FFFFFF"}
                    onChange={(e) => setCfg((p) => ({ ...p, ctaPrimaryColor: e.target.value }))}
                    placeholder="#FFFFFF"
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <div
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-center"
                    style={{ backgroundColor: cfg.ctaPrimaryColor ?? "#FFFFFF", color: cfg.colorPrimary ?? "#2563EB" }}
                  >
                    {cfg.ctaPrimaryLabel || "Daftar Sekarang"}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Tombol Sekunder (Hubungi)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("ctaSecondaryLabel", "Label Tombol Sekunder", "text", "Hubungi Kami")}
                {field("ctaSecondaryLink", "Link Tombol Sekunder", "text", "Kosongkan untuk WhatsApp otomatis")}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Logo & Favicon</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo</label>
                  <input
                    type="text"
                    value={cfg.logoUrl ?? ""}
                    onChange={(e) => setCfg((p) => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="https://cdn.contoh.com/logo.png"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">Format PNG/SVG transparan direkomendasikan. Tinggi otomatis 36px.</p>
                </div>
                <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  {cfg.logoUrl ? (
                    <img src={cfg.logoUrl} alt="Logo preview" className="h-10 w-auto max-w-[180px] object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">Preview logo akan muncul di sini</span>
                  )}
                </div>
              </div>
              {/* Favicon */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Favicon</label>
                  <input
                    type="text"
                    value={cfg.faviconUrl ?? ""}
                    onChange={(e) => setCfg((p) => ({ ...p, faviconUrl: e.target.value }))}
                    placeholder="https://cdn.contoh.com/favicon.ico"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">Format ICO, PNG 32×32, atau SVG. Tampil di tab browser.</p>
                </div>
                <div className="flex items-center gap-3 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4">
                  {cfg.faviconUrl ? (
                    <>
                      <img src={cfg.faviconUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
                      <span className="text-xs text-gray-500">Akan tampil sebagai ikon tab browser setelah disimpan &amp; build ulang</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Preview favicon akan muncul di sini</span>
                  )}
                </div>
              </div>
            </div>
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
                  <button onClick={() => toggleBanner(b)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">{b.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button onClick={() => deleteBanner(b.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

      {tab === "programs" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tambah Program</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Judul *</label><input value={newProgram.title} onChange={(e) => setNewProgram((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="SD Kelas 4-6" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Icon</label>
                <select value={newProgram.icon} onChange={(e) => setNewProgram((p) => ({ ...p, icon: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                  {["GraduationCap", "BookOpen", "Users", "Award", "FlaskConical", "Calculator", "Monitor", "PenTool", "Layers", "Rocket"].map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-600 mb-1 block">Warna</label>
                <select value={newProgram.color} onChange={(e) => setNewProgram((p) => ({ ...p, color: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                  {[
                    { v: "bg-blue-100 text-blue-700", l: "Biru" },
                    { v: "bg-orange-100 text-orange-700", l: "Oranye" },
                    { v: "bg-purple-100 text-purple-700", l: "Ungu" },
                    { v: "bg-green-100 text-green-700", l: "Hijau" },
                    { v: "bg-red-100 text-red-700", l: "Merah" },
                    { v: "bg-pink-100 text-pink-700", l: "Pink" },
                    { v: "bg-indigo-100 text-indigo-700", l: "Indigo" },
                    { v: "bg-teal-100 text-teal-700", l: "Teal" },
                  ].map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-600 mb-1 block">Urutan</label><input type="number" value={newProgram.order} onChange={(e) => setNewProgram((p) => ({ ...p, order: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">Deskripsi</label><input value={newProgram.description} onChange={(e) => setNewProgram((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Deskripsi program" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">URL Link (opsional)</label><input value={newProgram.linkUrl} onChange={(e) => setNewProgram((p) => ({ ...p, linkUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="/program/sd" /></div>
            </div>
            <button onClick={addProgram} disabled={saving || !newProgram.title} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
              <Plus className="w-4 h-4" /> Tambah Program
            </button>
          </div>

          <div className="space-y-3">
            {programs.length === 0 && <p className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada program.</p>}
            {programs.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={p.title} onChange={(e) => updateProgramField(p.id, "title", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <select value={p.icon} onChange={(e) => updateProgramField(p.id, "icon", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                    {["GraduationCap", "BookOpen", "Users", "Award", "FlaskConical", "Calculator", "Monitor", "PenTool", "Layers", "Rocket"].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <select value={p.color} onChange={(e) => updateProgramField(p.id, "color", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                    {[
                      { v: "bg-blue-100 text-blue-700", l: "Biru" },
                      { v: "bg-orange-100 text-orange-700", l: "Oranye" },
                      { v: "bg-purple-100 text-purple-700", l: "Ungu" },
                      { v: "bg-green-100 text-green-700", l: "Hijau" },
                      { v: "bg-red-100 text-red-700", l: "Merah" },
                      { v: "bg-pink-100 text-pink-700", l: "Pink" },
                      { v: "bg-indigo-100 text-indigo-700", l: "Indigo" },
                      { v: "bg-teal-100 text-teal-700", l: "Teal" },
                    ].map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                  <input type="number" value={p.order} onChange={(e) => updateProgramField(p.id, "order", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <input value={p.description ?? ""} onChange={(e) => updateProgramField(p.id, "description", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Deskripsi" />
                  <input value={p.linkUrl ?? ""} onChange={(e) => updateProgramField(p.id, "linkUrl", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="URL Link" />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Aktif" : "Nonaktif"}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleProgram(p)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">{p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <button onClick={() => deleteProgram(p.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "testimonials" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tambah Testimoni</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Nama *</label><input value={newTestimonial.name} onChange={(e) => setNewTestimonial((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Andi Wijaya" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Peran / Kelas</label><input value={newTestimonial.role} onChange={(e) => setNewTestimonial((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Orang Tua Siswa SMP" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">URL Avatar</label><input value={newTestimonial.avatarUrl} onChange={(e) => setNewTestimonial((p) => ({ ...p, avatarUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Urutan</label><input type="number" value={newTestimonial.order} onChange={(e) => setNewTestimonial((p) => ({ ...p, order: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">Testimoni *</label><textarea value={newTestimonial.text} onChange={(e) => setNewTestimonial((p) => ({ ...p, text: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Tulis testimoni" /></div>
            </div>
            <button onClick={addTestimonial} disabled={saving || !newTestimonial.name || !newTestimonial.text} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
              <Plus className="w-4 h-4" /> Tambah Testimoni
            </button>
          </div>

          <div className="space-y-3">
            {testimonials.length === 0 && <p className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada testimoni.</p>}
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={t.name} onChange={(e) => updateTestimonialField(t.id, "name", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <input value={t.role ?? ""} onChange={(e) => updateTestimonialField(t.id, "role", e.target.value || null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Peran / Kelas" />
                  <input type="number" value={t.order} onChange={(e) => updateTestimonialField(t.id, "order", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <input value={t.avatarUrl ?? ""} onChange={(e) => updateTestimonialField(t.id, "avatarUrl", e.target.value || null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="URL Avatar" />
                  <textarea value={t.text} onChange={(e) => updateTestimonialField(t.id, "text", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.isActive ? "Aktif" : "Nonaktif"}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleTestimonial(t)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">{t.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <button onClick={() => deleteTestimonial(t.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "blog" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tambah Artikel</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Judul *</label><input value={newBlog.title} onChange={(e) => setNewBlog((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Judul artikel" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Slug (opsional, auto jika kosong)</label><input value={newBlog.slug} onChange={(e) => setNewBlog((p) => ({ ...p, slug: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="judul-artikel" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Kategori</label><input value={newBlog.category} onChange={(e) => setNewBlog((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Penulis</label><input value={newBlog.author} onChange={(e) => setNewBlog((p) => ({ ...p, author: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">URL Cover Gambar</label><input value={newBlog.coverImage} onChange={(e) => setNewBlog((p) => ({ ...p, coverImage: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">Tag (pisahkan koma)</label><input value={newBlog.tags} onChange={(e) => setNewBlog((p) => ({ ...p, tags: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="tips, utbk, sd" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">Ringkasan</label><input value={newBlog.excerpt} onChange={(e) => setNewBlog((p) => ({ ...p, excerpt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-600 mb-1 block">Konten *</label><textarea value={newBlog.content} onChange={(e) => setNewBlog((p) => ({ ...p, content: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={6} placeholder="Konten artikel (HTML atau Markdown)" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newBlog.isPublished} onChange={(e) => setNewBlog((p) => ({ ...p, isPublished: e.target.checked }))} className="rounded border-gray-300" />
              Publikasikan
            </label>
            <button onClick={addBlogPost} disabled={saving || !newBlog.title || !newBlog.content} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
              <Plus className="w-4 h-4" /> Tambah Artikel
            </button>
          </div>

          <div className="space-y-3">
            {blogPosts.length === 0 && <p className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada artikel.</p>}
            {blogPosts.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={b.title} onChange={(e) => updateBlogField(b.id, "title", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <input value={b.slug} onChange={(e) => updateBlogField(b.id, "slug", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Slug" />
                  <input value={b.category} onChange={(e) => updateBlogField(b.id, "category", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Kategori" />
                  <input value={b.author ?? ""} onChange={(e) => updateBlogField(b.id, "author", e.target.value || null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Penulis" />
                  <input value={b.coverImage ?? ""} onChange={(e) => updateBlogField(b.id, "coverImage", e.target.value || null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="URL Cover Gambar" />
                  <input value={b.excerpt ?? ""} onChange={(e) => updateBlogField(b.id, "excerpt", e.target.value || null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Ringkasan" />
                  <textarea value={b.content} onChange={(e) => updateBlogField(b.id, "content", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" rows={4} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{b.isPublished ? "Publik" : "Draft"}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleBlogPost(b)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">{b.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <button onClick={() => deleteBlogPost(b.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
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
