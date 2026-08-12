import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export const metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Riwayat perubahan data penting — hanya dapat dilihat oleh Super Admin
        </p>
      </div>

      <AuditLogViewer />
    </div>
  );
}
