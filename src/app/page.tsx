import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) redirect("/login");

  const roleRedirects: Record<string, string> = {
    SUPER_ADMIN: "/admin",
    ADMIN: "/admin",
    GURU: "/guru",
    SISWA: "/siswa",
    ORANG_TUA: "/orangtua",
  };

  const role = session.user?.role as string;
  redirect(roleRedirects[role] ?? "/login");
}
