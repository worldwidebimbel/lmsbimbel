import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Wallet, Users2 } from "lucide-react";
import { getBranchScope } from "@/lib/branch-context";
import { getQrisSettings } from "@/lib/qris-settings";
import { isDuitkuConfigured } from "@/lib/payment-gateway";
import TagihanSiswaClient from "@/components/tagihan/TagihanSiswaClient";

export const metadata = { title: "Tagihan Anak" };

export default async function OrangtuaTagihanPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const { branchId: parentBranchId } = await getBranchScope();

  const children = await db.parentChild.findMany({
    where: {
      parentId: session.user.id,
      child: parentBranchId ? { defaultBranchId: parentBranchId } : {},
    },
    include: { child: { select: { id: true, name: true, defaultBranchId: true } } },
  });

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users2 className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Belum ada anak yang terhubung.</p>
      </div>
    );
  }

  const childIds = children.map((c) => c.child.id);
  const branchId = parentBranchId ?? children[0].child.defaultBranchId;

  const [invoices, qris, duitkuReady] = await Promise.all([
    db.invoice.findMany({
      where: { studentId: { in: childIds }, ...(branchId ? { branchId } : {}) },
      include: {
        student: { select: { id: true, name: true } },
        plan: { select: { name: true } },
        payments: { select: { id: true, amount: true, confirmedAt: true, proofUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getQrisSettings(branchId),
    isDuitkuConfigured(),
  ]);

  const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  const total   = invoices.reduce((s, i) => s + i.amount, 0);
  const paid    = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const unpaid  = invoices.filter((i) => ["UNPAID", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tagihan Anak</h1>
          <p className="text-sm text-gray-500">Riwayat tagihan dan pembayaran</p>
        </div>
      </div>

      <TagihanSiswaClient
        invoices={JSON.parse(JSON.stringify(invoices))}
        summary={{ total, paid, unpaid, overdue }}
        qris={qris}
        cloudinaryConfigured={cloudinaryConfigured}
        onlinePaymentEnabled={duitkuReady}
        paymentApiBase="/api/orangtua/tagihan"
      />
    </div>
  );
}
