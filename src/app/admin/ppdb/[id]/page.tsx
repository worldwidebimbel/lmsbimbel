import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PpdbDetail } from "@/components/admin/PpdbDetail";

export const metadata = { title: "Detail Pendaftaran" };

export default async function PpdbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const { id } = await params;

  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, price: true } },
      branch: { select: { id: true, name: true, code: true } },
      educationLevel: { select: { id: true, name: true, code: true } },
      documents: {
        include: { documentType: true },
      },
      statusLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!registration) {
    redirect("/admin/ppdb");
  }

  return (
    <div className="space-y-6">
      <div>
        <a href="/admin/ppdb" className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali ke PPDB
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {registration.fullName}
        </h1>
        <p className="text-sm text-gray-500 font-mono">{registration.registrationNo}</p>
      </div>

      <PpdbDetail
        registration={{
          ...registration,
          birthDate: registration.birthDate.toISOString(),
          createdAt: registration.createdAt.toISOString(),
          convertedAt: registration.convertedAt?.toISOString() ?? null,
          statusLogs: registration.statusLogs.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
