import { StatusChecker } from "@/components/public/StatusChecker";

export const metadata = { title: "Cek Status Pendaftaran" };

export default async function StatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cek Status Pendaftaran</h1>
          <p className="text-sm text-gray-600 mt-1">
            Masukkan nomor pendaftaran Anda
          </p>
        </div>
        <StatusChecker />
      </div>
    </div>
  );
}
