import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import TagihanSiswaClient from "@/components/tagihan/TagihanSiswaClient";

export const metadata = { title: "Tagihan" };

export default async function SiswaTagihanPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const [invoices, qrisSettings] = await Promise.all([
    db.invoice.findMany({
      where: { studentId: session.user.id },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        note: true,
        enableOnlinePayment: true,
        onlinePaymentMethod: true,
        plan: { select: { name: true } },
        payments: { select: { id: true, amount: true, confirmedAt: true, proofUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.appSetting.findMany({
      where: { key: { in: ["qris_image_url", "qris_bank_name", "qris_account_name", "qris_account_number"] } },
    }),
  ]);

  const settingMap = Object.fromEntries(qrisSettings.map((s) => [s.key, s.value]));
  const qris = {
    imageUrl: settingMap["qris_image_url"] ?? null,
    bankName: settingMap["qris_bank_name"] ?? null,
    accountName: settingMap["qris_account_name"] ?? null,
    accountNumber: settingMap["qris_account_number"] ?? null,
  };

  const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const unpaid = invoices.filter((i) => ["UNPAID", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tagihan</h1>
          <p className="text-sm text-gray-500">Riwayat tagihan dan pembayaran QRIS</p>
        </div>
      </div>

      <TagihanSiswaClient
        invoices={JSON.parse(JSON.stringify(invoices))}
        summary={{ total, paid, unpaid, overdue }}
        qris={qris}
        cloudinaryConfigured={cloudinaryConfigured}
      />
    </div>
  );
}
