"use client";

import { useState } from "react";
import {
  User, Phone, Mail, Calendar, MapPin, FileText, Check, X,
  Clock, ArrowRight, UserCheck, Loader2, AlertCircle, Wallet,
  Copy, ExternalLink, CreditCard, GraduationCap,
} from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, getAllowedTransitions } from "@/lib/ppdb-status";

export type ClassOption = {
  id: string;
  name: string;
  subjectName: string;
  teacherName: string;
};

type Registration = {
  id: string;
  registrationNo: string;
  fullName: string;
  nik: string | null;
  birthPlace: string;
  birthDate: string;
  gender: string;
  schoolName: string | null;
  gradeLevel: string | null;
  address: string | null;
  whatsapp: string | null;
  email: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  parentJob: string | null;
  preferredScheduleNote: string | null;
  infoSource: string | null;
  referralCode: string | null;
  status: string;
  rejectionReason: string | null;
  adminNote: string | null;
  registrationFee: number | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  preferredClassId: string | null;
  convertedUserId: string | null;
  convertedAt: string | null;
  createdAt: string;
  program: { id: string; name: string; price: number } | null;
  branch: { id: string; name: string; code: string } | null;
  educationLevel: { id: string; name: string; code: string } | null;
  documents: {
    id: string;
    fileUrl: string;
    isVerified: boolean;
    note: string | null;
    documentType: { id: string; name: string; isRequired: boolean };
  }[];
  statusLogs: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    actorId: string | null;
    createdAt: string;
  }[];
};

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Belum Bayar", cls: "bg-gray-100 text-gray-600" },
  PENDING: { label: "Menunggu Konfirmasi", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Lunas", cls: "bg-green-100 text-green-700" },
};

