export type GuidanceCategoryKey = "ALUR_OPERASIONAL" | "BUILD_KONTEN" | "TEKNIS_DEPLOY";

export interface GuidanceGuide {
  slug: string;
  title: string;
  description: string;
  file: string;
  icon: string;
  category: GuidanceCategoryKey;
  superAdminOnly?: boolean;
}

export const GUIDANCE_CATEGORIES: {
  key: GuidanceCategoryKey;
  label: string;
  description: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  linkColor: string;
}[] = [
  {
    key: "ALUR_OPERASIONAL",
    label: "Alur Operasional",
    description: "Alur kerja harian bimbel dari registrasi sampai pelaporan",
    accent: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-300",
    linkColor: "text-blue-600",
  },
  {
    key: "BUILD_KONTEN",
    label: "Build Kelas & Konten",
    description: "Panduan membuat kelas online, event, dan materi terstruktur",
    accent: "bg-amber-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    hoverBorder: "hover:border-amber-300",
    linkColor: "text-amber-600",
  },
  {
    key: "TEKNIS_DEPLOY",
    label: "Teknis & Deploy",
    description: "Setup server, integrasi OAuth/SMTP — khusus Super Admin",
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
    linkColor: "text-emerald-600",
  },
];

export const GUIDANCE_GUIDES: GuidanceGuide[] = [
  {
    slug: "alur-akademik",
    title: "Alur Akademik",
    description:
      "Jurnal mengajar → nilai komponen & absensi → generate raport → publish → notifikasi siswa & orang tua → download PDF.",
    file: "guide-alur-akademik.md",
    icon: "GraduationCap",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-rapor",
    title: "Alur Rapor & Rubrik Bintang",
    description:
      "Rubrik penilaian bintang 1-5 (Excel–Need Support): bintang akademik otomatis dari nilai, penilaian sikap per aspek, kesimpulan, hingga tampilan siswa/orang tua & PDF.",
    file: "guide-alur-rapor.md",
    icon: "FileBadge",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-keuangan",
    title: "Alur Keuangan & Payment Gateway",
    description:
      "Arsitektur gateway Duitku/Midtrans/Xendit, format order ID, verifikasi webhook, invoice, dan pencatatan pembayaran.",
    file: "guide-alur-keuangan.md",
    icon: "Wallet",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-ppdb",
    title: "Alur PPDB Online",
    description:
      "Pendaftaran publik 5 langkah → upload dokumen → verifikasi admin → pembayaran → konversi jadi siswa → penempatan kelas & jadwal.",
    file: "guide-alur-ppdb.md",
    icon: "UserPlus",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-payroll",
    title: "Alur Payroll Tutor",
    description:
      "Absensi tutor terdata otomatis dari jurnal → generate honor per periode → approval → slip honor PDF & export.",
    file: "guide-alur-payroll.md",
    icon: "Banknote",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-afiliator",
    title: "Alur Afiliator & Komisi",
    description:
      "Klik link referral → pendaftaran → verifikasi → pembayaran → komisi VALID → pencairan, plus anti-fraud self-referral & duplikasi.",
    file: "guide-alur-afiliator.md",
    icon: "Share2",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-cbt",
    title: "Alur Ujian / CBT",
    description:
      "Ujian berbasis komputer untuk kelas reguler & TOEFL: buat ujian, soal, timer, auto-grading, dan hasil.",
    file: "guide-alur-cbt.md",
    icon: "MonitorSmartphone",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "alur-sertifikat",
    title: "Alur E-Sertifikat",
    description:
      "Kelulusan program, juara event, peserta event: penerbitan otomatis/manual → PDF + QR → download siswa → verifikasi publik.",
    file: "guide-alur-sertifikat.md",
    icon: "Award",
    category: "ALUR_OPERASIONAL",
  },
  {
    slug: "build-kelas-online",
    title: "Build Kelas Online",
    description:
      "Panduan lengkap membuat & mengelola kelas online — setup kelas, jadwal live, materi, tugas, ujian, hingga pendaftaran publik via landing page.",
    file: "guide-build-kelas-online.md",
    icon: "Video",
    category: "BUILD_KONTEN",
  },
  {
    slug: "build-event-online",
    title: "Build Event Online Berbayar",
    description:
      "Tryout, olimpiade, workshop: role yang terlibat, pembuatan event, soal, verifikasi peserta, ranking, leaderboard & sertifikat.",
    file: "guide-build-event-online.md",
    icon: "CalendarDays",
    category: "BUILD_KONTEN",
  },
  {
    slug: "pembuatan-bab",
    title: "Pembuatan Bab (Video → Artikel → PPT → Latihan)",
    description:
      "Cara kerja fitur Bab: pengelompokan materi berurutan per chapterTitle, urutan langkah, sidebar rangkaian aktivitas, dan ujian terlampir.",
    file: "guide-pembuatan-bab.md",
    icon: "BookOpen",
    category: "BUILD_KONTEN",
  },
  {
    slug: "deploy-worldwidebimbel",
    title: "Deploy ke Hostinger (Cloud Startup)",
    description:
      "Panduan deploy LMS ke Hostinger Cloud Startup Hosting (IP 46.202.137.132): setup hPanel, Node.js 20, MySQL, SSL, build, dan routine update.",
    file: "guide-deploy-worldwidebimbel.md",
    icon: "Server",
    category: "TEKNIS_DEPLOY",
    superAdminOnly: true,
  },
  {
    slug: "oauth-smtp",
    title: "Google OAuth2 Login + SMTP Email",
    description:
      "Setup Google Login (redirect URI exact match) dan Gmail SMTP di Next.js + Auth.js v5 — termasuk solusi error umum.",
    file: "panduan-nextjs-google-oauth-smtp.md",
    icon: "KeyRound",
    category: "TEKNIS_DEPLOY",
    superAdminOnly: true,
  },
];

export function getGuidanceGuide(slug: string): GuidanceGuide | undefined {
  return GUIDANCE_GUIDES.find((g) => g.slug === slug);
}

export function getGuidanceGuidesForRole(role: string): GuidanceGuide[] {
  return GUIDANCE_GUIDES.filter((g) => !g.superAdminOnly || role === "SUPER_ADMIN");
}
