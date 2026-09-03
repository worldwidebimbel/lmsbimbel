"use client";

import { useState, useEffect } from "react";
import {
  User, Users, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Upload, Loader2, Check, X,
} from "lucide-react";
import { registrationSchema } from "@/lib/ppdb-validation";

type Program = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  branchIds: string[];
};

type Branch = { id: string; name: string; code: string; address: string | null };
type EducationLevel = { id: string; name: string; code: string };
type DocumentType = {
  id: string;
  name: string;
  isRequired: boolean;
  maxSizeMb: number;
  allowedTypes: string[];
};

interface Props {
  programs: Program[];
  branches: Branch[];
  educationLevels: EducationLevel[];
  documentTypes: DocumentType[];
  preselectedProgramId?: string;
  referralCode: string | null;
}

const STEPS = ["Program", "Data Diri", "Orang Tua", "Dokumen", "Review"];

export function RegistrationForm({
  programs,
  branches,
  educationLevels,
  documentTypes,
  preselectedProgramId,
  referralCode,
}: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ registrationNo: string } | null>(null);

  const [data, setData] = useState({
    programId: preselectedProgramId || "",
    branchId: "",
    educationLevelId: "",
    fullName: "",
    nik: "",
    birthPlace: "",
    birthDate: "",
    gender: "L" as "L" | "P",
    schoolName: "",
    gradeLevel: "",
    address: "",
    whatsapp: "",
    email: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    parentJob: "",
    preferredScheduleNote: "",
    infoSource: "",
    referralCode: referralCode || "",
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateStep(currentStep: number): boolean {
    setFieldErrors({});
    const partial = { ...data, documentTypeIds: Object.keys(uploadedDocs) };
    const result = registrationSchema.safeParse(partial);
    if (result.success) return true;
    const errors: Record<string, string> = {};
    for (const err of result.error.errors) {
      const field = err.path[0] as string;
      if (!errors[field]) errors[field] = err.message;
    }
    if (currentStep === 0) {
      if (!data.programId) errors.programId = "Program wajib dipilih";
      if (!data.branchId) errors.branchId = "Cabang wajib dipilih";
    }
    if (currentStep === 1) {
      if (!data.fullName) errors.fullName = "Nama lengkap wajib diisi";
      if (!data.birthPlace) errors.birthPlace = "Tempat lahir wajib diisi";
      if (!data.birthDate) errors.birthDate = "Tanggal lahir wajib diisi";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  useEffect(() => {
    const saved = localStorage.getItem("ppdb-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ppdb-draft", JSON.stringify(data));
  }, [data]);

  const availableBranches = data.programId
    ? branches.filter((b) =>
        programs.find((p) => p.id === data.programId)?.branchIds.includes(b.id)
      )
    : branches;

  function next() {
    if (validateStep(step) && step < STEPS.length - 1) setStep(step + 1);
  }
  function prev() {
    setFieldErrors({});
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    if (!validateStep(step)) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/ppdb/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          documentTypeIds: Object.keys(uploadedDocs),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess({ registrationNo: result.registrationNo });
        localStorage.removeItem("ppdb-draft");
      } else if (result.details) {
        const errors: Record<string, string> = {};
        for (const detail of result.details) {
          const field = detail.path[0] as string;
          if (!errors[field]) errors[field] = detail.message;
        }
        setFieldErrors(errors);
        setError(result.error || "Validasi gagal");
      } else {
        setError(result.error || "Gagal mendaftar");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Pendaftaran Berhasil!</h2>
        <p className="text-gray-600">Nomor pendaftaran Anda:</p>
        <p className="text-3xl font-bold text-blue-600 tracking-wider">
          {success.registrationNo}
        </p>
        <p className="text-sm text-gray-500">
          Simpan nomor ini untuk cek status pendaftaran Anda.
          Admin akan menghubungi Anda dalam 1-2 hari kerja.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <a
            href="/daftar/status"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Cek Status
          </a>
          <a
            href="/"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i <= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i <= step ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Step 0: Program */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Pilih Program & Cabang</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setData({ ...data, programId: p.id })}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  data.programId === p.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                )}
                {p.price > 0 && (
                  <p className="text-sm text-blue-600 font-medium mt-2">
                    Rp {p.price.toLocaleString("id-ID")}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
            <select
              value={data.branchId}
              onChange={(e) => setData({ ...data, branchId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${fieldErrors.branchId ? "border-red-400" : "border-gray-300"}`}
            >
              <option value="">Pilih cabang...</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {fieldErrors.branchId && <p className="text-xs text-red-500 mt-1">{fieldErrors.branchId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang Pendidikan</label>
            <select
              value={data.educationLevelId}
              onChange={(e) => setData({ ...data, educationLevelId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih jenjang...</option>
              {educationLevels.map((el) => (
                <option key={el.id} value={el.id}>{el.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 1: Data Diri */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Data Diri Calon Siswa</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${fieldErrors.fullName ? "border-red-400" : "border-gray-300"}`}
                placeholder="Nama sesuai dokumen"
              />
              {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
              <input
                value={data.nik}
                onChange={(e) => setData({ ...data, nik: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="16 digit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin *</label>
              <select
                value={data.gender}
                onChange={(e) => setData({ ...data, gender: e.target.value as "L" | "P" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir *</label>
              <input
                value={data.birthPlace}
                onChange={(e) => setData({ ...data, birthPlace: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${fieldErrors.birthPlace ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.birthPlace && <p className="text-xs text-red-500 mt-1">{fieldErrors.birthPlace}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                value={data.birthDate}
                onChange={(e) => setData({ ...data, birthDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${fieldErrors.birthDate ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.birthDate && <p className="text-xs text-red-500 mt-1">{fieldErrors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
              <input
                value={data.schoolName}
                onChange={(e) => setData({ ...data, schoolName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <input
                value={data.gradeLevel}
                onChange={(e) => setData({ ...data, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Mis. Kelas 6, Kelas 9, Kelas 12"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                value={data.whatsapp}
                onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Orang Tua */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Data Orang Tua / Wali</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
              <input
                value={data.parentName}
                onChange={(e) => setData({ ...data, parentName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Orang Tua</label>
              <input
                value={data.parentPhone}
                onChange={(e) => setData({ ...data, parentPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Orang Tua</label>
              <input
                type="email"
                value={data.parentEmail}
                onChange={(e) => setData({ ...data, parentEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Orang Tua</label>
              <input
                value={data.parentJob}
                onChange={(e) => setData({ ...data, parentJob: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Jadwal yang Diinginkan</label>
              <input
                value={data.preferredScheduleNote}
                onChange={(e) => setData({ ...data, preferredScheduleNote: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Mis. Senin-Rabu-Jumat sore"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Dokumen */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Upload Dokumen</h3>
          {documentTypes.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada dokumen yang diperlukan saat ini.</p>
          ) : (
            <div className="space-y-3">
              {documentTypes.map((dt) => (
                <div key={dt.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{dt.name}</p>
                      <p className="text-xs text-gray-500">
                        {dt.isRequired ? "Wajib" : "Opsional"} · Maks {dt.maxSizeMb}MB · {dt.allowedTypes.join(", ")}
                      </p>
                    </div>
                    {uploadedDocs[dt.id] && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Terunggah
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={dt.allowedTypes.map((t) => `.${t}`).join(",")}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDocId(dt.id);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("documentTypeId", dt.id);
                        const res = await fetch("/api/ppdb/upload", {
                          method: "POST",
                          body: fd,
                        });
                        const result = await res.json();
                        if (res.ok) {
                          setUploadedDocs({ ...uploadedDocs, [dt.id]: result.url });
                        } else {
                          setError(result.error || "Upload gagal");
                        }
                      } catch {
                        setError("Gagal mengunggah file");
                      }
                      setUploadingDocId(null);
                    }}
                    disabled={uploadingDocId === dt.id}
                    className="text-sm"
                  />
                  {uploadingDocId === dt.id && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Review & Konfirmasi</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><span className="font-medium">Program:</span> {programs.find((p) => p.id === data.programId)?.name}</p>
              <p><span className="font-medium">Cabang:</span> {branches.find((b) => b.id === data.branchId)?.name}</p>
              <p><span className="font-medium">Nama:</span> {data.fullName}</p>
              <p><span className="font-medium">Tempat/Tanggal Lahir:</span> {data.birthPlace}, {data.birthDate}</p>
              <p><span className="font-medium">WhatsApp:</span> {data.whatsapp}</p>
              <p><span className="font-medium">Orang Tua:</span> {data.parentName} ({data.parentPhone})</p>
              {data.referralCode && (
                <p><span className="font-medium">Kode Referral:</span> {data.referralCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Darimana Anda tahu tentang kami?</label>
              <select
                value={data.infoSource}
                onChange={(e) => setData({ ...data, infoSource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih...</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="teman">Teman/Saudara</option>
                <option value="afiliator">Afiliator/Referral</option>
                <option value="brosur">Brosur/Spanduk</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {data.referralCode === "" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Referral (opsional)</label>
                <input
                  value={data.referralCode}
                  onChange={(e) => setData({ ...data, referralCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="WW-NAMA01"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={step === 0 && (!data.programId || !data.branchId)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !data.fullName || !data.birthPlace || !data.birthDate}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Kirim Pendaftaran
          </button>
        )}
      </div>
    </div>
  );
}
