import { StatusChecker } from "@/components/public/StatusChecker";
import PublicShell from "@/components/landing/PublicShell";
import { CheckCircle } from "lucide-react";

export const metadata = { title: "Cek Status Pendaftaran" };

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string; payment?: string }>;
}) {
  const sp = await searchParams;
  const initialNo = (sp.no || "").toUpperCase();

  return (
    <PublicShell>
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Cek Status Pendaftaran</h1>
            <p className="text-sm text-gray-600 mt-1">
              Masukkan nomor pendaftaran Anda
            </p>
          </div>
          {sp.payment === "done" && (
            <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Terima kasih! Pembayaran sedang diproses. Klik <b>Bayar Sekarang</b> di bawah
                jika belum menyelesaikan pembayaran, atau cek kembali statusnya di sini.
              </p>
            </div>
          )}
          <StatusChecker initialNo={initialNo} />
        </div>
      </div>
    </PublicShell>
  );
}
