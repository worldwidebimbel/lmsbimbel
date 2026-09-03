"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  PAYMENT: CheckCircle,
  ASSIGNMENT: Info,
  GRADE: CheckCircle,
  ATTENDANCE: Info,
};

const TYPE_COLOR: Record<string, string> = {
  INFO: "text-blue-500",
  SUCCESS: "text-green-500",
  WARNING: "text-yellow-500",
  ERROR: "text-red-500",
  PAYMENT: "text-orange-500",
  ASSIGNMENT: "text-purple-500",
  GRADE: "text-green-500",
  ATTENDANCE: "text-blue-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/notifications?unread=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  }

  async function handleOpen() {
    if (!open) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  }

  async function markAllRead() {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="font-semibold text-sm text-gray-900">Notifikasi</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? "text-blue-500";
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.content}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                      </p>
                    </div>
                    {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              href="/notifikasi"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-blue-600 hover:text-blue-800 py-1"
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
