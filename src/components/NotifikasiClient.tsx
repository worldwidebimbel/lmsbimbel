"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

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
  INFO: "text-blue-500 bg-blue-50",
  SUCCESS: "text-green-600 bg-green-50",
  WARNING: "text-yellow-600 bg-yellow-50",
  ERROR: "text-red-500 bg-red-50",
  PAYMENT: "text-orange-500 bg-orange-50",
  ASSIGNMENT: "text-purple-500 bg-purple-50",
  GRADE: "text-green-500 bg-green-50",
  ATTENDANCE: "text-blue-500 bg-blue-50",
};

export default function NotifikasiClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const displayed = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Semua" : `Belum Dibaca (${unreadCount})`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Bell className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            {filter === "unread" ? "Semua notifikasi sudah dibaca" : "Belum ada notifikasi"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {displayed.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            const colorClass = TYPE_COLOR[n.type] ?? "text-blue-500 bg-blue-50";
            const [textColor, bgColor] = colorClass.split(" ");
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/30" : ""}`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                  <Icon className={`h-4 w-4 ${textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                    {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 whitespace-pre-line">{n.content}</p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                  </p>
                  {n.link && (
                    <a
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Lihat detail →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
