import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getSiteConfig } from "@/lib/site-config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cfg] = await Promise.all([auth(), getSiteConfig()]);
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN", "ADMIN_AKADEMIK"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={session.user?.role as string}
        userName={session.user?.name ?? "Admin"}
        userEmail={session.user?.email ?? ""}
        siteName={cfg.siteName}
        logoUrl={cfg.logoUrl}
      />
      <div className="flex-1 flex flex-col ml-64">
        <Header
          title="Admin Panel"
          userName={session.user?.name ?? "Admin"}
          role={session.user?.role as string}
          userImage={session.user?.image}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
