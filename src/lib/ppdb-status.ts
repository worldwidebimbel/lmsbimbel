import { RegistrationStatus } from "@prisma/client";

const TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["WAITING_VERIFICATION", "REJECTED", "CANCELLED"],
  WAITING_VERIFICATION: ["VERIFIED", "REJECTED", "SUBMITTED", "CANCELLED"],
  VERIFIED: ["WAITING_PAYMENT", "REJECTED", "CANCELLED"],
  WAITING_PAYMENT: ["PAYMENT_VERIFIED", "CANCELLED", "VERIFIED"],
  PAYMENT_VERIFIED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["CLASS_PLACEMENT", "CANCELLED"],
  CLASS_PLACEMENT: ["ACTIVE_STUDENT", "CANCELLED"],
  ACTIVE_STUDENT: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(
  from: RegistrationStatus,
  to: RegistrationStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(
  from: RegistrationStatus
): RegistrationStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminalStatus(
  status: RegistrationStatus
): boolean {
  return TRANSITIONS[status].length === 0;
}

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
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

export const STATUS_COLORS: Record<RegistrationStatus, string> = {
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
