import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Invoice" };

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { name: true, email: true } },
      plan: { select: { name: true } },
      branch: { select: { name: true, code: true } },
      payments: { where: { confirmedAt: { not: null } }, select: { amount: true, confirmedAt: true } },
    },
  });

  if (!invoice) notFound();

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const isPaid = invoice.status === "PAID" || totalPaid >= invoice.amount;
  const invoiceNumber = `INV-${invoice.id.slice(-6).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 print:p-0">
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isPaid ? "KUITANSI" : "INVOICE"}</h1>
          <p className="text-sm text-gray-500 mt-1">{invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{invoice.branch?.name ?? "Pusat"}</p>
          <p className="text-xs text-gray-500">{invoice.branch?.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 py-6 text-sm">
        <div>
          <p className="text-gray-500">Kepada</p>
          <p className="font-medium text-gray-900">{invoice.student.name}</p>
          <p className="text-gray-500">{invoice.student.email}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Tanggal Invoice</p>
          <p className="font-medium text-gray-900">{format(new Date(invoice.createdAt), "d MMMM yyyy", { locale: localeId })}</p>
          <p className="text-gray-500 mt-2">Jatuh Tempo</p>
          <p className="font-medium text-gray-900">{format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId })}</p>
        </div>
      </div>

      <table className="w-full text-sm border-t border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-3 font-medium text-gray-700">Keterangan</th>
            <th className="text-right py-3 px-3 font-medium text-gray-700">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-4 px-3 text-gray-900">
              {invoice.plan?.name ?? "Tagihan manual"}
              {invoice.note && <p className="text-gray-500 text-xs mt-1">{invoice.note}</p>}
            </td>
            <td className="py-4 px-3 text-right font-medium text-gray-900">{formatCurrency(invoice.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end py-6 text-sm">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dibayar</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-900 font-medium">{isPaid ? "Lunas" : "Sisa"}</span>
            <span className={`font-bold ${isPaid ? "text-green-700" : "text-orange-700"}`}>{formatCurrency(isPaid ? 0 : invoice.amount - totalPaid)}</span>
          </div>
        </div>
      </div>

      {isPaid && (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-green-800 font-semibold">LUNAS</p>
          <p className="text-green-700 text-sm">Terima kasih atas pembayaran Anda.</p>
        </div>
      )}

      <div className="mt-8 flex justify-between items-end text-xs text-gray-400 border-t border-gray-100 pt-4">
        <p>Dicetak pada {format(new Date(), "d MMMM yyyy HH:mm", { locale: localeId })}</p>
        <button
          onClick={() => window.print()}
          className="print:hidden rounded-lg bg-gray-900 px-4 py-2 text-white text-sm font-medium hover:bg-gray-800"
        >
          Cetak / Simpan PDF
        </button>
      </div>
    </div>
  );
}
