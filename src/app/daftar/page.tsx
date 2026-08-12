import { db } from "@/lib/db";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { cookies } from "next/headers";

export const metadata = { title: "Pendaftaran Siswa Baru" };

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const refCookie = cookieStore.get("ref")?.value || null;
  const referralCode = sp.ref || refCookie || null;

  const [programs, branches, educationLevels, documentTypes] = await Promise.all([
    db.program.findMany({
      where: { isActive: true },
      include: { branches: { select: { id: true } } },
      orderBy: { order: "asc" },
    }),
    db.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, address: true },
      orderBy: { name: "asc" },
    }),
    db.educationLevel.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    db.documentType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const preselectedProgram = sp.program
    ? programs.find((p) => p.slug === sp.program)
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Siswa Baru</h1>
          <p className="text-gray-600 mt-2">
            Lengkapi data di bawah untuk mendaftar. Pastikan data yang Anda masukkan benar.
          </p>
        </div>

        <RegistrationForm
          programs={programs.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            price: p.price,
            branchIds: p.branches.map((b) => b.id),
          }))}
          branches={branches}
          educationLevels={educationLevels}
          documentTypes={documentTypes}
          preselectedProgramId={preselectedProgram?.id}
          referralCode={referralCode}
        />
      </div>
    </div>
  );
}
