"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  startDate: string;
  endDate?: string | null;
  isAllDay?: boolean;
  color?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  LIBURAN: "Liburan",
  UJIAN: "Ujian",
  TRYOUT: "Tryout",
  RAPAT: "Rapat",
  EVENT: "Event",
  PENTING: "Penting",
  LAINNYA: "Lainnya",
};

const TYPE_COLOR: Record<string, string> = {
  LIBURAN: "#10b981",
  UJIAN: "#ef4444",
  TRYOUT: "#f59e0b",
  RAPAT: "#8b5cf6",
  EVENT: "#3b82f6",
  PENTING: "#ec4899",
  LAINNYA: "#6b7280",
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AcademicCalendar({
  apiUrl = "/api/calendar",
  readOnly = false,
}: { apiUrl?: string; readOnly?: boolean }) {
  const [today] = useState(() => new Date());
  const [current, setCurrent] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const endDate = new Date(year, month + 1, 6 - lastDay.getDay());

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();
    setLoading(true);
    fetch(`${apiUrl}?start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, [year, month, apiUrl]);

  const dayEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const start = startDate.getTime();
    const end = endDate.getTime();
    for (const e of events) {
      const eStart = new Date(e.startDate).setHours(0, 0, 0, 0);
      const eEnd = e.endDate ? new Date(e.endDate).setHours(23, 59, 59, 999) : eStart;
      if (eEnd < start || eStart > end) continue;
      const d = new Date(Math.max(eStart, start));
      const last = new Date(Math.min(eEnd, end));
      while (d <= last) {
        const key = d.toISOString().split("T")[0];
        map[key] = map[key] ?? [];
        if (!map[key].find((x) => x.id === e.id)) map[key].push(e);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [events, startDate, endDate]);

  function days(): Date[] {
    const days: Date[] = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function isToday(date: Date) {
    return date.toISOString().split("T")[0] === today.toISOString().split("T")[0];
  }

  function isCurrentMonth(date: Date) {
    return date.getMonth() === month;
  }

  function formatKey(date: Date) {
    return date.toISOString().split("T")[0];
  }

  const selectedDayEvents = selectedDate ? dayEvents[selectedDate] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="rounded-lg p-2 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="rounded-lg p-2 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <button onClick={() => setCurrent(new Date())}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Hari Ini
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat kalender...
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {days().map((date) => {
            const key = formatKey(date);
            const list = dayEvents[key] ?? [];
            const isActive = selectedDate === key;
            return (
              <button key={key} onClick={() => setSelectedDate(key)}
                className={`min-h-[96px] border-b border-r border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 ${
                  isCurrentMonth(date) ? "bg-white" : "bg-gray-50/50 text-gray-500"
                } ${isActive ? "ring-2 ring-inset ring-indigo-500" : ""}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                  isToday(date) ? "bg-indigo-600 text-white" : "text-gray-700"
                }`}>
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {list.slice(0, 3).map((e) => (
                    <div key={e.id} className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: e.color || TYPE_COLOR[e.type] || "#6b7280" }}>
                      {e.title}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{list.length - 3} lagi</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {selectedDayEvents.length === 0 ? "Tidak ada acara" : "Acara"} — {selectedDate}
            </h3>
            <button onClick={() => setSelectedDate(null)}
              className="text-xs text-gray-500 hover:text-gray-700">Tutup</button>
          </div>
          <div className="space-y-2">
            {selectedDayEvents.map((e) => (
              <button key={e.id} onClick={() => setSelected(e)}
                className="flex w-full items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-left hover:bg-gray-100">
                <div className="mt-0.5 h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: e.color || TYPE_COLOR[e.type] || "#6b7280" }} />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{e.title}</p>
                  <p className="text-xs text-gray-500">{TYPE_LABEL[e.type] || e.type}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full"
                style={{ backgroundColor: selected.color || TYPE_COLOR[selected.type] || "#6b7280" }} />
              <h3 className="text-lg font-semibold text-gray-900">{selected.title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">{TYPE_LABEL[selected.type] || selected.type}</p>
            {selected.description && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{selected.description}</p>
            )}
            <div className="space-y-1 text-sm text-gray-500">
              <p>Mulai: {new Date(selected.startDate).toLocaleString("id-ID")}</p>
              {selected.endDate && <p>Selesai: {new Date(selected.endDate).toLocaleString("id-ID")}</p>}
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelected(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
