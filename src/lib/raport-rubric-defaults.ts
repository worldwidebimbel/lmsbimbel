export type RubricTypeValue = "ACADEMIC" | "ATTITUDE";

export interface RubricSeed {
  stars: number;
  minScore: number;
  maxScore: number;
  category: string;
  description: string;
  colorHex: string;
}

export const MAX_STARS = 5;

export const DEFAULT_ACADEMIC_RUBRIC: RubricSeed[] = [
  {
    stars: 5,
    minScore: 90,
    maxScore: 100,
    category: "EXCELLENT",
    description:
      "Penguasaan materi sangat baik, mandiri, lancar, akurat, dan mampu menerapkan pengetahuan secara efektif dalam berbagai situasi.",
    colorHex: "#1e3a8a",
  },
  {
    stars: 4,
    minScore: 80,
    maxScore: 89,
    category: "VERY GOOD",
    description:
      "Penguasaan sangat baik, mampu mengerjakan dan memahami materi dengan sedikit kesalahan.",
    colorHex: "#15803d",
  },
  {
    stars: 3,
    minScore: 70,
    maxScore: 79,
    category: "GOOD",
    description:
      "Penguasaan cukup baik, mampu memahami dan menggunakan materi dalam situasi umum, tetapi masih membutuhkan beberapa perbaikan.",
    colorHex: "#ea580c",
  },
  {
    stars: 2,
    minScore: 60,
    maxScore: 69,
    category: "DEVELOPING",
    description:
      "Kemampuan dasar mulai berkembang, tetapi masih terdapat cukup banyak kesalahan dan membutuhkan bimbingan.",
    colorHex: "#9333ea",
  },
  {
    stars: 1,
    minScore: 0,
    maxScore: 59,
    category: "NEED SUPPORT",
    description:
      "Kemampuan masih pada tahap awal dan membutuhkan pendampingan serta latihan intensif.",
    colorHex: "#dc2626",
  },
];

export const DEFAULT_ATTITUDE_RUBRIC: RubricSeed[] = [
  {
    stars: 5,
    minScore: 90,
    maxScore: 100,
    category: "EXCELLENT",
    description:
      "Menunjukkan sikap yang sangat baik, disiplin, aktif, fokus, dan konsisten selama proses pembelajaran.",
    colorHex: "#1e3a8a",
  },
  {
    stars: 4,
    minScore: 80,
    maxScore: 89,
    category: "VERY GOOD",
    description:
      "Menunjukkan sikap yang baik dan konsisten, dengan sedikit hal yang masih perlu ditingkatkan.",
    colorHex: "#15803d",
  },
  {
    stars: 3,
    minScore: 70,
    maxScore: 79,
    category: "GOOD",
    description:
      "Menunjukkan sikap yang cukup baik, tetapi masih terdapat beberapa aspek yang perlu diperbaiki.",
    colorHex: "#ea580c",
  },
  {
    stars: 2,
    minScore: 60,
    maxScore: 69,
    category: "DEVELOPING",
    description:
      "Sikap dan kebiasaan belajar masih berkembang serta membutuhkan arahan dan pengingat dari guru.",
    colorHex: "#9333ea",
  },
  {
    stars: 1,
    minScore: 0,
    maxScore: 59,
    category: "NEED SUPPORT",
    description:
      "Membutuhkan pendampingan yang lebih intensif untuk membangun kedisiplinan, sikap belajar, konsentrasi, dan keaktifan.",
    colorHex: "#dc2626",
  },
];

export const DEFAULT_ATTITUDE_ASPECTS: { name: string; description: string }[] = [
  { name: "Kedisiplinan", description: "Ketepatan waktu hadir, mengumpulkan tugas, dan mengikuti aturan kelas." },
  { name: "Keaktifan", description: "Keterlibatan dalam diskusi, bertanya, dan menjawab selama pembelajaran." },
  { name: "Fokus & Konsentrasi", description: "Kemampuan mempertahankan perhatian selama sesi belajar berlangsung." },
  { name: "Kemandirian", description: "Kemampuan menyelesaikan tugas dan latihan tanpa bergantung pada bantuan." },
  { name: "Kerja Sama", description: "Sikap menghargai teman dan kemampuan bekerja dalam kelompok." },
];

export function getDefaultRubric(type: RubricTypeValue): RubricSeed[] {
  return type === "ATTITUDE" ? DEFAULT_ATTITUDE_RUBRIC : DEFAULT_ACADEMIC_RUBRIC;
}

export function matchRubricByScore<T extends { minScore: number; maxScore: number; stars: number }>(
  levels: T[],
  score: number | null | undefined,
): T | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (levels.length === 0) return null;

  const inRange = levels.find((l) => score >= l.minScore && score <= l.maxScore);
  if (inRange) return inRange;

  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  if (score < sorted[0].minScore) return sorted[0];
  return sorted[sorted.length - 1];
}

export function matchRubricByStars<T extends { stars: number }>(
  levels: T[],
  stars: number | null | undefined,
): T | null {
  if (stars === null || stars === undefined) return null;
  return levels.find((l) => l.stars === stars) ?? null;
}

export function averageStars(items: { stars: number; weight?: number }[]): number | null {
  if (items.length === 0) return null;
  const totalWeight = items.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  if (totalWeight <= 0) return null;
  const weighted = items.reduce((sum, i) => sum + i.stars * (i.weight ?? 1), 0);
  return weighted / totalWeight;
}
