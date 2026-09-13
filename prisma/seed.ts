import { PrismaClient, UserRole, FeatureTier } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "../src/lib/permission";
import {
  DEFAULT_ACADEMIC_RUBRIC,
  DEFAULT_ATTITUDE_RUBRIC,
  DEFAULT_ATTITUDE_ASPECTS,
  MAX_STARS,
} from "../src/lib/raport-rubric-defaults";

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
  {
    code: "FEAT_HOMEPAGE_CMS",
    name: "Homepage CMS",
    description: "Kelola konten homepage dari admin (banner, program, video, testimoni)",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "website",
    icon: "LayoutTemplate",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 30,
  },
  {
    code: "FEAT_TEACHING_JOURNAL",
    name: "Jurnal Mengajar",
    description: "Tutor mencatat jurnal per pertemuan, admin & orang tua bisa melihat",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "akademik",
    icon: "BookOpen",
    affectedRoles: ["GURU", "ADMIN", "ORANG_TUA"],
    sortOrder: 31,
  },
  {
    code: "FEAT_REPORT_CARD",
    name: "Rapor & Laporan Siswa",
    description: "Generate rapor massal per periode, publish, cetak PDF",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "akademik",
    icon: "FileText",
    affectedRoles: ["ADMIN", "GURU", "SISWA", "ORANG_TUA"],
    sortOrder: 32,
  },
  {
    code: "FEAT_TEACHER_ATTENDANCE",
    name: "Absensi Tutor",
    description: "Check-in/check-out tutor via manual/QR/kode + rekap kehadiran",
    isActive: true,
    tier: FeatureTier.BASIC,
    category: "operasional",
    icon: "Clock",
    affectedRoles: ["GURU", "ADMIN"],
    sortOrder: 33,
  },
  {
    code: "FEAT_PAYROLL",
    name: "Payroll Tutor",
    description: "Generate honor tutor, approve, slip PDF, export Excel",
    isActive: true,
    tier: FeatureTier.PREMIUM,
    category: "keuangan",
    icon: "Wallet",
    affectedRoles: ["ADMIN", "SUPER_ADMIN"],
    sortOrder: 34,
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

  // Seed Permissions
  console.log("🔐 Seeding permissions...");
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    });
  }
  console.log(`✅ ${ALL_PERMISSIONS.length} permissions seeded`);

  // Seed Role Permissions
  console.log("🔑 Seeding role permissions...");
  let rolePermCount = 0;
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const permCode of perms) {
      await prisma.rolePermission.upsert({
        where: { role_permissionCode: { role: role as UserRole, permissionCode: permCode } },
        update: {},
        create: { role: role as UserRole, permissionCode: permCode },
      });
      rolePermCount++;
    }
  }
  console.log(`✅ ${rolePermCount} role permissions seeded`);

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
      role: UserRole.ADMIN_CABANG,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Admin Keuangan
  const adminKeuanganPassword = await bcrypt.hash("adminkeuangan123", 12);
  await prisma.user.upsert({
    where: { email: "adminkeuangan@lmsbimbel.id" },
    update: {},
    create: {
      name: "Admin Keuangan",
      email: "adminkeuangan@lmsbimbel.id",
      password: adminKeuanganPassword,
      role: UserRole.ADMIN_KEUANGAN,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Admin Akademik
  const adminAkademikPassword = await bcrypt.hash("adminakademik123", 12);
  await prisma.user.upsert({
    where: { email: "adminakademik@lmsbimbel.id" },
    update: {},
    create: {
      name: "Admin Akademik",
      email: "adminakademik@lmsbimbel.id",
      password: adminAkademikPassword,
      role: UserRole.ADMIN_AKADEMIK,
      isActive: true,
      defaultBranchId: defaultBranch.id,
    },
  });

  // Seed Afiliator
  const afiliatorPassword = await bcrypt.hash("afiliator123", 12);
  await prisma.user.upsert({
    where: { email: "afiliator@lmsbimbel.id" },
    update: {},
    create: {
      name: "Afiliator Demo",
      email: "afiliator@lmsbimbel.id",
      password: afiliatorPassword,
      role: UserRole.AFILIATOR,
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

  // ============================
  // HOMEPAGE CMS SEED DATA
  // ============================

  // Social Links
  const socialLinks = [
    { platform: "Facebook", url: "https://facebook.com/worldwideeducation", icon: "Facebook", order: 1, isActive: true },
    { platform: "Instagram", url: "https://instagram.com/worldwideeducation", icon: "Instagram", order: 2, isActive: true },
    { platform: "YouTube", url: "https://youtube.com/@worldwideeducation", icon: "Youtube", order: 3, isActive: true },
    { platform: "TikTok", url: "https://tiktok.com/@worldwideeducation", icon: "Music", order: 4, isActive: true },
  ];
  for (const s of socialLinks) {
    await prisma.siteSocialLink.upsert({ where: { id: `seed-social-${s.platform}` }, update: s, create: { id: `seed-social-${s.platform}`, ...s } });
  }
  console.log(`✅ ${socialLinks.length} social links seeded`);

  // Menus (with dropdown children)
  const menuHome = await prisma.siteMenu.upsert({ where: { id: "seed-menu-home" }, update: {}, create: { id: "seed-menu-home", label: "HOME", href: "/", order: 1, isActive: true } });
  const menuTentang = await prisma.siteMenu.upsert({ where: { id: "seed-menu-tentang" }, update: {}, create: { id: "seed-menu-tentang", label: "TENTANG KAMI", href: "/tentang", order: 2, isActive: true } });
  const menuProgram = await prisma.siteMenu.upsert({ where: { id: "seed-menu-program" }, update: {}, create: { id: "seed-menu-program", label: "PROGRAM", href: "/#program", order: 3, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-program-sma" }, update: {}, create: { id: "seed-menu-program-sma", label: "Program SMA", href: "/program/sma", parentId: menuProgram.id, order: 1, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-program-smp" }, update: {}, create: { id: "seed-menu-program-smp", label: "Program SMP", href: "/program/smp", parentId: menuProgram.id, order: 2, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-menu-galeri" }, update: {}, create: { id: "seed-menu-menu-galeri", label: "GALERI", href: "/galeri", order: 4, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-testimoni" }, update: {}, create: { id: "seed-menu-testimoni", label: "TESTIMONI", href: "/#testimoni", order: 5, isActive: true } });
  const menuInfo = await prisma.siteMenu.upsert({ where: { id: "seed-menu-info" }, update: {}, create: { id: "seed-menu-info", label: "INFORMASI", href: "#", order: 6, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-info-blog" }, update: {}, create: { id: "seed-menu-info-blog", label: "Blog", href: "/blog", parentId: menuInfo.id, order: 1, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-info-faq" }, update: {}, create: { id: "seed-menu-info-faq", label: "FAQ", href: "/faq", parentId: menuInfo.id, order: 2, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-info-event" }, update: {}, create: { id: "seed-menu-info-event", label: "Event", href: "/events", parentId: menuInfo.id, order: 3, isActive: true } });
  await prisma.siteMenu.upsert({ where: { id: "seed-menu-kontak" }, update: {}, create: { id: "seed-menu-kontak", label: "KONTAK", href: "/#kontak", order: 7, isActive: true } });
  console.log(`✅ 12 menus seeded (with dropdown children)`);

  // Banners
  const banners = [
    { id: "seed-banner-1", title: "Wujudkan Mimpi", titleHighlight: "Cemerlang", subtitle: "Bimbingan belajar terbaik untuk masa depan cerah", imageUrl: null, linkUrl: "/daftar", linkLabel: "Daftar Sekarang", alignment: "left", overlayOpacity: 0.4, order: 1, isActive: true },
    { id: "seed-banner-2", title: "Belajar Lebih", titleHighlight: "Interaktif", subtitle: "Teknologi pembelajaran modern dengan guru profesional", imageUrl: null, linkUrl: "/#program", linkLabel: "Lihat Program", alignment: "left", overlayOpacity: 0.5, order: 2, isActive: true },
  ];
  for (const b of banners) {
    await prisma.siteBanner.upsert({ where: { id: b.id }, update: b, create: b });
  }
  console.log(`✅ ${banners.length} banners seeded`);

  // Quick Actions
  const quickActions = [
    { id: "seed-qa-1", title: "KONSULTASI GRATIS", description: "Konsultasi gratis dengan tim kami", icon: "Phone", theme: "blue", linkUrl: "/kontak", fileUrl: null, order: 1, isActive: true },
    { id: "seed-qa-2", title: "UNDUH PROSPEK", description: "Unduh brosur program kami", icon: "Download", theme: "yellow", linkUrl: null, fileUrl: "https://example.com/prospek.pdf", order: 2, isActive: true },
    { id: "seed-qa-3", title: "SERTIFIKASI", description: "Program bersertifikasi resmi", icon: "Award", theme: "blue", linkUrl: "/#program", fileUrl: null, order: 3, isActive: true },
  ];
  for (const qa of quickActions) {
    await prisma.siteQuickAction.upsert({ where: { id: qa.id }, update: qa, create: qa });
  }
  console.log(`✅ ${quickActions.length} quick actions seeded`);

  // Programs
  const programs = [
    { id: "seed-prog-1", title: "Program SMA", slug: "program-sma", subtitle: "Persiapan UTBK & SNMPTN", description: "Program bimbingan belajar untuk siswa SMA kelas 10-12", icon: "GraduationCap", color: "bg-blue-100 text-blue-700", imageUrl: null, features: [{ title: "Materi UTBK" }, { title: "Simulasi UTBK" }, { title: "Bank Soal" }, { title: "Tryout Online" }], levelLabel: "SMA", theme: "blue", imagePosition: "left", linkUrl: "/program/sma", order: 1, isActive: true },
    { id: "seed-prog-2", title: "Program SMP", slug: "program-smp", subtitle: "Persiapan AKM & Asesmen", description: "Program bimbingan belajar untuk siswa SMP kelas 7-9", icon: "BookOpen", color: "bg-yellow-100 text-yellow-700", imageUrl: null, features: [{ title: "Materi AKM" }, { title: "Tryout Online" }, { title: "Pembelajaran Interaktif" }, { title: "Laporan Progres" }], levelLabel: "SMP", theme: "yellow", imagePosition: "right", linkUrl: "/program/smp", order: 2, isActive: true },
    { id: "seed-prog-3", title: "Program SD", slug: "program-sd", subtitle: "Fundasi Akademik Kuat", description: "Program bimbingan belajar untuk siswa SD kelas 1-6", icon: "Users", color: "bg-blue-100 text-blue-700", imageUrl: null, features: [{ title: "Belajar Sambil Bermain" }, { title: "Pendampingan Personal" }, { title: "Materi Kurikulum Merdeka" }, { title: "Rapor Berkala" }], levelLabel: "SD", theme: "blue", imagePosition: "left", linkUrl: "/program/sd", order: 3, isActive: true },
    { id: "seed-prog-4", title: "Program TOEFL", slug: "program-toefl", subtitle: "Persiapan TOEFL ITP/PBT", description: "Program persiapan tes TOEFL dengan simulasi penuh", icon: "Award", color: "bg-yellow-100 text-yellow-700", imageUrl: null, features: [{ title: "Simulasi TOEFL" }, { title: "Audio Practice" }, { title: "Grammar Lengkap" }, { title: "Sertifikat" }], levelLabel: "Umum", theme: "yellow", imagePosition: "right", linkUrl: "/program/toefl", order: 4, isActive: true },
  ];
  for (const p of programs) {
    await prisma.siteProgram.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log(`✅ ${programs.length} programs seeded`);

  // Videos
  const videos = [
    { id: "seed-video-1", title: "Pembelajaran Interaktif di EduBimbel", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: null, duration: "3:45", category: "Pembelajaran", isFeatured: true, order: 1, isActive: true },
    { id: "seed-video-2", title: "Kegiatan Tryout Online", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: null, duration: "2:30", category: "Kegiatan", isFeatured: false, order: 2, isActive: true },
  ];
  for (const v of videos) {
    await prisma.siteVideo.upsert({ where: { id: v.id }, update: v, create: v });
  }
  console.log(`✅ ${videos.length} videos seeded`);

  // Video Highlights
  const videoHighlights = [
    { id: "seed-vh-1", title: "Aktif & Kreatif", description: "Pembelajaran yang menyenangkan", icon: "Zap", theme: "blue", order: 1, isActive: true },
    { id: "seed-vh-2", title: "Pengalaman Nyata", description: "Praktik langsung dengan simulasi", icon: "Globe", theme: "yellow", order: 2, isActive: true },
    { id: "seed-vh-3", title: "Pengembangan Diri", description: "Soft skill & karakter", icon: "Users", theme: "blue", order: 3, isActive: true },
    { id: "seed-vh-4", title: "Siap Berprestasi", description: "Hasil terbukti & terukur", icon: "TrendingUp", theme: "yellow", order: 4, isActive: true },
  ];
  for (const h of videoHighlights) {
    await prisma.siteVideoHighlight.upsert({ where: { id: h.id }, update: h, create: h });
  }
  console.log(`✅ ${videoHighlights.length} video highlights seeded`);

  // Testimonials
  const testimonials = [
    { id: "seed-test-1", name: "Budi Santoso", role: "Orang Tua", text: "Anak saya naik kelas dengan nilai yang sangat memuaskan berkat bimbingan di EduBimbel. Guru-gurunya sabar dan profesional.", photoUrl: null, avatarUrl: null, rating: 5, programName: "Program SMA", isFeatured: true, order: 1, isActive: true },
    { id: "seed-test-2", name: "Siti Rahayu", role: "Siswa", text: "Metode belajarnya interaktif dan tidak membosankan. Tryout online-nya sangat membantu persiapan UTBK.", photoUrl: null, avatarUrl: null, rating: 5, programName: "Program SMA", isFeatured: true, order: 2, isActive: true },
    { id: "seed-test-3", name: "Ahmad Hidayat", role: "Orang Tua", text: "Laporan progres anak saya selalu update. Saya bisa memantau perkembangannya kapan saja.", photoUrl: null, avatarUrl: null, rating: 5, programName: "Program SMP", isFeatured: true, order: 3, isActive: true },
  ];
  for (const t of testimonials) {
    await prisma.siteTestimonial.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`✅ ${testimonials.length} testimonials seeded`);

  // SiteConfig keys for header
  const siteConfigs = [
    { key: "header_email", value: "info@edubimbel.id" },
    { key: "header_call_center", value: "0812-3456-7890" },
    { key: "header_whatsapp_label", value: "Chat WhatsApp" },
    { key: "topbar_links", value: "REGISTER,APPLY ONLINE,BLOG,FAQS" },
    { key: "logoMaxWidth", value: "180" },
    // Counter/stats homepage
    { key: "counter_enabled", value: "true" },
    { key: "counter_display", value: "real" },
    { key: "counter_layout", value: "1" },
    { key: "counter_fake_students", value: "1200" },
    { key: "counter_fake_teachers", value: "50" },
    { key: "counter_fake_classes", value: "35" },
    { key: "counter_fake_subjects", value: "15" },
    // Header type & layout
    { key: "header_type", value: "default" },
    { key: "header_mainbar_mode", value: "light" },
    { key: "header_show_topbar", value: "true" },
    { key: "header_show_bottombar", value: "true" },
    { key: "header_sticky", value: "true" },
    { key: "header_width_mode", value: "full_width" },
    { key: "header_mainbar_max_height", value: "80" },
    // Colors - Top Bar
    { key: "header_topbar_bg", value: "#1e3a5f" },
    { key: "header_topbar_text", value: "#ffffff" },
    // Colors - Bottom Bar / Menu
    { key: "header_bottombar_bg", value: "#1e40af" },
    { key: "header_menu_text", value: "#ffffff" },
    { key: "header_menu_font_size", value: "14" },
    { key: "header_menu_hover", value: "#eab308" },
    { key: "header_menu_active", value: "#eab308" },
    { key: "header_menu_hover_effect", value: "color" },
    // CTA & WhatsApp buttons
    { key: "header_cta_bg", value: "#22c55e" },
    { key: "header_cta_text", value: "#ffffff" },
    { key: "header_whatsapp_bg", value: "#22c55e" },
    { key: "header_whatsapp_text", value: "#ffffff" },
  ];
  for (const c of siteConfigs) {
    const existing = await prisma.siteConfig.findUnique({ where: { key: c.key } });
    if (!existing) await prisma.siteConfig.create({ data: c });
  }
  console.log(`✅ ${siteConfigs.length} site config keys seeded`);

  // Custom Pages (default: Syarat & Ketentuan, Kebijakan Privasi)
  // Slug berbeda dari hardcoded routes (/syarat-ketentuan, /kebijakan-privasi) — admin pilih mau pakai versi hardcoded atau CustomPage
  const TERMS_HTML = `<h2>Syarat & Ketentuan Penggunaan</h2><p>Dengan mengakses dan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut. Mohon baca dengan seksama.</p><h3>1. Pendaftaran</h3><p>Pengguna wajib memberikan informasi yang akurat, valid, dan terkini saat mendaftar. Akun yang dibuat tidak boleh dipindahtangankan.</p><h3>2. Penggunaan Layanan</h3><p>Layanan ini disediakan untuk keperluan pendidikan. Pengguna dilarang menyalahgunakan platform untuk tujuan ilegal atau merugikan pihak lain.</p><h3>3. Pembayaran</h3><p>Biaya layanan dijelaskan saat pendaftaran. Pembayaran yang telah dilakukan tidak dapat dikembalikan kecuali dalam kondisi tertentu sesuai kebijakan refund.</p><h3>4. Konten</h3><p>Seluruh konten materi pembelajaran adalah milik lembaga dan dilindungi hak cipta. Dilarang menyalin, menyebarluaskan, atau menggunakan tanpa izin.</p><h3>5. Perubahan</h3><p>Kami berhak mengubah syarat ini sewaktu-waktu. Perubahan akan diumumkan melalui platform.</p><p>Untuk pertanyaan, hubungi kami melalui kontak yang tersedia.</p>`;
  const PRIVACY_HTML = `<h2>Kebijakan Privasi</h2><p>Kami menghormati privasi Anda. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.</p><h3>1. Data yang Dikumpulkan</h3><p>Nama, email, nomor telepon, dan informasi akademik yang relevan untuk keperluan pembelajaran.</p><h3>2. Penggunaan Data</h3><p>Data digunakan untuk: (a) menyediakan layanan pembelajaran, (b) komunikasi terkait program, (c) administrasi keuangan.</p><h3>3. Perlindungan Data</h3><p>Kami menerapkan langkah keamanan teknis dan organisasi untuk melindungi data Anda dari akses tidak sah.</p><h3>4. Pembagian Data</h3><p>Kami tidak menjual atau membagikan data Anda kepada pihak ketiga kecuali diwajibkan oleh hukum.</p><h3>5. Hak Pengguna</h3><p>Anda berhak mengakses, memperbaiki, atau menghapus data pribadi Anda. Hubungi kami untuk permintaan tersebut.</p><p>Pertanyaan terkait privasi? Hubungi kami melalui kontak yang tersedia.</p>`;

  const customPages = [
    {
      slug: "terms",
      title: "Syarat & Ketentuan",
      sections: [{ type: "CONTENT", title: "", content: TERMS_HTML, bgColor: "#ffffff", textColor: "#1f2937", maxWidth: "3xl" }],
      showTitle: true,
      showHeader: true,
      showFooter: true,
      metaTitle: "Syarat & Ketentuan",
      metaDesc: "Syarat dan ketentuan penggunaan platform bimbingan belajar.",
      isPublished: false,
    },
    {
      slug: "privacy-policy",
      title: "Kebijakan Privasi",
      sections: [{ type: "CONTENT", title: "", content: PRIVACY_HTML, bgColor: "#ffffff", textColor: "#1f2937", maxWidth: "3xl" }],
      showTitle: true,
      showHeader: true,
      showFooter: true,
      metaTitle: "Kebijakan Privasi",
      metaDesc: "Kebijakan privasi dan perlindungan data pribadi pengguna.",
      isPublished: false,
    },
  ];
  for (const p of customPages) {
    const existing = await prisma.customPage.findUnique({ where: { slug: p.slug } });
    if (!existing) await prisma.customPage.create({ data: p });
  }
  console.log(`✅ ${customPages.length} custom pages seeded`);

  // Rubrik penilaian rapor (bintang 1-5)
  const rubricSeeds = [
    ...DEFAULT_ACADEMIC_RUBRIC.map((r) => ({ ...r, type: "ACADEMIC" as const })),
    ...DEFAULT_ATTITUDE_RUBRIC.map((r) => ({ ...r, type: "ATTITUDE" as const })),
  ];
  for (const r of rubricSeeds) {
    const data = {
      minScore: r.minScore,
      maxScore: r.maxScore,
      category: r.category,
      description: r.description,
      colorHex: r.colorHex,
      order: MAX_STARS - r.stars,
    };
    await prisma.rubricLevel.upsert({
      where: { type_stars: { type: r.type, stars: r.stars } },
      update: data,
      create: { type: r.type, stars: r.stars, ...data },
    });
  }
  console.log(`✅ ${rubricSeeds.length} rubric levels seeded`);

  for (const [i, a] of DEFAULT_ATTITUDE_ASPECTS.entries()) {
    const existingAspect = await prisma.attitudeAspect.findFirst({ where: { name: a.name } });
    if (existingAspect) {
      await prisma.attitudeAspect.update({
        where: { id: existingAspect.id },
        data: { description: a.description },
      });
    } else {
      await prisma.attitudeAspect.create({
        data: { name: a.name, description: a.description, weight: 1, order: i },
      });
    }
  }
  console.log(`✅ ${DEFAULT_ATTITUDE_ASPECTS.length} attitude aspects seeded`);

  console.log(`✅ Users seeded: superadmin, admincabang, adminkeuangan, adminakademik, afiliator, guru, siswa, orangtua`);
  console.log("\n📋 Demo Credentials:");
  console.log("  Super Admin      : admin@lmsbimbel.id / admin123");
  console.log("  Admin Cabang     : admincabang@lmsbimbel.id / admincabang123");
  console.log("  Admin Keuangan   : adminkeuangan@lmsbimbel.id / adminkeuangan123");
  console.log("  Admin Akademik   : adminakademik@lmsbimbel.id / adminakademik123");
  console.log("  Afiliator        : afiliator@lmsbimbel.id / afiliator123");
  console.log("  Guru             : guru@lmsbimbel.id / guru123");
  console.log("  Siswa            : siswa@lmsbimbel.id / siswa123");
  console.log("  Orang Tua        : orangtua@lmsbimbel.id / ortu123");
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
