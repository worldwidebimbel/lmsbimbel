import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getSiteConfig } from "@/lib/site-config";

export default async function OrangtuaLayout({ children }: { children: React.ReactNode }) {
  const [session, cfg] = await Promise.all([auth(), getSiteConfig()]);
  if (!session) redirect("/login");
  if (session.user?.role !== "ORANG_TUA" && !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="ORANG_TUA" userName={session.user?.name ?? "Orang Tua"} userEmail={session.user?.email ?? ""} siteName={cfg.siteName} logoUrl={cfg.logoUrl} logoDarkUrl={cfg.logoDarkUrl} logoMaxWidth={cfg.logoMaxWidth} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Header title="Portal Orang Tua" userName={session.user?.name ?? "Orang Tua"} role="ORANG_TUA" userImage={session.user?.image} />
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav role="ORANG_TUA" />
    </div>
  );
}
