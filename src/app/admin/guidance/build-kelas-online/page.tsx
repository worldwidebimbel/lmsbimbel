import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = { title: "Build Kelas Online — Guidance" };

const ADMIN_STEPS = [
  {
    title: "Pastikan Data Master Siap",
    items: [
      "Mata Pelajaran — Admin → Master → Mata Pelajaran",
      "Guru Pengajar — Admin → Manajemen Pengguna (role GURU, aktif)",
      "Cabang — Admin → Master → Cabang (untuk multi-branch)",
      "Feature Flags aktif: FEAT_CLASS_SCHEDULE, FEAT_MATERIALS, FEAT_ASSIGNMENTS, FEAT_ONLINE_EXAM, FEAT_LIVE_CLASS, FEAT_FORUM, FEAT_ATTENDANCE",
    ],
  },
  {
    title: "Buat Kelas Baru (Tipe: Online)",
    items: [
      "Admin → Manajemen Kelas → \"+ Buat Kelas\"",
      "Isi: Nama Kelas, Mata Pelajaran, Guru Pengajar",
      "Pilih Tipe Kelas: **Online**",
      "Ruangan: pilih \u201c\u2014 Tanpa ruangan \u2014\u201d",
      "Set Tanggal Mulai & Selesai, Maks. Siswa",
      "Klik \u201cBuat Kelas\u201d",
    ],
  },
  {
    title: "Daftarkan Siswa ke Kelas",
    items: [
      "Di halaman detail kelas → bagian \u201cDaftar Siswa\u201d",
      "Pilih siswa dari dropdown → klik \u201cDaftarkan\u201d",
      "Ulangi untuk setiap siswa",
    ],
  },
  {
    title: "Atur Jadwal Kelas",
    items: [
      "Di halaman detail kelas → klik \u201cKelola Jadwal\u201d",
      "Tambah jadwal: Hari, Jam Mulai, Jam Selesai",
      "Ruangan: \u201c\u2014 Tanpa ruangan \u2014\u201d (kelas online)",
      "Klik \u201cTambah Jadwal\u201d",
    ],
  },
];

const GURU_STEPS = [
  {
    title: "Upload Materi Pembelajaran",
    items: [
      "Guru → Materi → \u201c+ Tambah Materi\u201d",
      "Pilih kelas, judul, deskripsi, upload file (PDF/Video/PPT)",
      "Klik \u201cSimpan\u201d \u2014 siswa bisa akses kapan saja di Siswa → Materi",
    ],
  },
  {
    title: "Buat Tugas / PR",
    items: [
      "Guru → Tugas → \u201c+ Buat Tugas\u201d",
      "Pilih kelas, judul, deskripsi, deadline (tanggal & jam)",
      "Siswa mengumpulkan jawaban online",
    ],
  },
  {
    title: "Buat Ujian Online",
    items: [
      "Guru → Ujian → \u201cBuat Ujian\u201d",
      "Isi: judul, kelas, durasi (menit), waktu mulai",
      "Tambah soal (pilihan ganda / essay)",
      "Publish ujian saat siap \u2014 siswa kerjakan dengan timer otomatis",
    ],
  },
  {
    title: "Jadwalkan Sesi Live (Video Conference)",
    items: [
      "Guru → Kelas Online → \u201cJadwalkan Sesi\u201d",
      "Pilih kelas, judul sesi, waktu mulai & selesai",
      "Pilih platform: Google Meet / Zoom / Teams / YouTube Live",
      "Paste Link Meeting (misal: https://meet.google.com/xxx)",
      "Klik \u201cJadwalkan\u201d",
      "Siswa melihat sesi di Siswa → Kelas Online, klik \u201cMasuk ke Kelas\u201d saat sesi dimulai",
      "Setelah sesi: tambahkan link rekaman untuk siswa yang terlewat",
    ],
  },
  {
    title: "Forum Diskusi",
    items: [
      "Guru → Forum \u2014 buat thread diskusi per kelas",
      "Siswa bisa bertanya, guru menjawab",
      "Mendukung upvote dan mark as answer",
    ],
  },
];

const PUBLIC_STEPS = [
  {
    title: "Buat Program/Paket",
    items: [
      "Admin → Master → Program & Jenjang",
      "Isi: nama (misal: \u201cUTBK Online Intensif\u201d), slug, deskripsi, harga",
      "Aktifkan program, hubungkan dengan cabang",
    ],
  },
  {
    title: "Buat Landing Page Publik",
    items: [
      "Admin → CMS → Landing Pages → \u201cBuat Landing Page\u201d",
      "Slug: misal `utbk-online-intensif` (URL: /lp/utbk-online-intensif)",
      "Tambahkan sections: hero, keunggulan, jadwal, harga, testimoni",
      "CTA Type: LINK, CTA URL: /daftar?program=utbk-online",
      "Publish landing page",
    ],
  },
  {
    title: "Tampilkan di Homepage",
    items: [
      "Admin → CMS → Program \u2014 tambahkan program ke homepage",
      "Admin → CMS → Menu \u2014 tambah link navigasi ke landing page",
      "Admin → CMS → Banner \u2014 tambahkan banner dengan link ke landing page",
    ],
  },
  {
    title: "Atur Paket Harga (Billing Plan)",
    items: [
      "Admin → Keuangan \u2014 buat billing plan",
      "Tipe: PERIOD (per bulan/semester) atau MEETING_PACKAGE (per pertemuan)",
    ],
  },
  {
    title: "Alur Pendaftaran Calon Siswa",
    items: [
      "Calon siswa akses landing page publik (misal: digsan.study/lp/utbk-online-intensif)",
      "Klik CTA \u2192 diarahkan ke /daftar?program=utbk-online (program terpilih otomatis)",
      "Isi form pendaftaran \u2192 sistem buat akun siswa + invoice",
      "Pembayaran: Transfer/QRIS/Manual",
      "Admin konfirmasi pembayaran di Admin → Keuangan",
      "Admin daftarkan siswa ke kelas online",
      "Siswa login \u2192 akses kelas online (materi, live, tugas, ujian)",
    ],
  },
];

