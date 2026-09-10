import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getSiteConfig } from "@/lib/site-config";

export default async function NotifikasiLayout({ children }: { children: React.ReactNode }) {
  const [session, cfg] = await Promise.all([auth(), getSiteConfig()]);
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  const name = session.user.name ?? "Pengguna";
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={name} userEmail={email} siteName={cfg.siteName} logoUrl={cfg.logoUrl} logoDarkUrl={cfg.logoDarkUrl} logoMaxWidth={cfg.logoMaxWidth} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Header title="Notifikasi" userName={name} role={role} userImage={session.user?.image} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
