import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import CertificateTemplateManager from "@/components/admin/CertificateTemplateManager";

export const metadata = { title: "Template Sertifikat" };

export default async function CertificateTemplatesPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/");

  const templates = await db.certificateTemplate.findMany({
    include: { _count: { select: { certificates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <CertificateTemplateManager templates={JSON.parse(JSON.stringify(templates))} />;
}
