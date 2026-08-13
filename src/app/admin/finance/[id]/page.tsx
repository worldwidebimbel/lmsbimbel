import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import InvoiceDetailClient from "@/components/admin/InvoiceDetailClient";
import { Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Detail Tagihan" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      plan: true,
      branch: { select: { id: true, name: true, code: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!invoice) notFound();

  const { isSuperAdmin, branchId } = await getBranchScope();
  if (!isSuperAdmin && invoice.branchId && invoice.branchId !== branchId) {
    redirect("/admin/finance");
  }

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Detail Tagihan</h1>
          <p className="text-sm text-gray-500">{invoice.student.name} · {formatCurrency(invoice.amount)}</p>
        </div>
      </div>

      <InvoiceDetailClient
        invoice={JSON.parse(JSON.stringify(invoice))}
        totalPaid={totalPaid}
      />
    </div>
  );
}
