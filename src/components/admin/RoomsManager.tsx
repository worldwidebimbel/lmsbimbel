"use client";

import { useState } from "react";
import { DoorOpen, Building2, Plus, Pencil, Trash2, X, Users } from "lucide-react";

type Building = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { rooms: number };
};

type Room = {
  id: string;
  name: string;
  roomNumber: string | null;
  capacity: number;
  floor: string | null;
  isActive: boolean;
  building: { id: string; name: string };
  _count: { classes: number; schedules: number };
};

interface Props {
  initialBuildings: Building[];
  initialRooms: Room[];
}

export function RoomsManager({ initialBuildings, initialRooms }: Props) {
  const [buildings, setBuildings] = useState(initialBuildings);
  const [rooms, setRooms] = useState(initialRooms);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  async function addBuilding(name: string) {
    const res = await fetch("/api/admin/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const created = await res.json();
      setBuildings((prev) => [...prev, { ...created, _count: { rooms: 0 } }]);
      setShowBuildingForm(false);
    }
  }

  async function addRoom(data: Record<string, unknown>) {
    if (editingRoom) {
      const res = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? { ...updated, building: editingRoom.building, _count: editingRoom._count } : r)));
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
        const building = buildings.find((b) => b.id === data.buildingId);
        setRooms((prev) => [...prev, { ...created, building: { id: building?.id ?? "", name: building?.name ?? "" }, _count: { classes: 0, schedules: 0 } }]);
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
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Gedung</h2>
            <button
              onClick={() => setShowBuildingForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3 h-3" /> Gedung
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {buildings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{b.name}</span>
                </div>
                <span className="text-xs text-gray-500">{b._count.rooms} ruang</span>
              </div>
            ))}
            {buildings.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center">Belum ada gedung</p>
            )}
          </div>

          {showBuildingForm && (
            <InlineForm
              placeholder="Nama gedung"
              onSubmit={addBuilding}
              onClose={() => setShowBuildingForm(false)}
            />
          )}
        </div>

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
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-gray-400" />
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
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r._count.classes} kelas</span>
                </div>

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
            ))}
          </div>

          {showRoomForm && (
            <RoomForm
              editing={editingRoom}
              buildings={buildings}
              onSave={addRoom}
              onClose={() => { setShowRoomForm(false); setEditingRoom(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InlineForm({
  placeholder,
  onSubmit,
  onClose,
}: {
  placeholder: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => { if (e.key === "Enter" && value) { onSubmit(value); setValue(""); } }}
      />
      <button
        onClick={() => { if (value) { onSubmit(value); setValue(""); } }}
        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
      >
        OK
      </button>
      <button onClick={onClose} className="px-3 py-2 text-gray-400">
        <X className="w-4 h-4" />
      </button>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
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
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={() => onSave({ name, roomNumber: roomNumber || undefined, buildingId, capacity, floor: floor || undefined })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
