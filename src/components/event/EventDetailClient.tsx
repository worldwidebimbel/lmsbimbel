"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, Trophy, Check, Loader2, ClipboardList, BarChart2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import EventRegisterForm from "./EventRegisterForm";

interface EventPackage {
  id: string;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  location: string | null;
  image: string | null;
  maxParticipants: number | null;
  isPaid: boolean;
  branch: { name: string; code: string } | null;
  packages: EventPackage[];
  _count: { registrations: number };
}

export default function EventDetailClient({
  event,
  isAuthenticated,
  hasExam,
  isRegistered: initialRegistered,
}: {
  event: EventDetail;
  isAuthenticated: boolean;
  hasExam?: boolean;
  isRegistered?: boolean;
}) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(initialRegistered ?? false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/events/${event.id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: selectedPackage }),
    });
    if (res.ok) {
      if (event.isPaid) {
        const payRes = await fetch(`/api/events/${event.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "MIDTRANS" }),
        });
        const payData = await payRes.json();
        if (payRes.ok && payData.redirectUrl) {
          window.location.href = payData.redirectUrl;
          return;
        }
        setError(payData.error || "Gagal membuat pembayaran");
      } else {
        setRegistered(true);
      }
    } else {
      const data = await res.json();
      setError(data.error || "Gagal mendaftar");
    }
    setLoading(false);
  }

  const isDeadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isFull = event.maxParticipants !== null && event._count.registrations >= event.maxParticipants;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-12 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-white/20 mb-3">
            {event.type}
          </span>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-blue-100 mt-2">{event.branch?.name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-blue-100 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-blue-400" />
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            {event.description && <p className="text-gray-700">{event.description}</p>}

            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Waktu</p>
                  <p>{new Date(event.startDate).toLocaleString("id-ID")}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lokasi</p>
                    <p>{event.location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendaftar</p>
                  <p>
                    {event._count.registrations}
                    {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {event.packages.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Pilih Paket</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {event.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`text-left rounded-lg border p-4 transition-colors ${
                        selectedPackage === pkg.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{pkg.name}</span>
                        <span className="text-sm font-medium text-blue-600">
                          {event.isPaid ? formatCurrency(pkg.price) : "Gratis"}
                        </span>
                      </div>
                      {pkg.description && <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
              <div>
                {!event.isPaid ? (
                  <span className="text-green-600 font-semibold">Gratis</span>
                ) : event.packages.length > 0 ? (
                  <span className="text-gray-900 font-semibold">
                    {selectedPackage
                      ? formatCurrency(event.packages.find((p) => p.id === selectedPackage)?.price || 0)
                      : `Mulai ${formatCurrency(Math.min(...event.packages.map((p) => p.price)))}`}
                  </span>
                ) : (
                  <span className="text-gray-900 font-semibold">Berbayar</span>
                )}
              </div>

              {registered ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <Check className="w-4 h-4" /> Terdaftar
                  </div>
                  {hasExam && (
                    <Link
                      href={`/events/${event.id}/exam`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
                    >
                      <ClipboardList className="w-4 h-4" /> Kerjakan Ujian
                    </Link>
                  )}
                  <Link
                    href={`/events/${event.id}/results`}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg"
                  >
                    <BarChart2 className="w-4 h-4" /> Leaderboard
                  </Link>
                </div>
              ) : isDeadlinePassed ? (
                <span className="text-gray-500">Pendaftaran ditutup</span>
              ) : isFull ? (
                <span className="text-gray-500">Kuota penuh</span>
              ) : isAuthenticated ? (
                <button
                  onClick={handleRegister}
                  disabled={loading || (event.isPaid && event.packages.length > 0 && !selectedPackage)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Daftar Sekarang
                </button>
              ) : null}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!isAuthenticated && !registered && !isDeadlinePassed && !isFull && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Daftar untuk Event Ini</h3>
                <EventRegisterForm
                  eventId={event.id}
                  isPaid={event.isPaid}
                  packages={event.packages}
                  onSuccess={() => setRegistered(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
