"use client";

import { useState, useCallback } from "react";
import { FileUp, Download, X, Loader2, CheckCircle, AlertCircle, StopCircle } from "lucide-react";

interface ImportRow {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  school?: string;
  gradeLevel?: string;
}

interface ImportResult {
  row: number;
  status: "ok" | "error" | "skip";
  message?: string;
  name?: string;
}

export default function SiswaImportClient() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<{ inserted: number; total: number; skipped: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("siswa123");

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Hanya file Excel (.xlsx / .xls) yang diterima.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const ExcelJS = (await import("exceljs")).default;
      const arrayBuffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(arrayBuffer);

      const sheet = wb.worksheets.find((ws) => ws.name !== "PETUNJUK") ?? wb.worksheets[0];
      if (!sheet) {
        setError("Tidak ada sheet data ditemukan.");
        setLoading(false);
        return;
      }

      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim();
      });

      const parsed: ImportRow[] = [];
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const obj: Record<string, string> = {};
        let hasData = false;
        headers.forEach((header, idx) => {
          if (!header) return;
          const cell = row.getCell(idx + 1);
          const val = cell.value === null || cell.value === undefined ? "" : String(cell.value);
          obj[header] = val;
          if (val !== "") hasData = true;
        });
        if (hasData && obj.name && obj.email) {
          parsed.push({
            name: obj.name,
            email: obj.email,
            phone: obj.phone,
            gender: obj.gender,
            birthDate: obj.birthDate,
            address: obj.address,
            school: obj.school,
            gradeLevel: obj.gradeLevel,
          });
        }
      }

      setRows(parsed);
    } catch {
      setError("Gagal membaca file Excel.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/siswa/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, defaultPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal import");
      } else {
        setResults(data.results);
        setSummary({ inserted: data.inserted, total: data.total, skipped: data.skipped, errors: data.errors });
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setRows([]);
    setResults(null);
    setSummary(null);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        <FileUp className="h-4 w-4" /> Import Siswa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Import Data Siswa</h2>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{summary.inserted}</p>
                  <p className="text-xs text-green-600">Berhasil</p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                  <p className="text-xl font-bold text-yellow-700">{summary.skipped}</p>
                  <p className="text-xs text-yellow-600">Skip</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xl font-bold text-red-700">{summary.errors}</p>
                  <p className="text-xs text-red-600">Error</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{summary.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Template Download */}
            {rows.length === 0 && !results && (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                  <p className="font-semibold mb-1">Cara Import:</p>
                  <p>1. Download template Excel di bawah</p>
                  <p>2. Isi data siswa di sheet SISWA</p>
                  <p>3. Upload file Excel yang sudah diisi</p>
                  <p>4. Preview data, lalu klik Import</p>
                </div>

                <a
                  href="/api/admin/siswa/import"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" /> Download Template Excel
                </a>

                <div className="text-center text-xs text-gray-400">— atau upload file Excel —</div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 hover:bg-gray-50">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Membaca file...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-5 w-5" /> Klik untuk upload .xlsx
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Preview Rows */}
            {rows.length > 0 && !results && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{rows.length} siswa siap diimport</p>
                  <button onClick={() => setRows([])} className="text-xs text-gray-500 hover:underline">Reset</button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Nama</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Email</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-800">{r.name}</td>
                          <td className="px-2 py-1.5 text-gray-600">{r.email}</td>
                          <td className="px-2 py-1.5 text-gray-500">{r.phone ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Password Default</label>
                  <input
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Import {rows.length} Siswa
                </button>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-3">
                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                      {r.status === "ok" && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                      {r.status === "skip" && <StopCircle className="h-4 w-4 text-yellow-600 shrink-0" />}
                      {r.status === "error" && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                      <span className="text-gray-800">{r.name ?? `Baris ${r.row}`}</span>
                      {r.message && <span className="text-xs text-gray-500 ml-auto">{r.message}</span>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => window.location.reload()} className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Selesai
                  </button>
                  <button onClick={handleClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
