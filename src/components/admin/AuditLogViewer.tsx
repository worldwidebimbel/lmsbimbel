"use client";

import { useState, useEffect } from "react";
import { ScrollText, Search, ChevronLeft, ChevronRight } from "lucide-react";

type AuditLog = {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (entityFilter) params.set("entity", entityFilter);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [page, pageSize, entityFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    VERIFY: "bg-purple-100 text-purple-700",
    APPROVE: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
        <Search className="w-4 h-4 text-gray-500" />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="text-sm border-none outline-none bg-transparent"
        >
          <option value="">Semua entitas</option>
          <option value="Program">Program</option>
          <option value="Invoice">Invoice</option>
          <option value="Payment">Payment</option>
          <option value="Grade">Grade</option>
          <option value="Schedule">Schedule</option>
          <option value="User">User</option>
          <option value="ClassStudent">ClassStudent</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{total} log</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Memuat...</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Belum ada audit log</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      actionColors[log.action] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{log.entity}</span>
                  <span className="text-xs text-gray-500 font-mono">{log.entityId.slice(0, 8)}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <ScrollText className="w-3 h-3" />
                  oleh <span className="font-medium text-gray-700">{log.actorName}</span>
                  {log.ipAddress && <span>· {log.ipAddress}</span>}
                </div>
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
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
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
