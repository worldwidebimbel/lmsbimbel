import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";

export const metadata = { title: "Profil Pengguna" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Pengguna</h1>
      </div>
      <ProfileCard userId={id} />
    </div>
  );
}
