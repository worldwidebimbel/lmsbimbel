export interface GamificationData {
  totalPoints: number;
  level: number;
  levelName: string;
  levelColor: string;
  nextLevelPoints: number;
  progressToNextLevel: number;
  badges: Badge[];
  breakdown: PointBreakdown[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface PointBreakdown {
  label: string;
  count: number;
  points: number;
  icon: string;
}

const LEVELS = [
  { level: 1, name: "Pemula",      color: "text-gray-600",  bg: "bg-gray-100",   min: 0 },
  { level: 2, name: "Berkembang",  color: "text-blue-600",  bg: "bg-blue-100",   min: 100 },
  { level: 3, name: "Mahir",       color: "text-green-600", bg: "bg-green-100",  min: 300 },
  { level: 4, name: "Expert",      color: "text-purple-600",bg: "bg-purple-100", min: 600 },
  { level: 5, name: "Master",      color: "text-yellow-600",bg: "bg-yellow-100", min: 1000 },
];

export function calcLevel(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.min) current = l;
  }
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = LEVELS[nextIdx];
  const nextMin = next?.min ?? current.min;
  const progress = next
    ? Math.round(((points - current.min) / (nextMin - current.min)) * 100)
    : 100;
  return { ...current, nextLevelPoints: nextMin, progressToNextLevel: Math.min(progress, 100) };
}

export function calcPoints(stats: {
  materiSelesai: number;
  tugasDikumpulkan: number;
  tugasNilaiLulus: number;
  ujianSelesai: number;
  ujianNilaiLulus: number;
  totalHadir: number;
}): { total: number; breakdown: PointBreakdown[] } {
  const breakdown: PointBreakdown[] = [
    { label: "Materi Diselesaikan",  count: stats.materiSelesai,      points: stats.materiSelesai * 10,      icon: "📚" },
    { label: "Tugas Dikumpulkan",    count: stats.tugasDikumpulkan,   points: stats.tugasDikumpulkan * 20,   icon: "✍️" },
    { label: "Bonus Nilai Lulus",    count: stats.tugasNilaiLulus,    points: stats.tugasNilaiLulus * 10,    icon: "✅" },
    { label: "Ujian Diselesaikan",   count: stats.ujianSelesai,       points: stats.ujianSelesai * 25,       icon: "📝" },
    { label: "Bonus Ujian Lulus",    count: stats.ujianNilaiLulus,    points: stats.ujianNilaiLulus * 15,    icon: "🎯" },
    { label: "Hari Hadir",          count: stats.totalHadir,         points: stats.totalHadir * 5,          icon: "🏫" },
  ];
  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { total, breakdown: breakdown.filter((b) => b.count > 0 || b.label === "Materi Diselesaikan") };
}

export function computeBadges(stats: {
  materiSelesai: number;
  tugasDikumpulkan: number;
  ujianSelesai: number;
  totalHadir: number;
  avgGrade: number;
  maxGrade: number;
  totalPoints: number;
}): Badge[] {
  return [
    {
      id: "aktif_belajar", name: "Aktif Belajar", icon: "📚",
      description: "Selesaikan 5 materi",
      earned: stats.materiSelesai >= 5,
    },
    {
      id: "kutu_buku", name: "Kutu Buku", icon: "🎓",
      description: "Selesaikan 20 materi",
      earned: stats.materiSelesai >= 20,
    },
    {
      id: "rajin_ngerjain", name: "Rajin Ngerjain", icon: "✍️",
      description: "Kumpulkan 5 tugas",
      earned: stats.tugasDikumpulkan >= 5,
    },
    {
      id: "ahli_ujian", name: "Ahli Ujian", icon: "📝",
      description: "Selesaikan 3 ujian",
      earned: stats.ujianSelesai >= 3,
    },
    {
      id: "rajin_hadir", name: "Rajin Hadir", icon: "🏫",
      description: "Hadir 10 kali",
      earned: stats.totalHadir >= 10,
    },
    {
      id: "nilai_sempurna", name: "Nilai Sempurna", icon: "💯",
      description: "Raih nilai 100",
      earned: stats.maxGrade >= 100,
    },
    {
      id: "bintang_kelas", name: "Bintang Kelas", icon: "⭐",
      description: "Rata-rata nilai ≥ 85",
      earned: stats.avgGrade >= 85,
    },
    {
      id: "petarung", name: "Petarung", icon: "🏆",
      description: "Kumpulkan 500 poin",
      earned: stats.totalPoints >= 500,
    },
    {
      id: "master_bimbel", name: "Master Bimbel", icon: "👑",
      description: "Kumpulkan 1000 poin",
      earned: stats.totalPoints >= 1000,
    },
  ];
}
