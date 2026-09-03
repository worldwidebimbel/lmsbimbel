import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getSiteConfig } from "@/lib/site-config";

const ROLE_TITLE: Record<string, string> = {
  SUPER_ADMIN: "Portal Super Admin",
  ADMIN: "Portal Admin",
  GURU: "Portal Guru",
  SISWA: "Portal Siswa",
  ORANG_TUA: "Portal Orang Tua",
};

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [session, cfg] = await Promise.all([auth(), getSiteConfig()]);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!role || !["SUPER_ADMIN", "ADMIN", "GURU", "SISWA", "ORANG_TUA"].includes(role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        userName={session.user.name ?? "Pengguna"}
        userEmail={session.user.email ?? ""}
        siteName={cfg.siteName}
        logoUrl={cfg.logoUrl}
      />
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Header title={ROLE_TITLE[role] ?? "Profil Saya"} userName={session.user.name ?? "Pengguna"} role={role} userImage={session.user.image} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