export function PpdbDetail({ registration, classes = [] }: { registration: Registration; classes?: ClassOption[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [convertResult, setConvertResult] = useState<{
    studentEmail: string;
    tempPassword: string;
  } | null>(null);
  const [currentStatus, setCurrentStatus] = useState(registration.status);
  const [feeInput, setFeeInput] = useState(
    registration.registrationFee != null ? String(registration.registrationFee) : ""
  );
  const [paymentStatus, setPaymentStatus] = useState(registration.paymentStatus);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [classInput, setClassInput] = useState(registration.preferredClassId ?? "");
  const [copied, setCopied] = useState(false);

  const allowedTransitions = getAllowedTransitions(currentStatus as never);

  async function changeStatus(newStatus: string, note?: string, rejectionReason?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ppdb/${registration.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note, rejectionReason }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengubah status");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  }

  async function convertToStudent() {
    if (!confirm("Konversi calon siswa ini menjadi siswa aktif? Akun siswa, orang tua, dan invoice akan dibuat otomatis.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ppdb/${registration.id}/convert`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setConvertResult({
          studentEmail: data.studentEmail,
          tempPassword: data.tempPassword,
        });
        setCurrentStatus("ACTIVE_STUDENT");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal konversi");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  }

  async function verifyDocument(docId: string, isVerified: boolean) {
    const res = await fetch(
      `/api/admin/ppdb/${registration.id}/document/${docId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      }
    );
    if (res.ok) window.location.reload();
  }

  async function patchRegistration(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/ppdb/${registration.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function saveFee() {
    setLoading(true);
    setError("");
    const fee = feeInput.trim() === "" ? 0 : Number(feeInput);
    if (Number.isNaN(fee) || fee < 0) {
      setError("Biaya pendaftaran tidak valid");
      setLoading(false);
      return;
    }
    const { ok, data } = await patchRegistration({ registrationFee: fee });
    if (!ok) {
      setError(data.error || "Gagal menyimpan biaya");
    } else {
      window.location.reload();
    }
    setLoading(false);
  }

  async function saveClass() {
    setLoading(true);
    setError("");
    const { ok, data } = await patchRegistration({
      preferredClassId: classInput === "" ? null : classInput,
    });
    if (!ok) {
      setError(data.error || "Gagal menyimpan kelas tujuan");
    } else {
      window.location.reload();
    }
    setLoading(false);
  }

  async function createPaymentLink() {
    setLoading(true);
    setError("");
    setPaymentLink(null);
    try {
      const res = await fetch(`/api/payments/ppdb/${registration.id}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentLink(data.paymentUrl);
        setPaymentStatus("PENDING");
      } else {
        setError(data.error || "Gagal membuat link pembayaran");
      }
    } catch {
      setError("Terjadi kesalahan saat menghubungi payment gateway");
    }
    setLoading(false);
  }

  function copyPaymentLink() {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Info */}
      <div className="lg:col-span-2 space-y-4">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" /> Data Diri
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Nama" value={registration.fullName} />
            <InfoRow label="NIK" value={registration.nik} />
            <InfoRow label="Tempat Lahir" value={registration.birthPlace} />
            <InfoRow label="Tanggal Lahir" value={new Date(registration.birthDate).toLocaleDateString("id-ID")} />
            <InfoRow label="Jenis Kelamin" value={registration.gender === "L" ? "Laki-laki" : "Perempuan"} />
            <InfoRow label="Jenjang" value={registration.educationLevel?.name} />
            <InfoRow label="Asal Sekolah" value={registration.schoolName} />
            <InfoRow label="Kelas" value={registration.gradeLevel} />
            <InfoRow label="Alamat" value={registration.address} fullWidth />
            <InfoRow label="WhatsApp" value={registration.whatsapp} icon={<Phone className="w-3 h-3" />} />
            <InfoRow label="Email" value={registration.email} icon={<Mail className="w-3 h-3" />} />
          </div>
        </div>

        {/* Parent Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" /> Data Orang Tua
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Nama" value={registration.parentName} />
            <InfoRow label="No. HP" value={registration.parentPhone} />
            <InfoRow label="Email" value={registration.parentEmail} />
            <InfoRow label="Pekerjaan" value={registration.parentJob} />
            <InfoRow label="Catatan Jadwal" value={registration.preferredScheduleNote} fullWidth />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Dokumen ({registration.documents.length})
          </h2>
          {registration.documents.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada dokumen diunggah</p>
          ) : (
            <div className="space-y-2">
              {registration.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.documentType.name}</p>
                      {doc.note && <p className="text-xs text-gray-500">{doc.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Lihat
                    </a>
                    {doc.isVerified ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Terverifikasi
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyDocument(doc.id, true)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100"
                      >
                        Verifikasi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Riwayat Status
          </h2>
          <div className="space-y-2">
            {registration.statusLogs.map((log, i) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-600" : "bg-gray-300"}`} />
                  {i < registration.statusLogs.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {log.fromStatus ? STATUS_LABELS[log.fromStatus as keyof typeof STATUS_LABELS] : "Baru"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[log.toStatus as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[log.toStatus as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                  {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Status Saat Ini</h2>
          <div className={`text-center py-4 rounded-lg ${STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS]}`}>
            <p className="text-lg font-bold">{STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS]}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {convertResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Siswa Berhasil Dibuat!
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <p>Email: <span className="font-mono">{convertResult.studentEmail}</span></p>
                <p>Password: <span className="font-mono">{convertResult.tempPassword}</span></p>
              </div>
              <p className="text-xs text-green-600">Kirim kredensial ini ke siswa/orang tua.</p>
            </div>
          )}

          {allowedTransitions.length > 0 && !convertResult && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Aksi tersedia:</p>
              {allowedTransitions.map((target) => (
                <button
                  key={target}
                  onClick={() => {
                    if (target === "REJECTED") {
                      const reason = prompt("Alasan penolakan:");
                      if (reason) changeStatus(target, undefined, reason);
                    } else {
                      changeStatus(target);
                    }
                  }}
                  disabled={loading}
                  className={`w-full text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${STATUS_COLORS[target as keyof typeof STATUS_COLORS]} hover:opacity-80`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `→ ${STATUS_LABELS[target as keyof typeof STATUS_LABELS]}`}
                </button>
              ))}

              {(currentStatus === "ACCEPTED" || currentStatus === "CLASS_PLACEMENT") && (
                <button
                  onClick={convertToStudent}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-3"
                >
                  <UserCheck className="w-4 h-4" /> Konversi ke Siswa Aktif
                </button>
              )}
            </div>
          )}

          {currentStatus === "ACTIVE_STUDENT" && registration.convertedUserId && (
            <div className="text-center text-sm text-green-600">
              <Check className="w-5 h-5 mx-auto mb-1" />
              Sudah dikonversi menjadi siswa aktif
            </div>
          )}
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Biaya & Pembayaran
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status Pembayaran</span>
            {(() => {
              const badge = PAYMENT_BADGE[paymentStatus ?? "UNPAID"] ?? {
                label: paymentStatus ?? "Belum Bayar",
                cls: "bg-gray-100 text-gray-600",
              };
              return (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              );
            })()}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Biaya Pendaftaran (Rp)</label>
              <input
                type="number"
                min={0}
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                placeholder="0"
                disabled={paymentStatus === "PAID"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <button
              onClick={saveFee}
              disabled={loading || paymentStatus === "PAID"}
              className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
          {paymentStatus !== "PAID" && (
            <div className="space-y-2">
              <button
                onClick={createPaymentLink}
                disabled={loading || !registration.registrationFee}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Buat Link Pembayaran (Duitku)
              </button>
              {!registration.registrationFee && (
                <p className="text-xs text-gray-500">
                  Simpan biaya pendaftaran (≥ 1) dulu sebelum membuat link pembayaran.
                </p>
              )}
              {paymentLink && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-indigo-700 break-all">{paymentLink}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPaymentLink}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Tersalin" : "Salin Link"}
                    </button>
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka
                    </a>
                  </div>
                  <p className="text-xs text-indigo-500">
                    Kirim link ini ke pendaftar via WhatsApp. Status berubah otomatis saat pembayaran berhasil (webhook Duitku).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preferred Class Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Kelas Tujuan
          </h2>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Tidak ada kelas aktif yang cocok. Buat kelas dulu di menu Kelas.
            </p>
          ) : (
            <>
              <select
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Belum dipilih —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.subjectName} ({c.teacherName})
                  </option>
                ))}
              </select>
              <button
                onClick={saveClass}
                disabled={loading || classInput === (registration.preferredClassId ?? "")}
                className="w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Simpan Kelas Tujuan
              </button>
              <p className="text-xs text-gray-500">
                Siswa akan otomatis terdaftar di kelas ini saat dikonversi menjadi siswa aktif.
              </p>
            </>
          )}
        </div>

        {/* Registration Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900">Info Pendaftaran</h2>
          <InfoRow label="Program" value={registration.program?.name} />
          <InfoRow label="Cabang" value={registration.branch?.name} />
          <InfoRow label="Harga Program" value={registration.program ? `Rp ${registration.program.price.toLocaleString("id-ID")}` : null} />
          <InfoRow label="Kode Referral" value={registration.referralCode} />
          <InfoRow label="Info Source" value={registration.infoSource} />
          <InfoRow label="Tanggal Daftar" value={new Date(registration.createdAt).toLocaleString("id-ID")} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  fullWidth,
  icon,
}: {
  label: string;
  value?: string | null;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 flex items-center gap-1">
        {icon}
        {value || <span className="text-gray-500">—</span>}
      </p>
    </div>
  );
}
