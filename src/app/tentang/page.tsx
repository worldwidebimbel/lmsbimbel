import { db } from "@/lib/db";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami — Visi, Misi & Tim",
  description: "Kenali lembaga bimbingan belajar kami, visi-misi, dan tim tutor profesional.",
};

export const dynamic = "force-dynamic";

export default async function TentangPage() {
  const [teamMembers, siteConfig] = await Promise.all([
    db.siteTeamMember.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.siteConfig.findMany(),
  ]);

  const configMap = Object.fromEntries(siteConfig.map((c) => [c.key, c.value]));
  const visi = configMap["visi"] ?? "";
  const misi = configMap["misi"] ?? "";
  const profil = configMap["profil_lembaga"] ?? "";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Tentang Kami</h1>
          {profil && <p className="mt-4 text-gray-600 whitespace-pre-wrap">{profil}</p>}
        </div>

        {(visi || misi) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visi && (
              <div className="rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-indigo-600 mb-3">Visi</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{visi}</p>
              </div>
            )}
            {misi && (
              <div className="rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-indigo-600 mb-3">Misi</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{misi}</p>
              </div>
            )}
          </div>
        )}

        {teamMembers.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Tim Kami</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teamMembers.map((m) => (
                <div key={m.id} className="rounded-xl border border-gray-200 p-6 text-center">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={m.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-indigo-600">{m.name.charAt(0)}</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-indigo-600 mb-2">{m.role}</p>
                  {m.bio && <p className="text-xs text-gray-500">{m.bio}</p>}
                  <div className="flex items-center justify-center gap-3 mt-3">
                    {m.email && <a href={`mailto:${m.email}`} className="text-xs text-gray-400 hover:text-indigo-600">{m.email}</a>}
                    {m.linkedin && <a href={m.linkedin} target="_blank" className="text-xs text-blue-600 hover:underline">LinkedIn</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
