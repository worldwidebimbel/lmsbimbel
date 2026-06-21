"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, AlertTriangle, Loader2, Download } from "lucide-react";

interface Subject { id: string; name: string }

interface PreviewRow {
  rowNum: number;
  tipe: string;
  soal: string;
  opsi_a?: string; opsi_b?: string; opsi_c?: string; opsi_d?: string; opsi_e?: string;
  soal_image_url?: string;
  kunci_jawaban?: string;
  pembahasan?: string;
  bobot?: number;
  kesulitan?: number;
  tags?: string;
  status: "ok" | "error" | "warn";
  message?: string;
  raw: Record<string, string>;
}

const VALID_TYPES = ["PILGAN", "PILGAN_KOMPLEK", "BENAR_SALAH", "ESSAY", "ISIAN"];
const DIFF_LABEL: Record<number, string> = { 1: "Mudah", 2: "Sedang", 3: "Sulit" };

function validateRow(raw: Record<string, string>, idx: number): PreviewRow {
  const tipe = (raw.tipe ?? "").trim().toUpperCase();
  const soal = (raw.soal ?? "").trim();
  const kunci = (raw.kunci_jawaban ?? "").trim();

  const base: Omit<PreviewRow, "status" | "message"> = {
    rowNum: idx + 1,
    tipe,
    soal,
    opsi_a: raw.opsi_a,
    opsi_b: raw.opsi_b,
    opsi_c: raw.opsi_c,
    opsi_d: raw.opsi_d,
    opsi_e: raw.opsi_e,
    soal_image_url: raw.soal_image_url,
    kunci_jawaban: kunci,
    pembahasan: raw.pembahasan,
    bobot: raw.bobot ? Number(raw.bobot) : 1,
    kesulitan: raw.kesulitan ? Number(raw.kesulitan) : 2,
    tags: raw.tags,
    raw,
  };

  if (!VALID_TYPES.includes(tipe)) {
    return { ...base, status: "error", message: `Tipe tidak valid: "${raw.tipe || "(kosong)"}"` };
  }
  if (!soal) {
    return { ...base, status: "error", message: "Soal wajib diisi" };
  }
  if (["PILGAN", "PILGAN_KOMPLEK", "BENAR_SALAH", "ISIAN"].includes(tipe) && !kunci) {
    return { ...base, status: "error", message: `kunci_jawaban wajib untuk ${tipe}` };
  }
  if ((tipe === "PILGAN" || tipe === "PILGAN_KOMPLEK") && !raw.opsi_a && !raw.opsi_b) {
    return { ...base, status: "error", message: "PILGAN butuh minimal 2 opsi (opsi_a & opsi_b)" };
  }
  if (tipe === "PILGAN") {
    const labels = ["A", "B", "C", "D", "E"];
    if (!labels.includes(kunci.toUpperCase())) {
      return { ...base, status: "warn", message: `kunci "${kunci}" bukan A–E. Pastikan sesuai huruf opsi.` };
    }
  }
  return { ...base, status: "ok" };
}

