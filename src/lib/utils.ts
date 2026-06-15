import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    GURU: "Guru",
    SISWA: "Siswa",
    ORANG_TUA: "Orang Tua",
  };
  return labels[role] ?? role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "text-red-600 bg-red-50",
    ADMIN: "text-orange-600 bg-orange-50",
    GURU: "text-yellow-600 bg-yellow-50",
    SISWA: "text-green-600 bg-green-50",
    ORANG_TUA: "text-blue-600 bg-blue-50",
  };
  return colors[role] ?? "text-gray-600 bg-gray-50";
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    BASIC: "text-gray-600 bg-gray-100",
    STANDARD: "text-blue-600 bg-blue-100",
    PREMIUM: "text-purple-600 bg-purple-100",
  };
  return colors[tier] ?? "text-gray-600 bg-gray-100";
}

export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    BASIC: "Basic",
    STANDARD: "Standard",
    PREMIUM: "Premium",
  };
  return labels[tier] ?? tier;
}

export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    SENIN: "Senin",
    SELASA: "Selasa",
    RABU: "Rabu",
    KAMIS: "Kamis",
    JUMAT: "Jumat",
    SABTU: "Sabtu",
    MINGGU: "Minggu",
  };
  return labels[day] ?? day;
}

export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    HADIR: "Hadir",
    SAKIT: "Sakit",
    IZIN: "Izin",
    ALPHA: "Alpha",
  };
  return labels[status] ?? status;
}

export function getAttendanceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    HADIR: "text-green-700 bg-green-100",
    SAKIT: "text-yellow-700 bg-yellow-100",
    IZIN: "text-blue-700 bg-blue-100",
    ALPHA: "text-red-700 bg-red-100",
  };
  return colors[status] ?? "text-gray-700 bg-gray-100";
}

export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: "Belum Dibayar",
    PAID: "Lunas",
    OVERDUE: "Jatuh Tempo",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] ?? status;
}

export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNPAID: "text-yellow-700 bg-yellow-100",
    PAID: "text-green-700 bg-green-100",
    OVERDUE: "text-red-700 bg-red-100",
    CANCELLED: "text-gray-700 bg-gray-100",
  };
  return colors[status] ?? "text-gray-700 bg-gray-100";
}
