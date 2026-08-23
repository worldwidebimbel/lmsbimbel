import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PrintButton, VerifyNote } from "./PrintControls";

async function getTemplate() {
  const keys = ["cert_bg_url", "cert_title_prefix", "cert_subtitle", "cert_signature_name", "cert_signature_title", "cert_logo_url", "cert_org_name"];
  const configs = await db.siteConfig.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;
  return {
    bgUrl: map.cert_bg_url ?? "",
    titlePrefix: map.cert_title_prefix ?? "SERTIFIKAT",
    subtitle: map.cert_subtitle ?? "diberikan kepada",
    signatureName: map.cert_signature_name ?? "Kepala Lembaga",
    signatureTitle: map.cert_signature_title ?? "EduBimbel LMS",
    logoUrl: map.cert_logo_url ?? "",
    orgName: map.cert_org_name ?? "EduBimbel LMS",
  };
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const cert = await db.certificate.findUnique({ where: { code } });
  if (!cert) return { title: "Sertifikat Tidak Ditemukan" };
  return { title: `Sertifikat — ${cert.recipientName}` };
}

const TYPE_LABEL: Record<string, string> = {
  LMS_COMPLETION: "Kelulusan Program Pembelajaran",
  EVENT_PARTICIPATION: "Peserta",
  EVENT_WINNER: "Juara",
};

export default async function SertifikatPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await db.certificate.findUnique({ where: { code } });
  if (!cert) notFound();

  const tmpl = await getTemplate();
  const typeLabel = TYPE_LABEL[cert.type] ?? cert.type;
  const date = new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f5f0e8; font-family: 'Lato', sans-serif; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .cert-wrapper { box-shadow: none !important; width: 100% !important; max-width: 100% !important; page-break-inside: avoid; }
        }
      `}</style>

      <PrintButton />

      <div className="min-h-screen flex items-center justify-center p-8">
        <div
          className="cert-wrapper relative w-full max-w-3xl bg-white shadow-2xl rounded-2xl overflow-hidden"
          style={{ aspectRatio: "1.414 / 1" }}
        >
          {/* Background image overlay */}
          {tmpl.bgUrl && (
            <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${tmpl.bgUrl})` }} />
          )}

          {/* Border decoration */}
          <div className="absolute inset-3 border-4 border-amber-400 rounded-xl pointer-events-none" />
          <div className="absolute inset-5 border border-amber-200 rounded-xl pointer-events-none" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-between px-16 py-12 text-center">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 w-full">
              {tmpl.logoUrl && <img src={tmpl.logoUrl} alt="Logo" className="h-14 object-contain" />}
              <div>
                <p className="text-xs tracking-[0.3em] font-bold text-amber-600 uppercase">{tmpl.orgName}</p>
                <h1
                  className="mt-2 font-bold text-gray-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 48px)" }}
                >
                  {tmpl.titlePrefix}
                </h1>
                <p className="text-gray-500 text-sm tracking-widest mt-1">{typeLabel}</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="w-full">
              <p className="text-gray-400 text-sm mb-3">{tmpl.subtitle}</p>
              <p
                className="font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 4vw, 38px)" }}
              >
                {cert.recipientName}
              </p>
              <div className="mt-3 mx-auto w-32 h-0.5 bg-amber-400" />
              {cert.eventName && (
                <p className="text-gray-600 text-sm mt-3">dalam kegiatan: <strong>{cert.eventName}</strong></p>
              )}
              {cert.score != null && (
                <p className="text-gray-600 text-sm mt-1">dengan nilai <strong>{cert.score}</strong>{cert.rank != null && ` · Peringkat ke-${cert.rank}`}</p>
              )}
            </div>

            {/* Footer */}
            <div className="w-full flex items-end justify-between">
              <div className="text-left">
                <p className="text-xs text-gray-400">Kode Verifikasi</p>
                <p className="text-xs font-mono font-bold text-gray-600 tracking-widest mt-0.5">{cert.code}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {tmpl.orgName} · {date}
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-0.5 bg-gray-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-700">{tmpl.signatureName}</p>
                <p className="text-[10px] text-gray-500">{tmpl.signatureTitle}</p>
              </div>
            </div>
          </div>
        </div>

        <VerifyNote code={cert.code} />
      </div>
    </>
  );
}
