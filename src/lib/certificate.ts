import { db } from "@/lib/db";

export async function generateCertificateNo(prefix = "CERT"): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  const lastCert = await db.certificate.findFirst({
    where: { certificateNo: { startsWith: `${prefix}/${year}/${month}` } },
    orderBy: { certificateNo: "desc" },
    select: { certificateNo: true },
  });

  let seq = 1;
  if (lastCert?.certificateNo) {
    const parts = lastCert.certificateNo.split("/");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}/${year}/${month}/${String(seq).padStart(4, "0")}`;
}

export async function generateCertificateCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  const existing = await db.certificate.findUnique({ where: { code } });
  if (existing) return generateCertificateCode();
  return code;
}
