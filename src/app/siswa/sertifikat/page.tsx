import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SertifikatSiswaClient from "@/components/siswa/SertifikatSiswaClient";

export const metadata = { title: "Sertifikat Saya" };

export default async function SertifikatSiswaPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/");

  const certificates = await db.certificate.findMany({
    where: { userId: session.user.id },
    include: { template: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return <SertifikatSiswaClient certificates={JSON.parse(JSON.stringify(certificates))} />;
}