export default function BankSoalImportClient({
  subjects,
  subjectId,
  onDone,
}: {
  subjects: Subject[];
  subjectId?: string;
  onDone: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(subjectId ?? "");
  const [result, setResult] = useState<{ inserted: number; errors: number; results: { row: number; status: string; message?: string }[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Hanya file Excel (.xlsx / .xls) yang diterima.");
      return;
    }
    setLoading(true);

    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = wb.SheetNames.find((n) => n !== "PETUNJUK") ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const jsonRaw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
      raw: false,
      defval: "",
    }) as Record<string, string>[];

    const headerRow: Record<string, string> = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      range: 0,
      raw: false,
    })[0] as Record<string, string>;

    let data = jsonRaw;
    if (headerRow && Object.values(headerRow).some((v) => String(v).includes("petunjuk") || String(v).includes("PETUNJUK"))) {
      data = jsonRaw.slice(1);
    }

    const parsed = data
      .filter((r) => Object.values(r).some((v) => v !== ""))
      .map((r, i) => validateRow(r, i));

    setRows(parsed);
    setStep("preview");
    setLoading(false);
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.status !== "error");
    if (validRows.length === 0) return;
    setLoading(true);

    const payload = validRows.map((r) => r.raw);
    const res = await fetch("/api/guru/bank-soal/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: payload, subjectId: selectedSubject || null }),
    });

    const data = await res.json();
    setResult(data);
    setStep("result");
    setLoading(false);
    if (data.inserted > 0) onDone(data.inserted);
  }

  const errorCount = rows.filter((r) => r.status === "error").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;
  const okCount = rows.filter((r) => r.status === "ok").length;

  return (
    <div className="space-y-5">
      {step === "upload" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Import Soal dari Excel</h3>
              <p className="text-sm text-gray-500 mt-0.5">Upload file .xlsx sesuai template. Preview & validasi sebelum import.</p>
            </div>
            <a
              href="/api/guru/bank-soal/template"
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              <Download className="h-4 w-4" /> Download Template
            </a>
          </div>

          <div
            className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer ${dragOver ? "border-amber-400 bg-amber-50" : "border-gray-300 hover:border-amber-400"}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              {loading ? (
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 text-gray-400" />
              )}
              <p className="text-sm text-gray-600">{loading ? "Membaca file..." : "Drag & drop file Excel ke sini, atau klik untuk pilih"}</p>
              <p className="text-xs text-gray-400">Format: .xlsx atau .xls</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Tips Format Excel:</p>
            <p>• <strong>LaTeX:</strong> tulis formula di dalam tanda $…$. Contoh: <code>{"$\\frac{x}{y}$"}</code></p>
            <p>• <strong>Arab/Al-Quran:</strong> paste teks Arab langsung — akan dirender dengan font Amiri</p>
            <p>• <strong>Aksara Jawa:</strong> paste Unicode Hanacaraka langsung — font Noto Serif Javanese</p>
            <p>• <strong>Gambar:</strong> isi kolom <em>*_image_url</em> dengan URL publik gambar</p>
            <p>• Baris petunjuk (baris 1 & 2 template) diabaikan otomatis</p>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Preview — {rows.length} baris ditemukan</h3>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> {okCount} valid</span>
                {warnCount > 0 && <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {warnCount} perlu cek</span>}
                {errorCount > 0 && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errorCount} error (akan dilewati)</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setStep("upload"); setRows([]); }} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                <X className="h-4 w-4" /> Batal
              </button>
              <button
                onClick={handleImport}
                disabled={loading || (okCount + warnCount) === 0}
                className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {okCount + warnCount} Soal
              </button>
            </div>
          </div>

          {subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 shrink-0">Mapel untuk soal tanpa mapel:</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500">
                <option value="">— Tidak ditentukan —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-8">#</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-28">Tipe</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Soal</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Opsi (A–E)</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-20">Kunci</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-16">Skor</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-16">Tingkat</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Tags</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNum} className={`border-b border-gray-100 last:border-0 ${row.status === "error" ? "bg-red-50" : row.status === "warn" ? "bg-yellow-50" : "bg-white"}`}>
                    <td className="px-3 py-2 text-gray-400">{row.rowNum}</td>
                    <td className="px-3 py-2">
                      {row.status === "ok" && <span className="inline-flex items-center gap-1 text-green-700 font-medium"><CheckCircle className="h-3.5 w-3.5" />OK</span>}
                      {row.status === "warn" && (
                        <span className="inline-flex items-center gap-1 text-yellow-700 font-medium" title={row.message}>
                          <AlertTriangle className="h-3.5 w-3.5" />Cek
                        </span>
                      )}
                      {row.status === "error" && (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium" title={row.message}>
                          <AlertCircle className="h-3.5 w-3.5" />Error
                        </span>
                      )}
                      {row.message && (
                        <div className={`text-xs mt-0.5 ${row.status === "error" ? "text-red-600" : "text-yellow-600"}`}>{row.message}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">{row.tipe}</span>
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <p className="truncate text-gray-900">{row.soal}</p>
                      {row.soal_image_url && <p className="text-indigo-500 text-xs truncate mt-0.5">🖼 {row.soal_image_url}</p>}
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-[160px]">
                      <div className="space-y-0.5">
                        {["opsi_a", "opsi_b", "opsi_c", "opsi_d", "opsi_e"].map((key, i) => {
                          const val = row[key as keyof PreviewRow] as string | undefined;
                          return val ? <div key={key} className="truncate"><span className="font-medium">{String.fromCharCode(65+i)}.</span> {val}</div> : null;
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{row.kunci_jawaban}</td>
                    <td className="px-3 py-2 text-gray-600">{row.bobot ?? 1}</td>
                    <td className="px-3 py-2 text-gray-600">{DIFF_LABEL[row.kesulitan ?? 2] ?? "Sedang"}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{row.tags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-5 ${result.errors === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-8 w-8 ${result.errors === 0 ? "text-green-500" : "text-yellow-500"}`} />
              <div>
                <p className="font-bold text-gray-900 text-lg">{result.inserted} soal berhasil diimport</p>
                {result.errors > 0 && <p className="text-sm text-gray-600">{result.errors} baris dilewati karena error</p>}
              </div>
            </div>
          </div>

          {result.errors > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700 mb-2">Baris yang gagal:</p>
              <div className="space-y-1">
                {result.results.filter((r) => r.status === "error").map((r) => (
                  <p key={r.row} className="text-sm text-red-600">Baris {r.row}: {r.message}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setStep("upload"); setRows([]); setResult(null); }}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" /> Import File Lain
          </button>
        </div>
      )}
    </div>
  );
}
