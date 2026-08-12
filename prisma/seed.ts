import { PrismaClient, UserRole, FeatureTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FEATURE_FLAGS = [
  {
    code: "FEAT_USER_MANAGEMENT",
    name: "Manajemen Pengguna",
    description: "Kelola data siswa, guru, dan staf lembaga",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "operasional",
    icon: "Users",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 1,
  },
  {
    code: "FEAT_CLASS_SCHEDULE",
    name: "Kelas & Jadwal",
    description: "Buat dan kelola kelas, jadwal pertemuan, dan kalender akademik",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "akademik",
    icon: "CalendarDays",
    affectedRoles: ["ADMIN", "GURU", "SISWA"],
    sortOrder: 2,
  },
  {
    code: "FEAT_MATERIALS",
    name: "Materi Pembelajaran",
    description: "Upload dan akses materi belajar (PDF, video, PPT)",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "akademik",
    icon: "BookOpen",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 3,
  },
  {
    code: "FEAT_ASSIGNMENTS",
    name: "Tugas & PR",
    description: "Kelola pemberian dan pengumpulan tugas siswa",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "akademik",
    icon: "ClipboardList",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 4,
  },
  {
    code: "FEAT_ONLINE_EXAM",
    name: "Ujian Online",
    description: "Selenggarakan ujian dan kuis online dengan timer",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "akademik",
    icon: "FileCheck",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 5,
  },
  {
    code: "FEAT_EXAM_BANK",
    name: "Bank Soal",
    description: "Kelola bank soal per mata pelajaran dan topik",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "akademik",
    icon: "Database",
    affectedRoles: ["GURU", "ADMIN"],
    sortOrder: 6,
  },
  {
    code: "FEAT_TRYOUT",
    name: "Tryout Nasional",
    description: "Simulasi ujian nasional UTBK, UN, dan olimpiade",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "akademik",
    icon: "Trophy",
    affectedRoles: ["SISWA", "GURU"],
    sortOrder: 7,
  },
  {
    code: "FEAT_ATTENDANCE",
    name: "Absensi",
    description: "Rekap kehadiran siswa per kelas dan pertemuan",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "operasional",
    icon: "CheckSquare",
    affectedRoles: ["GURU", "ADMIN", "SISWA", "ORANG_TUA"],
    sortOrder: 8,
  },
  {
    code: "FEAT_ATTENDANCE_QR",
    name: "Absensi QR Code",
    description: "Absensi otomatis menggunakan scan QR Code",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "operasional",
    icon: "QrCode",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 9,
  },
  {
    code: "FEAT_GRADES",
    name: "Nilai & Rapor",
    description: "Input nilai, hitung rapor, dan export PDF",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "akademik",
    icon: "GraduationCap",
    affectedRoles: ["GURU", "ADMIN", "SISWA", "ORANG_TUA"],
    sortOrder: 10,
  },
  {
    code: "FEAT_ANALYTICS",
    name: "Analitik & Laporan",
    description: "Dashboard analitik, statistik kelas, dan laporan kemajuan",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "laporan",
    icon: "BarChart3",
    affectedRoles: ["ADMIN", "GURU"],
    sortOrder: 11,
  },
  {
    code: "FEAT_PAYMENT_MANUAL",
    name: "Pembayaran Manual",
    description: "Kelola tagihan SPP dan konfirmasi pembayaran manual",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "keuangan",
    icon: "Wallet",
    affectedRoles: ["ADMIN", "ORANG_TUA"],
    sortOrder: 12,
  },
  {
    code: "FEAT_PAYMENT_ONLINE",
    name: "Pembayaran Online",
    description: "Integrasi gateway pembayaran Midtrans/Xendit",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "keuangan",
    icon: "CreditCard",
    affectedRoles: ["ADMIN", "ORANG_TUA"],
    sortOrder: 13,
  },
  {
    code: "FEAT_ANNOUNCEMENTS",
    name: "Pengumuman",
    description: "Broadcast pengumuman ke seluruh pengguna atau role tertentu",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "komunikasi",
    icon: "Megaphone",
    affectedRoles: ["ADMIN", "GURU", "SISWA", "ORANG_TUA"],
    sortOrder: 14,
  },
  {
    code: "FEAT_EMAIL_NOTIF",
    name: "Notifikasi Email",
    description: "Kirim notifikasi dan pengingat via email otomatis",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "komunikasi",
    icon: "Mail",
    affectedRoles: ["ADMIN"],
    sortOrder: 15,
  },
  {
    code: "FEAT_WHATSAPP_NOTIF",
    name: "Notifikasi WhatsApp",
    description: "Kirim notifikasi penting via WhatsApp API",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "komunikasi",
    icon: "MessageCircle",
    affectedRoles: ["ADMIN"],
    sortOrder: 16,
  },
  {
    code: "FEAT_FORUM",
    name: "Forum Diskusi",
    description: "Forum tanya jawab dan diskusi per mata pelajaran",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "komunikasi",
    icon: "MessagesSquare",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 17,
  },
  {
    code: "FEAT_CHAT",
    name: "Chat Private",
    description: "Chat langsung antara siswa dan guru",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "komunikasi",
    icon: "MessageSquare",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 18,
  },
  {
    code: "FEAT_LIVE_CLASS",
    name: "Kelas Online Live",
    description: "Integrasi Zoom/Google Meet untuk kelas live",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "online",
    icon: "Video",
    affectedRoles: ["GURU", "SISWA"],
    sortOrder: 19,
  },
  {
    code: "FEAT_GAMIFICATION",
    name: "Gamifikasi & Badge",
    description: "Sistem poin, badge, level, streak, dan leaderboard",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "engagement",
    icon: "Gamepad2",
    affectedRoles: ["SISWA"],
    sortOrder: 20,
  },
  {
    code: "FEAT_CERTIFICATE",
    name: "Sertifikat Digital",
    description: "Generate dan kirim sertifikat digital PDF",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "engagement",
    icon: "Award",
    affectedRoles: ["ADMIN", "SISWA"],
    sortOrder: 21,
  },
  {
    code: "FEAT_PARENT_PORTAL",
    name: "Portal Orang Tua",
    description: "Akses khusus orang tua untuk monitor perkembangan anak",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "portal",
    icon: "Users2",
    affectedRoles: ["ORANG_TUA"],
    sortOrder: 22,
  },
  {
    code: "FEAT_EVENTS",
    name: "Event Berbayar",
    description: "Kelola tryout, olimpiade, workshop, dan event berbayar lainnya",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "engagement",
    icon: "Trophy",
    affectedRoles: ["ADMIN", "SUPER_ADMIN", "SISWA"],
    sortOrder: 23,
  },
  {
    code: "FEAT_PWA",
    name: "Mode Offline (PWA)",
    description: "Instalasi sebagai app dan akses materi offline",
    isActive: false,
    tier: FeatureTier.STANDARD,
    category: "teknis",
    icon: "Smartphone",
    affectedRoles: ["SISWA", "GURU"],
    sortOrder: 24,
  },
  {
    code: "FEAT_MULTI_BRANCH",
    name: "Multi-Cabang / Multi-Branch",
    description: "Kelola lebih dari satu cabang bimbel dengan laporan terpisah",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "operasional",
    icon: "Building2",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 24,
  },
  {
    code: "FEAT_PPDB",
    name: "PPDB Online",
    description: "Penerimaan siswa baru online dengan form, upload dokumen, dan tracking status",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "operasional",
    icon: "UserCheck",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 25,
  },
  {
    code: "FEAT_AFFILIATE",
    name: "Sistem Afiliator",
    description: "Program referral afiliator dengan komisi, tracking, dan pencairan",
    isActive: true,
    tier: FeatureTier.PREMIUM,
    category: "keuangan",
    icon: "Share2",
    affectedRoles: ["ADMIN", "SUPER_ADMIN", "AFILIATOR"],
    sortOrder: 26,
  },
  {
    code: "FEAT_ROOM_MANAGEMENT",
    name: "Manajemen Ruangan",
    description: "Kelola gedung dan ruangan kelas dengan kapasitas dan jadwal",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "operasional",
    icon: "DoorOpen",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 27,
  },
  {
    code: "FEAT_AUDIT_LOG",
    name: "Audit Log",
    description: "Catatan aktivitas pengguna untuk keperluan audit dan keamanan",
    isActive: true,
    tier: FeatureTier.STANDARD,
    category: "teknis",
    icon: "ScrollText",
    affectedRoles: ["SUPER_ADMIN"],
    sortOrder: 28,
  },
  {
    code: "FEAT_AI_QUESTION",
    name: "AI Question Generator",
    description: "Generate soal otomatis dengan bantuan AI",
    isActive: false,
    tier: FeatureTier.PREMIUM,
    category: "akademik",
    icon: "Database",
    affectedRoles: ["GURU", "ADMIN"],
    sortOrder: 29,
  },
];

const SUBJECTS = [
  { name: "Matematika", code: "MTK", color: "#3B82F6", icon: "Calculator" },
  { name: "Fisika", code: "FIS", color: "#8B5CF6", icon: "Atom" },
  { name: "Kimia", code: "KIM", color: "#10B981", icon: "FlaskConical" },
  { name: "Biologi", code: "BIO", color: "#22C55E", icon: "Leaf" },
  { name: "Bahasa Indonesia", code: "BIN", color: "#EF4444", icon: "BookA" },
  { name: "Bahasa Inggris", code: "ENG", color: "#F59E0B", icon: "Globe" },
  { name: "IPA", code: "IPA", color: "#06B6D4", icon: "Microscope" },
  { name: "IPS", code: "IPS", color: "#F97316", icon: "Map" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Seed Feature Flags
  console.log("📌 Seeding feature flags...");
  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { code: flag.code },
      update: flag,
      create: flag,
    });
  }
  console.log(`✅ ${FEATURE_FLAGS.length} feature flags seeded`);

  // Seed Subjects
  console.log("📚 Seeding subjects...");
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject,
    });
  }
  console.log(`✅ ${SUBJECTS.length} subjects seeded`);

  // Seed Default Branch
  console.log("🏢 Seeding default branch...");
  const defaultBranch = await prisma.branch.upsert({
    where: { code: "MAIN" },
    update: {},
    create: {
      code: "MAIN",
      name: "Cabang Utama",
      address: "Alamat utama bimbel",
      isActive: true,
      isDefault: true,
    },
  });
  console.log(`✅ Default branch seeded: ${defaultBranch.name}`);

  // Seed Admin User
  console.log("👤 Seeding admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lmsbimbel.id" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@lmsbimbel.id",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Guru
  const guruPassword = await bcrypt.hash("guru123", 12);
  const guru = await prisma.user.upsert({
    where: { email: "guru@lmsbimbel.id" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "guru@lmsbimbel.id",
      password: guruPassword,
      role: UserRole.GURU,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Siswa
  const siswaPassword = await bcrypt.hash("siswa123", 12);
  const siswa = await prisma.user.upsert({
    where: { email: "siswa@lmsbimbel.id" },
    update: {},
    create: {
      name: "Andi Pratama",
      email: "siswa@lmsbimbel.id",
      password: siswaPassword,
      role: UserRole.SISWA,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Admin Cabang
  const adminCabangPassword = await bcrypt.hash("admincabang123", 12);
  await prisma.user.upsert({
    where: { email: "admincabang@lmsbimbel.id" },
    update: {},
    create: {
      name: "Admin Cabang Utama",
      email: "admincabang@lmsbimbel.id",
      password: adminCabangPassword,
      role: UserRole.ADMIN,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Orang Tua
  const orangtuaPassword = await bcrypt.hash("ortu123", 12);
  const orangtua = await prisma.user.upsert({
    where: { email: "orangtua@lmsbimbel.id" },
    update: {},
    create: {
      name: "Siti Rahayu",
      email: "orangtua@lmsbimbel.id",
      password: orangtuaPassword,
      role: UserRole.ORANG_TUA,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Default Programs
  console.log("🎯 Seeding default programs...");
  const defaultPrograms = [
    { title: "SD Kelas 4-6", description: "Persiapan ujian sekolah & OSN dengan pendekatan menyenangkan.", icon: "GraduationCap", color: "bg-orange-100 text-orange-700", linkUrl: "/login", order: 0, isActive: true },
    { title: "SMP Kelas 7-9", description: "Penguatan konsep & persiapan UN SMP dengan latihan soal intensif.", icon: "BookOpen", color: "bg-blue-100 text-blue-700", linkUrl: "/login", order: 1, isActive: true },
    { title: "SMA Kelas 10-12", description: "Persiapan UTBK-SNBT & ujian sekolah dengan strategi terbaik.", icon: "Award", color: "bg-purple-100 text-purple-700", linkUrl: "/login", order: 2, isActive: true },
  ];
  for (const program of defaultPrograms) {
    await prisma.siteProgram.upsert({
      where: { title: program.title },
      update: program,
      create: program,
    });
  }
  console.log(`✅ ${defaultPrograms.length} programs seeded`);

  // Seed Default Testimonials
  console.log("💬 Seeding default testimonials...");
  const defaultTestimonials = [
    { name: "Andi Wijaya", role: "Orang Tua Siswa SMP", text: "Anak saya jadi lebih rajin belajar sejak gabung EduBimbel. Sistem LMS-nya modern dan laporan perkembangannya sangat membantu.", order: 0, isActive: true },
    { name: "Siti Rahmah", role: "Siswa SMA Kelas 12", text: "Tryout UTBK-nya sangat membantu! Soal-soalnya berkualitas dan pembahasannya detail. Alhamdulillah lolos PTN impian.", order: 1, isActive: true },
    { name: "Budi Santoso", role: "Orang Tua Siswa SD", text: "Guru-gurunya sangat sabar dan profesional. Anak saya yang tadinya malas belajar matematika, sekarang jadi suka.", order: 2, isActive: true },
  ];
  for (const t of defaultTestimonials) {
    await prisma.siteTestimonial.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
  }
  console.log(`✅ ${defaultTestimonials.length} testimonials seeded`);

  // Seed Sample Blog Posts
  console.log("📝 Seeding sample blog posts...");
  const samplePosts = [
    {
      slug: "tips-belajar-efektif-utbk",
      title: "5 Tips Belajar Efektif untuk Persiapan UTBK",
      excerpt: "Strategi belajar yang terbukti efektif untuk meningkatkan nilai UTBK dan ujian sekolah.",
      content: "<p>UTBK merupakan salah satu ujian yang menentukan kelulusan masuk perguruan tinggi. Berikut tips belajar efektif:</p><ul><li>Buat jadwal belajar yang konsisten</li><li>Kerjakan latihan soal secara rutin</li><li>Review pembahasan dengan teliti</li><li>Istirahat cukup dan jaga kesehatan</li><li>Utamakan pemahaman konsep, bukan hafalan</li></ul>",
      coverImage: null,
      author: "Tim EduBimbel",
      category: "Tips",
      tags: ["utbk", "tips", "sma"],
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "cara-meningkatkan-minat-belajar-anak",
      title: "Cara Meningkatkan Minat Belajar Anak di Rumah",
      excerpt: "Panduan praktis bagi orang tua untuk membuat anak lebih antusias belajar.",
      content: "<p>Minat belajar anak sangat dipengaruhi oleh lingkungan dan pendekatan orang tua. Beberapa cara yang bisa dilakukan:</p><ul><li>Buat suasana belajar yang nyaman</li><li>Berikan pujian atas progres kecil</li><li>Gunakan media belajar yang interaktif</li><li>Jadikan belajar sebagai kegiatan menyenangkan</li><li>Komunikasikan manfaat belajar dengan bahasa anak</li></ul>",
      coverImage: null,
      author: "Tim EduBimbel",
      category: "Parenting",
      tags: ["parenting", "sd", "motivasi"],
      isPublished: true,
      publishedAt: new Date(),
    },
  ];
  for (const post of samplePosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }
  console.log(`✅ ${samplePosts.length} blog posts seeded`);

  console.log(`✅ Users seeded: superadmin, admincabang, guru, siswa, orangtua`);
  console.log("\n📋 Demo Credentials:");
  console.log("  Super Admin  : admin@lmsbimbel.id / admin123");
  console.log("  Admin Cabang : admincabang@lmsbimbel.id / admincabang123");
  console.log("  Guru         : guru@lmsbimbel.id / guru123");
  console.log("  Siswa        : siswa@lmsbimbel.id / siswa123");
  console.log("  Orang Tua    : orangtua@lmsbimbel.id / ortu123");
  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
