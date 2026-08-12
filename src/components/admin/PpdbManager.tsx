"use client";

import { useState, useEffect } from "react";
import {
  Search, ChevronLeft, ChevronRight, Eye, User, Phone, Mail,
  Calendar, MapPin, FileText, Check, X,
} from "lucide-react";

type Program = { id: string; name: string };
type Branch = { id: string; name: string; code: string };

type Registration = {
  id: string;
  registrationNo: string;
  fullName: string;
  status: string;
  whatsapp: string | null;
  email: string | null;
  createdAt: string;
  program: { name: string } | null;
  branch: { name: string; code: string } | null;
  documents: { id: string; isVerified: boolean; documentType: { name: string } }[];
  _count: { documents: number };
};

interface Props {
  programs: Program[];
  branches: Branch[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  WAITING_PAYMENT: "Menunggu Pembayaran",
  PAYMENT_VERIFIED: "Pembayaran Terverifikasi",
  ACCEPTED: "Diterima",
  CLASS_PLACEMENT: "Penempatan Kelas",
  ACTIVE_STUDENT: "Siswa Aktif",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  WAITING_VERIFICATION: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-cyan-100 text-cyan-700",
  WAITING_PAYMENT: "bg-orange-100 text-orange-700",
  PAYMENT_VERIFIED: "bg-teal-100 text-teal-700",
  ACCEPTED: "bg-green-100 text-green-700",
  CLASS_PLACEMENT: "bg-indigo-100 text-indigo-700",
  ACTIVE_STUDENT: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function PpdbManager({ programs, branches }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    branchId: "",
    programId: "",
    search: "",
  });

  useEffect(() => {
    async function fetchRegs() {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.branchId) params.set("branchId", filters.branchId);
      if (filters.programId) params.set("programId", filters.programId);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/admin/ppdb?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations);
        setTotal(data.total);
      }
      setLoading(false);
    }
    fetchRegs();
  }, [page, pageSize, filters]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              placeholder="Cari nama, nomor, WA..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filters.branchId}
          onChange={(e) => { setFilters({ ...filters, branchId: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={filters.programId}
          onChange={(e) => { setFilters({ ...filters, programId: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Memuat...</p>
        ) : registrations.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Belum ada pendaftaran</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {registrations.map((reg) => (
              <div key={reg.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-500">{reg.registrationNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[reg.status]}`}>
                      {STATUS_LABELS[reg.status]}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{reg.fullName}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    {reg.program && <span>{reg.program.name}</span>}
                    {reg.branch && <span>· {reg.branch.name}</span>}
                    {reg.whatsapp && <span>· {reg.whatsapp}</span>}
                    {reg._count.documents > 0 && (
                      <span className="flex items-center gap-1">
                        · <FileText className="w-3 h-3" /> {reg._count.documents} dok
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`/admin/ppdb/${reg.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye className="w-3 h-3" /> Detail
                </a>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-100 rounded-lg"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
