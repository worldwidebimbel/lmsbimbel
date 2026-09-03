"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2, User, MapPin, Phone, Mail, GraduationCap, Calendar, Droplet, BookOpen } from "lucide-react";

interface EducationItem {
  institution: string;
  degree?: string;
  year?: string;
}

interface PublicProfile {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
  profileComplete: boolean;
  joinedAt: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  religion?: string | null;
  nationality?: string | null;
  nisn?: string | null;
  nik?: string | null;
  educationHistory?: EducationItem[];
  parentName?: string | null;
  parentPhone?: string | null;
  bloodType?: string | null;
  hobbies?: string | null;
  emergencyContact?: Record<string, string>;
  socialLinks?: Record<string, string>;
  classes?: { id: string; name: string; subject?: { name: string } | null }[];
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", GURU: "Guru", SISWA: "Siswa", ORANG_TUA: "Orang Tua",
};

export default function ProfileCard({ userId, preview }: { userId: string; preview?: boolean }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat profil");
        return await res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  if (error || !profile) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Profil tidak ditemukan"}</div>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isFull = profile.email !== undefined;

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${preview ? "" : "p-6"}`}>
      <div className="flex items-start gap-4">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{profile.name}</h2>
          <p className="text-sm text-indigo-600 font-medium">{ROLE_LABEL[profile.role] || profile.role}</p>
          <p className="text-xs text-gray-500 mt-1">
            Bergabung {format(new Date(profile.joinedAt), "MMMM yyyy", { locale: localeId })}
          </p>
          {profile.profileComplete ? (
            <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Profil Lengkap
            </span>
          ) : (
            <span className="mt-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              Profil Belum Lengkap
            </span>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
        <InfoItem icon={<Phone className="h-4 w-4" />} label="Telepon" value={profile.phone} />
        <InfoItem icon={<MapPin className="h-4 w-4" />} label="Alamat" value={profile.address} />
        <InfoItem icon={<Calendar className="h-4 w-4" />} label="Tempat, Tgl Lahir" value={[profile.birthPlace, profile.birthDate ? format(new Date(profile.birthDate), "dd MMM yyyy", { locale: localeId }) : null].filter(Boolean).join(", ") || null} />
        <InfoItem icon={<User className="h-4 w-4" />} label="Jenis Kelamin" value={profile.gender} />
        <InfoItem icon={<BookOpen className="h-4 w-4" />} label="Agama" value={profile.religion} />
        <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Sekolah / Kelas" value={[profile.schoolName, profile.gradeLevel].filter(Boolean).join(" - ") || null} />
        <InfoItem icon={<Droplet className="h-4 w-4" />} label="Golongan Darah" value={profile.bloodType} />
      </div>

      {isFull && (
        <>
          {(profile.educationHistory?.length ?? 0) > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Riwayat Pendidikan</h3>
              <ul className="space-y-2">
                {profile.educationHistory?.map((edu, idx) => (
                  <li key={idx} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{edu.institution}</span>
                    {edu.degree && <span className="text-gray-500"> · {edu.degree}</span>}
                    {edu.year && <span className="text-gray-500 ml-1">({edu.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(profile.classes?.length ?? 0) > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {profile.role === "SISWA" ? "Kelas Diikuti" : "Kelas Diampu"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.classes?.map((c) => (
                  <span key={c.id} className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                    {c.name} {c.subject?.name ? `· ${c.subject.name}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="mt-0.5 text-gray-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
