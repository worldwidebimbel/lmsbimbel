import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getSiteConfig } from "@/lib/site-config";

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const [session, cfg] = await Promise.all([auth(), getSiteConfig()]);
  if (!session) redirect("/login");
  // Area /guru bisa diakses GURU + SUPER_ADMIN + ADMIN (mis. AI Builder,
  // Bank Soal). Sidebar & Header memakai role asli user — bukan hard-code
  // "GURU" — agar admin yang mengunjungi halaman ini tetap melihat menu
  // admin mereka, bukan menu guru (lihat future-commit.md §5.4).
  const role = (session.user?.role as string) ?? "GURU";
  if (role !== "GURU" && !["SUPER_ADMIN", "ADMIN"].includes(role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={session.user?.name ?? "Guru"} userEmail={session.user?.email ?? ""} siteName={cfg.siteName} logoUrl={cfg.logoUrl} logoDarkUrl={cfg.logoDarkUrl} logoMaxWidth={cfg.logoMaxWidth} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Header title="Portal Guru" userName={session.user?.name ?? "Guru"} role={role} userImage={session.user?.image} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
