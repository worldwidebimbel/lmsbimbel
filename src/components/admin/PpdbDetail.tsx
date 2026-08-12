"use client";

import { useState } from "react";
import {
  User, Phone, Mail, Calendar, MapPin, FileText, Check, X,
  Clock, ArrowRight, UserCheck, Loader2, AlertCircle,
} from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, getAllowedTransitions } from "@/lib/ppdb-status";

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

export function PpdbDetail({ registration }: { registration: Registration }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [convertResult, setConvertResult] = useState<{
    studentEmail: string;
    tempPassword: string;
  } | null>(null);
  const [currentStatus, setCurrentStatus] = useState(registration.status);

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
                    <FileText className="w-4 h-4 text-gray-400" />
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
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[log.toStatus as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[log.toStatus as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                  {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
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
        {value || <span className="text-gray-400">—</span>}
      </p>
    </div>
  );
}
