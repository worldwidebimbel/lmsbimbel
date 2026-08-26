"use client";

import { useState, useRef } from "react";
import { DoorOpen, Building2, Plus, Pencil, Trash2, X, Users, MapPin, Image as ImageIcon, Loader2 } from "lucide-react";

type Building = {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  _count: { rooms: number };
};

type Room = {
  id: string;
  name: string;
  roomNumber: string | null;
  capacity: number;
  floor: string | null;
  facilities: string[] | null;
  photoUrl?: string | null;
  isActive: boolean;
  building: { id: string; name: string };
  _count: { classes: number; schedules: number };
};

type Branch = { id: string; name: string; code: string };

interface Props {
  initialBuildings: Building[];
  initialRooms: (Omit<Room, "facilities"> & { facilities: unknown })[];
  branches: Branch[];
  isSuperAdmin: boolean;
}

export function RoomsManager({ initialBuildings, initialRooms, branches, isSuperAdmin }: Props) {
  const normalizedRooms = initialRooms.map((r) => ({
    ...r,
    facilities: Array.isArray(r.facilities) ? (r.facilities as string[]) : null,
  }));
  const [buildings, setBuildings] = useState(initialBuildings);
  const [rooms, setRooms] = useState<Room[]>(normalizedRooms);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  async function saveBuilding(data: Record<string, unknown>) {
    if (editingBuilding) {
      const res = await fetch(`/api/admin/buildings/${editingBuilding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setBuildings((prev) => prev.map((b) => (b.id === editingBuilding.id ? { ...b, ...updated } : b)));
        setShowBuildingForm(false);
        setEditingBuilding(null);
      }
    } else {
      const res = await fetch("/api/admin/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        setBuildings((prev) => [...prev, { ...created, _count: { rooms: 0 } }]);
        setShowBuildingForm(false);
      }
    }
  }

  async function deleteBuilding(id: string) {
    if (!confirm("Nonaktifkan gedung ini? Ruangan di dalamnya juga akan dinonaktifkan.")) return;
    const res = await fetch(`/api/admin/buildings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: false } : b)));
      setRooms((prev) => prev.map((r) => (r.building.id === id ? { ...r, isActive: false } : r)));
    }
  }

  async function saveRoom(data: Record<string, unknown>) {
    if (editingRoom) {
      const res = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        const building = buildings.find((b) => b.id === (data.buildingId as string)) ?? { id: editingRoom.building.id, name: editingRoom.building.name };
        const normalized = { ...updated, facilities: Array.isArray(updated.facilities) ? updated.facilities : null };
        setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? { ...r, ...normalized, building: { id: building.id, name: building.name }, _count: editingRoom._count } : r)));
        setShowRoomForm(false);
        setEditingRoom(null);
      }
    } else {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, facilities: Array.isArray(created.facilities) ? created.facilities : null };
        const building = buildings.find((b) => b.id === (data.buildingId as string));
        setRooms((prev) => [...prev, { ...normalized, building: { id: building?.id ?? "", name: building?.name ?? "" }, _count: { classes: 0, schedules: 0 } }]);
        setBuildings((prev) => prev.map((b) => (b.id === data.buildingId ? { ...b, _count: { rooms: b._count.rooms + 1 } } : b)));
        setShowRoomForm(false);
      }
    }
  }

  async function deleteRoom(id: string) {
    if (!confirm("Nonaktifkan ruangan ini?")) return;
    const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Buildings column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Gedung</h2>
            <button
              onClick={() => { setEditingBuilding(null); setShowBuildingForm(true); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3 h-3" /> Gedung
            </button>
          </div>

          <div className="space-y-3">
            {buildings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {b.photoUrl ? (
                  <img src={b.photoUrl} alt={b.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{b.name}</h3>
                      {b.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {b.address}
                        </p>
                      )}
                    </div>
                    {!b.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </div>
                  {b.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{b.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{b._count.rooms} ruang</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingBuilding(b); setShowBuildingForm(true); }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {b.isActive && (
                        <button
                          onClick={() => deleteBuilding(b.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {buildings.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada gedung</p>
              </div>
            )}
          </div>
        </div>

        {/* Rooms column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ruangan</h2>
            <button
              onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3 h-3" /> Ruangan
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {r.photoUrl ? (
                  <img src={r.photoUrl} alt={r.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                    <DoorOpen className="w-7 h-7 text-gray-300" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{r.name}</h3>
                        <p className="text-xs text-gray-500">{r.building.name}</p>
                      </div>
                    </div>
                    {!r.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      <Users className="w-3 h-3 inline mr-0.5" /> {r.capacity} orang
                    </span>
                    {r.floor && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Lantai {r.floor}</span>}
                    {r.roomNumber && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">No. {r.roomNumber}</span>}
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r._count.classes} kelas</span>
                  </div>

                  {r.facilities && r.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.facilities.map((f, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setEditingRoom(r); setShowRoomForm(true); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    {r.isActive && (
                      <button
                        onClick={() => deleteRoom(r.id)}
                        className="flex items-center justify-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <DoorOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Belum ada ruangan</p>
            </div>
          )}
        </div>
      </div>

      {showBuildingForm && (
        <BuildingForm
          editing={editingBuilding}
          branches={branches}
          isSuperAdmin={isSuperAdmin}
          onSave={saveBuilding}
          onClose={() => { setShowBuildingForm(false); setEditingBuilding(null); }}
        />
      )}

      {showRoomForm && (
        <RoomForm
          editing={editingRoom}
          buildings={buildings}
          onSave={saveRoom}
          onClose={() => { setShowRoomForm(false); setEditingRoom(null); }}
        />
      )}
    </div>
  );
}

function PhotoUpload({
  url,
  onChange,
  label,
}: {
  url: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "buildings");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      }
    } catch {
      /* ignore */
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {url ? (
          <img src={url} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
            {uploading ? "Uploading..." : "Pilih Foto"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1 text-xs text-red-500 hover:underline"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BuildingForm({
  editing,
  branches,
  isSuperAdmin,
  onSave,
  onClose,
}: {
  editing: Building | null;
  branches: Branch[];
  isSuperAdmin: boolean;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState(editing?.photoUrl ?? "");
  const [branchId, setBranchId] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Edit Gedung" : "Tambah Gedung"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cabang *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih cabang...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Gedung *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Gedung A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Jl. Pendidikan No. 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi gedung..."
            />
          </div>

          <PhotoUpload url={photoUrl} onChange={setPhotoUrl} label="Foto Gedung" />
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={() => { if (name && (!isSuperAdmin || branchId)) onSave({ name, address: address || undefined, description: description || undefined, photoUrl: photoUrl || undefined, branchId: branchId || undefined }); }}
            disabled={!name || (isSuperAdmin && !branchId)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomForm({
  editing,
  buildings,
  onSave,
  onClose,
}: {
  editing: Room | null;
  buildings: Building[];
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [roomNumber, setRoomNumber] = useState(editing?.roomNumber ?? "");
  const [buildingId, setBuildingId] = useState(editing?.building.id ?? buildings[0]?.id ?? "");
  const [capacity, setCapacity] = useState(editing?.capacity ?? 30);
  const [floor, setFloor] = useState(editing?.floor ?? "");
  const [facilities, setFacilities] = useState<string[]>(editing?.facilities ?? []);
  const [facilityInput, setFacilityInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState(editing?.photoUrl ?? "");

  function addFacility() {
    const f = facilityInput.trim();
    if (f && !facilities.includes(f)) {
      setFacilities([...facilities, f]);
      setFacilityInput("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Edit Ruangan" : "Tambah Ruangan"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ruangan *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ruang 101"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gedung *</label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Ruangan</label>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lantai</label>
              <input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="1, 2, GF..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fasilitas</label>
            <div className="flex gap-2 mb-2">
              <input
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFacility(); } }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Proyektor, AC, Whiteboard..."
              />
              <button
                type="button"
                onClick={addFacility}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {facilities.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs">
                    {f}
                    <button type="button" onClick={() => setFacilities(facilities.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <PhotoUpload url={photoUrl} onChange={setPhotoUrl} label="Foto Ruangan" />
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={() => onSave({ name, roomNumber: roomNumber || undefined, buildingId, capacity, floor: floor || undefined, facilities, photoUrl: photoUrl || undefined })}
            disabled={!name || !buildingId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
