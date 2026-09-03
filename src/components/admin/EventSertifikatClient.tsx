"use client";

import { useState, useTransition } from "react";
import { Award, Send, ExternalLink, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Reg {
  id: string;
  status: string;
  paymentStatus: string;
  score: number | null;
  rank: number | null;
  user: { id: string; name: string; email: string };
}

interface Props {
  event: { id: string; title: string; type: string; status: string };
  registrations: Reg[];
  certMap: Record<string, string>;
}

export default function EventSertifikatClient({ event, registrations, certMap }: Props) {
  const [certs, setCerts] = useState<Record<string, string>>(certMap);
  const [isPending, startTransition] = useTransition();

  function issueAll() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${event.id}/sertifikat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueAll: true }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.issued} sertifikat diterbitkan, ${data.skipped} sudah ada`);
        window.location.reload();
      } else {
        toast.error("Gagal menerbitkan sertifikat");
      }
    });
  }

  function issueOne(regId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${event.id}/sertifikat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds: [regId] }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.issued > 0) {
          toast.success("Sertifikat diterbitkan");
          window.location.reload();
        } else {
          toast.info("Sertifikat sudah ada sebelumnya");
        }
      } else {
        toast.error("Gagal menerbitkan");
      }
    });
  }

  const issuedCount = Object.keys(certs).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/events`} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Sertifikat Event</h1>
          <p className="text-sm text-gray-500">{event.title}</p>
        </div>
        <button
          onClick={issueAll}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Terbitkan Semua
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Peserta</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{issuedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Sudah Diterbitkan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{registrations.length - issuedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Belum Diterbitkan</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Daftar Peserta</h2>
        </div>
        {registrations.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada peserta terdaftar</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {registrations.map((reg) => {
              const hasCert = !!certs[reg.user.id];
              return (
                <div key={reg.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 text-center text-sm font-bold text-gray-400">
                    {reg.rank != null ? `#${reg.rank}` : "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{reg.user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{reg.user.email}</span>
                      {reg.score != null && <span>· Nilai: {reg.score}</span>}
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                        reg.status === "ATTENDED" ? "bg-green-100 text-green-700" :
                        reg.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{reg.status}</span>
                    </div>
                  </div>
                  {hasCert ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" /> Diterbitkan
                      </span>
                      <a
                        href={`/sertifikat/${certs[reg.user.id]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka link" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => issueOne(reg.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <Award className="h-3.5 w-3.5" /> Terbitkan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
