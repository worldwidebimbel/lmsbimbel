import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SertifikatTemplateClient from "@/components/admin/SertifikatTemplateClient";

export const metadata = { title: "Template Sertifikat" };

const CERT_KEYS = [
  "cert_org_name", "cert_title_prefix", "cert_subtitle",
  "cert_signature_name", "cert_signature_title",
  "cert_logo_url", "cert_bg_url",
];

export default async function SertifikatTemplatePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/");

  const configs = await db.siteConfig.findMany({ where: { key: { in: CERT_KEYS } } });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;

  const recentCerts = await db.certificate.findMany({
    orderBy: { issuedAt: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  return (
    <SertifikatTemplateClient
      template={map}
      recentCerts={JSON.parse(JSON.stringify(recentCerts))}
    />
  );
}
