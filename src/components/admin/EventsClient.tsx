"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Package, Plus, Trash2, Edit2, X, Users, Check, Loader2, BookOpen, UserCheck, Award } from "lucide-react";
import ImageUploadButton from "@/components/guru/ImageUploadButton";

interface EventPackage {
  id?: string;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  location: string | null;
  image: string | null;
  maxParticipants: number | null;
  isPaid: boolean;
  branchId: string;
  packages: EventPackage[];
  _count: { registrations: number };
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function EventsClient({ isSuperAdmin, userBranchId, basePath = "/admin/events" }: { isSuperAdmin: boolean; userBranchId: string | null; basePath?: string }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    type: "TRYOUT",
    status: "DRAFT",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    image: "",
    maxParticipants: "",
    isPaid: false,
    branchId: userBranchId || "",
    packages: [] as EventPackage[],
  };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const [eventsRes, branchesRes] = await Promise.all([
      fetch("/api/admin/events"),
      fetch("/api/admin/branches"),
    ]);
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (branchesRes.ok) setBranches(await branchesRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, branchId: userBranchId || branches[0]?.id || "" });
    setFormOpen(true);
  }

  function openEdit(event: EventItem) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || "",
      type: event.type,
      status: event.status,
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : "",
      location: event.location || "",
      image: event.image || "",
      maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
      isPaid: event.isPaid,
      branchId: event.branchId,
      packages: event.packages.map((p) => ({ ...p })),
    });
    setFormOpen(true);
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPackage() {
    setForm((prev) => ({
      ...prev,
      packages: [...prev.packages, { name: "", price: 0, description: "", isActive: true }],
    }));
  }

  function updatePackage(index: number, field: keyof EventPackage, value: any) {
    setForm((prev) => {
      const packages = [...prev.packages];
      packages[index] = { ...packages[index], [field]: value };
      return { ...prev, packages };
    });
  }

  function removePackage(index: number) {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      endDate: form.endDate || null,
      registrationDeadline: form.registrationDeadline || null,
      image: form.image || null,
      location: form.location || null,
      packages: form.packages,
    };

    const url = editing ? `/api/admin/events/${editing.id}` : "/api/admin/events";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setFormOpen(false);
      await load();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan event");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus event ini?")) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("Gagal menghapus event");
  }

  if (loading) return <div className="py-20 text-center text-sm text-gray-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Berbayar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola tryout, olimpiade, dan workshop per cabang</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Event
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const branch = branches.find((b) => b.id === event.branchId);
          return (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {event.image && (
                    <img src={event.image} alt={event.title} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{event.type}</span>
                    <h3 className="font-semibold text-gray-900 mt-1">{event.title}</h3>
                    <p className="text-xs text-gray-500">{branch?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(event)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(event.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(event.startDate).toLocaleString("id-ID")}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> {event.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  {event._count.registrations} pendaftar
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.isPaid ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {event.isPaid ? "Berbayar" : "Gratis"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.status === "PUBLISHED" ? "bg-green-100 text-green-700" : event.status === "DRAFT" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                  {event.status}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Link
                    href={`${basePath}/${event.id}/exam`}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Ujian
                  </Link>
                  <Link
                    href={`${basePath}/${event.id}/registrations`}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Peserta
                  </Link>
                  <Link
                    href={`${basePath}/${event.id}/sertifikat`}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Award className="w-3.5 h-3.5" /> Sertifikat
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Event" : "Tambah Event"}</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                  <input required value={form.title} onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select value={form.type} onChange={(e) => updateField("type", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="TRYOUT">Tryout</option>
                    <option value="OLIMPIADE">Olimpiade</option>
                    <option value="WORKSHOP">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                  <input required type="datetime-local" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                  <input type="datetime-local" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batas Pendaftaran</label>
                  <input type="datetime-local" value={form.registrationDeadline} onChange={(e) => updateField("registrationDeadline", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <input value={form.location} onChange={(e) => updateField("location", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maks Peserta</label>
                  <input type="number" value={form.maxParticipants} onChange={(e) => updateField("maxParticipants", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar / Banner Event</label>
                  <div className="flex items-center gap-3">
                    <ImageUploadButton
                      url={form.image}
                      onChange={(url) => updateField("image", url)}
                      label="Gambar event"
                      size="md"
                    />
                    {form.image && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Preview:</p>
                        <img src={form.image} alt="Preview" className="h-24 w-full max-w-xs rounded-lg object-cover border border-gray-200" />
                      </div>
                    )}
                    {!form.image && (
                      <p className="text-xs text-gray-400">Klik kotak di kiri untuk upload gambar. Kosongkan jika tidak perlu.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
                  <select value={form.branchId} onChange={(e) => updateField("branchId", e.target.value)} disabled={!isSuperAdmin}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100">
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <input id="isPaid" type="checkbox" checked={form.isPaid} onChange={(e) => updateField("isPaid", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Event berbayar</label>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4" /> Paket/Tier Harga</h3>
                  <button type="button" onClick={addPackage}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                    <Plus className="w-3 h-3" /> Tambah Paket
                  </button>
                </div>
                <div className="space-y-3">
                  {form.packages.map((pkg, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <input placeholder="Nama paket" value={pkg.name} onChange={(e) => updatePackage(index, "name", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" placeholder="Harga" value={pkg.price} onChange={(e) => updatePackage(index, "price", Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      </div>
                      <div className="col-span-4">
                        <input placeholder="Keterangan" value={pkg.description || ""} onChange={(e) => updatePackage(index, "description", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removePackage(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.packages.length === 0 && <p className="text-xs text-gray-400">Belum ada paket (tambahkan jika event berbayar).</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Simpan" : "Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
