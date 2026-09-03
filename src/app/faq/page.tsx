import { db } from "@/lib/db";
import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import PublicShell from "@/components/landing/PublicShell";

export const metadata: Metadata = {
  title: "FAQ — Pertanyaan yang Sering Diajukan",
  description: "Temukan jawaban atas pertanyaan umum tentang program, pendaftaran, dan biaya.",
};

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await db.siteFaq.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const categories = [...new Set(faqs.map((f) => f.category))];

  return (
    <PublicShell>
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
          <p className="mt-2 text-gray-500">Pertanyaan yang sering diajukan</p>
        </div>

        {faqs.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada FAQ.</p>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="font-semibold text-gray-800 mb-3">{cat}</h2>
                <div className="space-y-3">
                  {faqs.filter((f) => f.category === cat).map((f) => (
                    <details key={f.id} className="group rounded-xl border border-gray-200 p-4">
                      <summary className="flex items-center gap-3 cursor-pointer font-medium text-gray-900">
                        <span className="text-indigo-600">Q.</span>
                        {f.question}
                      </summary>
                      <p className="mt-3 text-sm text-gray-600 pl-8">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
