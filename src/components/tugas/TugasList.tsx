"use client";

import { useState } from "react";
import { format, isPast } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ClipboardList, Plus, Search, Pencil, Trash2, Users,
  Clock, Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { AssignmentItem, AssignmentClass } from "./types";
import TugasModal from "./TugasModal";
import Link from "next/link";

interface TugasListProps {
  initialAssignments: AssignmentItem[];
  classes: AssignmentClass[];
}

export default function TugasList({ initialAssignments, classes }: TugasListProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AssignmentItem | null>(null);

  const filtered = assignments.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || a.classId === filterClass;
    return matchSearch && matchClass;
  });

  function handleSaved(item: AssignmentItem) {
    setAssignments((prev) => {
      const exists = prev.find((a) => a.id === item.id);
      if (exists) return prev.map((a) => (a.id === item.id ? item : a));
      return [item, ...prev];
    });
  }

  async function handleTogglePublish(item: AssignmentItem) {
    const res = await fetch(`/api/tugas/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !item.isPublished }),
    });
    if (res.ok) {
      const updated: AssignmentItem = await res.json();
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus tugas ini? Semua submission akan ikut terhapus.")) return;
    const res = await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    if (res.ok) setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  function openCreate() {
    setEditItem(null);
    setShowModal(true);
  }

  function openEdit(item: AssignmentItem) {
    setEditItem(item);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Buat Tugas
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <ClipboardList className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada tugas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const overdue = isPast(new Date(assignment.dueDate));
            return (
              <div
                key={assignment.id}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors"
              >
                <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${overdue ? "bg-red-100" : "bg-blue-100"}`}>
                  <ClipboardList className={`h-5 w-5 ${overdue ? "text-red-600" : "text-blue-600"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{assignment.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{assignment.class?.name}</p>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${assignment.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {assignment.isPublished ? "Aktif" : "Draft"}
                    </span>
                  </div>

                  {assignment.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {overdue ? "Lewat deadline: " : "Deadline: "}
                      {format(new Date(assignment.dueDate), "d MMM yyyy, HH:mm", { locale: localeId })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {assignment._count?.submissions ?? 0} submission
                    </span>
                    <span>Nilai maks: {assignment.maxScore}</span>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  {assignment.fileUrl && (
                    <a
                      href={assignment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                      title="Buka file soal"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    href={`/guru/tugas/${assignment.id}`}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-green-600"
                    title="Lihat submissions"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(assignment)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-yellow-600"
                    title={assignment.isPublished ? "Sembunyikan" : "Publikasikan"}
                  >
                    {assignment.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(assignment)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TugasModal
          classes={classes}
          editItem={editItem}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
