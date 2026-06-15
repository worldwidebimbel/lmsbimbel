import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function OrangtuaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.role !== "ORANG_TUA" && !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="ORANG_TUA" userName={session.user?.name ?? "Orang Tua"} userEmail={session.user?.email ?? ""} />
      <div className="flex-1 flex flex-col ml-64">
        <Header title="Portal Orang Tua" userName={session.user?.name ?? "Orang Tua"} role="ORANG_TUA" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
