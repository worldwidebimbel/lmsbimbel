"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, Eye, EyeOff, Upload, X, Plus } from "lucide-react";

interface EducationItem {
  institution: string;
  degree?: string;
  year?: string;
}

interface ProfileData {
  phone: string | null;
  address: string | null;
  birthDate: string | Date | null;
  birthPlace: string | null;
  gender: string | null;
  religion: string | null;
  nationality: string | null;
  nisn: string | null;
  nik: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
  educationHistory: unknown;
  parentName: string | null;
  parentPhone: string | null;
  bio: string | null;
  bloodType: string | null;
  hobbies: string | null;
  emergencyContact: unknown;
  socialLinks: unknown;
  profileComplete: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  profile: ProfileData | null;
}

export default function ProfileClient({ user }: { user: UserData }) {
  const p = user.profile;
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image);
  const [phone, setPhone] = useState(p?.phone ?? "");
  const [address, setAddress] = useState(p?.address ?? "");
  const [birthDate, setBirthDate] = useState(p?.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : "");
  const [birthPlace, setBirthPlace] = useState(p?.birthPlace ?? "");
  const [gender, setGender] = useState(p?.gender ?? "");
  const [religion, setReligion] = useState(p?.religion ?? "");
  const [nationality, setNationality] = useState(p?.nationality ?? "");
  const [nisn, setNisn] = useState(p?.nisn ?? "");
  const [nik, setNik] = useState(p?.nik ?? "");
  const [schoolName, setSchoolName] = useState(p?.schoolName ?? "");
  const [gradeLevel, setGradeLevel] = useState(p?.gradeLevel ?? "");
  const [bio, setBio] = useState(p?.bio ?? "");
  const [bloodType, setBloodType] = useState(p?.bloodType ?? "");
  const [hobbies, setHobbies] = useState(p?.hobbies ?? "");
  const [parentName, setParentName] = useState(p?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(p?.parentPhone ?? "");
  const [educationHistory, setEducationHistory] = useState<EducationItem[]>(
    Array.isArray(p?.educationHistory) ? (p.educationHistory as EducationItem[]) : []
  );
  const [emergencyContact, setEmergencyContact] = useState<Record<string, string>>(
    typeof p?.emergencyContact === "object" && p?.emergencyContact !== null ? (p.emergencyContact as Record<string, string>) : {}
  );
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    typeof p?.socialLinks === "object" && p?.socialLinks !== null ? (p.socialLinks as Record<string, string>) : {}
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isStudent = user.role === "SISWA";

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload gagal");
      setImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload foto gagal");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(""); setError("");
    startTransition(async () => {
      const body: Record<string, unknown> = {
        name,
        avatar: image,
        phone,
        address,
        birthDate: birthDate || null,
        birthPlace,
        gender,
        religion,
        nationality,
        nisn,
        nik,
        schoolName,
        gradeLevel,
        educationHistory,
        ...(isStudent && { parentName, parentPhone }),
        bio,
        bloodType,
        hobbies,
        emergencyContact,
        socialLinks,
      };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal memperbarui profil"); return; }
      setSuccess("Profil berhasil diperbarui!");
      setCurrentPassword(""); setNewPassword("");
      await update({ name, image: image ?? null });
    });
  }

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="relative">
            {image ? (
              <img src={image} alt={name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                {initials}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700">
              <Upload className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            {uploading && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {p?.profileComplete ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Profil Lengkap</span>
            ) : (
              <span className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Lengkapi data diri</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input value={user.email} disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nomor HP</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Telepon Darurat</label>
              <input value={emergencyContact.phone ?? ""} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="Kontak darurat"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Alamat</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
              placeholder="Alamat lengkap..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tempat Lahir</label>
              <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tanggal Lahir</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Jenis Kelamin</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Agama</label>
              <select value={religion} onChange={(e) => setReligion(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                <option value="">Pilih</option>
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Kewarganegaraan</label>
              <input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Indonesia"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Golongan Darah</label>
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                <option value="">Pilih</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isStudent && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">NISN</label>
                <input value={nisn} onChange={(e) => setNisn(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{isStudent ? "NIK" : "Nomor Identitas"}</label>
              <input value={nik} onChange={(e) => setNik(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Sekolah / Institusi</label>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Kelas / Jabatan</label>
              <input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder={isStudent ? "Kelas 10 IPA" : "Guru Matematika"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio / Tentang Saya</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Ceritakan singkat tentang diri Anda..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Hobi</label>
            <input value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="Membaca, bermain musik, olahraga"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Riwayat Pendidikan</p>
              <button type="button" onClick={() => setEducationHistory([...educationHistory, { institution: "", degree: "", year: "" }])}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {educationHistory.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <input value={edu.institution} placeholder="Institusi" onChange={(e) => {
                    const copy = [...educationHistory];
                    copy[idx].institution = e.target.value;
                    setEducationHistory(copy);
                  }} className="col-span-5 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input value={edu.degree} placeholder="Jurusan / Tingkat" onChange={(e) => {
                    const copy = [...educationHistory];
                    copy[idx].degree = e.target.value;
                    setEducationHistory(copy);
                  }} className="col-span-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input value={edu.year} placeholder="Tahun" onChange={(e) => {
                    const copy = [...educationHistory];
                    copy[idx].year = e.target.value;
                    setEducationHistory(copy);
                  }} className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setEducationHistory(educationHistory.filter((_, i) => i !== idx))}
                    className="col-span-1 flex justify-center pb-2 text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isStudent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Orang Tua / Wali</label>
                <input value={parentName} onChange={(e) => setParentName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Telepon Orang Tua / Wali</label>
                <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Instagram</label>
              <input value={socialLinks.instagram ?? ""} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">LinkedIn</label>
              <input value={socialLinks.linkedin ?? ""} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ganti Password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password Lama</label>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Kosongkan jika tidak ingin ubah"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password Baru</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 karakter"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isPending || uploading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