const FEATURES = [
  { name: "Tipe Kelas ONLINE", status: true },
  { name: "Live Session (Google Meet/Zoom/Teams)", status: true },
  { name: "Materi Pembelajaran (PDF/Video/PPT)", status: true },
  { name: "Tugas & PR Online", status: true },
  { name: "Ujian Online + Timer", status: true },
  { name: "Forum Diskusi", status: true },
  { name: "Chat Private", status: true },
  { name: "Absensi", status: true },
  { name: "Jadwal & Kalender", status: true },
  { name: "Nilai & Rapor", status: true },
  { name: "Landing Page Builder (Publik)", status: true },
  { name: "Pendaftaran Online (/daftar)", status: true },
  { name: "Billing Plan & Invoice", status: true },
  { name: "PPDB Online", status: true },
];

function StepSection({ number, title, items }: { number: number; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
          {number}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <ul className="ml-10 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
            <span className="text-gray-300 mt-0.5">\u2022</span>
            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function BuildKelasOnlineGuidePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/guidance" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Video className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Build Kelas Online</h1>
          <p className="text-sm text-gray-500">Panduan lengkap membuat & mengelola kelas online</p>
        </div>
      </div>

      {/* Fitur Tersedia */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Fitur Tersedia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div key={f.name} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm text-gray-700">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Langkah Admin */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">Langkah Admin: Setup Kelas Online</h2>
        </div>
        <div className="space-y-3">
          {ADMIN_STEPS.map((step, i) => (
            <StepSection key={i} number={i + 1} title={step.title} items={step.items} />
          ))}
        </div>
      </div>

      {/* Langkah Guru */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Langkah Guru: Siapkan Konten Online</h2>
        </div>
        <div className="space-y-3">
          {GURU_STEPS.map((step, i) => (
            <StepSection key={i} number={i + 1} title={step.title} items={step.items} />
          ))}
        </div>
      </div>

      {/* Paket Publik */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-green-500" />
          <h2 className="text-lg font-semibold text-gray-800">Paket Kelas Online di Frontpage Publik</h2>
        </div>
        <div className="space-y-3">
          {PUBLIC_STEPS.map((step, i) => (
            <StepSection key={i} number={i + 1} title={step.title} items={step.items} />
          ))}
        </div>
      </div>

      {/* Monitoring */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-800">Monitoring & Evaluasi</h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Admin</h4>
            <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-600">
              <li>\u2022 Admin \u2192 Analytics \u2014 statistik kelas, siswa, guru</li>
              <li>\u2022 Admin \u2192 Manajemen Kelas \u2192 [Kelas] \u2014 cek siswa, materi, tugas</li>
              <li>\u2022 Admin \u2192 Audit Log \u2014 riwayat aktivitas (SUPER_ADMIN)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Guru</h4>
            <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-600">
              <li>\u2022 Guru \u2192 Absensi \u2014 catat kehadiran per pertemuan</li>
              <li>\u2022 Guru \u2192 Nilai \u2014 input nilai tugas/ujian</li>
              <li>\u2022 Guru \u2192 Rapor \u2014 generate rapor per periode</li>
              <li>\u2022 Guru \u2192 Jurnal Mengajar \u2014 catat materi per pertemuan</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Siswa</h4>
            <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-600">
              <li>\u2022 Siswa \u2192 Materi \u2014 akses materi kapan saja</li>
              <li>\u2022 Siswa \u2192 Kelas Online \u2014 ikuti sesi live / tonton rekaman</li>
              <li>\u2022 Siswa \u2192 Tugas & Ujian \u2014 kerjakan online</li>
              <li>\u2022 Siswa \u2192 Forum \u2014 diskusi dengan guru & teman</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-pink-500" />
          <h2 className="text-lg font-semibold text-gray-800">Tips & Best Practices</h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-sm text-gray-600">
          <p><strong>Link Meeting:</strong> Google Meet gratis hingga 100 peserta. Zoom untuk kelas besar (500+). YouTube Live untuk siaran satu arah.</p>
          <p><strong>Rekaman:</strong> Selalu tambahkan link rekaman setelah sesi agar siswa yang terlewat bisa menonton ulang.</p>
          <p><strong>Struktur Konten:</strong> Upload materi sebelum sesi live agar siswa bisa persiapan. Buat tugas dengan deadline yang jelas.</p>
          <p><strong>Absensi Online:</strong> Gunakan Guru \u2192 Absensi. Bisa juga aktifkan Absensi QR Code (feature flag FEAT_ATTENDANCE_QR).</p>
          <p><strong>Landing Page:</strong> Hero section dengan CTA jelas, tampilkan jadwal & harga, tambahkan testimoni dan video preview.</p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <Link href="/admin/guidance" className="text-sm text-gray-500 hover:text-gray-700">
          \u2190 Kembali ke Guidance
        </Link>
        <Link href="/admin/classes" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
          Mulai Buat Kelas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
