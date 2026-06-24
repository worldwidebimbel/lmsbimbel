import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";
import PublicShell from "@/components/landing/PublicShell";

export const metadata: Metadata = {
  title: "EduBimbel - Bimbingan Belajar Terbaik",
  description: "Program bimbingan belajar berkualitas dengan guru profesional, kurikulum terstruktur, dan teknologi pembelajaran modern untuk kesuksesan akademik Anda.",
  openGraph: {
    title: "EduBimbel - Bimbingan Belajar Terbaik",
    description: "Program bimbingan belajar berkualitas dengan guru profesional dan teknologi modern.",
    type: "website",
  },
};

export default async function HomePage() {
  const session = await auth();

  if (session) {
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

  return (
    <PublicShell>
      <LandingPage />
    </PublicShell>
  );
}
