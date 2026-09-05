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

/**
 * Idempotent event certificate: one certificate per user per event.
 * - Creates if none exists (type by rank: top 3 = WINNER, else PARTICIPATION).
 * - Syncs type/title/rank/score if ranking changed (including downgrade after correction).
 */
export async function upsertEventCertificate(params: {
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  rank: number | null;
  score: number | null;
}): Promise<{ certId: string; action: "created" | "updated" | "kept" }> {
  const isWinner = params.rank != null && params.rank <= 3;
  const type = isWinner ? "EVENT_WINNER" : "EVENT_PARTICIPATION";
  const title = isWinner
    ? `Sertifikat Juara ${params.rank} — ${params.eventName}`
    : `Sertifikat Peserta — ${params.eventName}`;

  const existing = await db.certificate.findFirst({
    where: { userId: params.userId, eventId: params.eventId },
  });

  if (existing) {
    if (existing.type !== type || existing.rank !== params.rank || existing.score !== params.score) {
      await db.certificate.update({
        where: { id: existing.id },
        data: { type, title, rank: params.rank, score: params.score },
      });
      return { certId: existing.id, action: "updated" };
    }
    return { certId: existing.id, action: "kept" };
  }

  const certificateNo = await generateCertificateNo("EVT");
  const code = await generateCertificateCode();
  const cert = await db.certificate.create({
    data: {
      code,
      certificateNo,
      userId: params.userId,
      type,
      title,
      recipientName: params.userName,
      eventId: params.eventId,
      eventName: params.eventName,
      rank: params.rank,
      score: params.score,
    },
  });
  return { certId: cert.id, action: "created" };
}
