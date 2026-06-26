import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { User } from "lucide-react";
import ProfileClient from "@/components/ProfileClient";

export const metadata = { title: "Profil Saya" };

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin",
  GURU: "Guru", SISWA: "Siswa", ORANG_TUA: "Orang Tua",
};

const profileSelect = {
  phone: true,
  address: true,
  birthDate: true,
  birthPlace: true,
  gender: true,
  religion: true,
  nationality: true,
  nisn: true,
  nik: true,
  schoolName: true,
  gradeLevel: true,
  educationHistory: true,
  parentName: true,
  parentPhone: true,
  bio: true,
  bloodType: true,
  hobbies: true,
  emergencyContact: true,
  socialLinks: true,
  profileComplete: true,
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
      profile: { select: profileSelect },
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-sm text-gray-500">
            {ROLE_LABEL[user.role]} · Bergabung {format(new Date(user.createdAt), "MMMM yyyy", { locale: localeId })}
          </p>
        </div>
      </div>

      <ProfileClient user={{ ...user, image: user.avatar }} />
    </div>
  );
}
