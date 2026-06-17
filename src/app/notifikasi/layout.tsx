import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function NotifikasiLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  const name = session.user.name ?? "Pengguna";
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={name} userEmail={email} />
      <div className="flex-1 flex flex-col ml-64">
        <Header title="Notifikasi" userName={name} role={role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
