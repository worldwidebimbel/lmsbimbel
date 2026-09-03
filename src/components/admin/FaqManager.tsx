"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

export default function FaqManager({ faqs: initial }: { faqs: Faq[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [faqs, setFaqs] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "Umum" });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaq),
      });
      if (res.ok) {
        const faq = await res.json();
        setFaqs((p) => [...p, faq]);
        setNewFaq({ question: "", answer: "", category: "Umum" });
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    startTransition(async () => {
      await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      setFaqs((p) => p.filter((f) => f.id !== id));
      router.refresh();
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await fetch(`/api/admin/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setFaqs((p) => p.map((f) => f.id === id ? { ...f, isActive: !current } : f));
    });
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600">
          <Plus className="h-4 w-4" /> Tambah FAQ
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-3">
          <input value={newFaq.question} onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
            placeholder="Pertanyaan" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <textarea value={newFaq.answer} onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
            placeholder="Jawaban" required rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={newFaq.category} onChange={(e) => setNewFaq((p) => ({ ...p, category: e.target.value }))}
            placeholder="Kategori" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Batal</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {faqs.map((f) => (
          <div key={f.id} className={`rounded-xl border bg-white p-4 ${f.isActive ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{f.category}</span>
                  {!f.isActive && <span className="text-xs text-gray-400">(disembunyikan)</span>}
                </div>
                <p className="font-medium text-gray-900 text-sm">{f.question}</p>
                <p className="text-sm text-gray-500 mt-1">{f.answer}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggle(f.id, f.isActive)} className="rounded p-1.5 text-xs text-gray-400 hover:bg-gray-100">
                  {f.isActive ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button onClick={() => handleDelete(f.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
