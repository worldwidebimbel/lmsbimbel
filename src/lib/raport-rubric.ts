import { db } from "@/lib/db";
import {
  DEFAULT_ATTITUDE_ASPECTS,
  MAX_STARS,
  getDefaultRubric,
  type RubricTypeValue,
} from "@/lib/raport-rubric-defaults";

export {
  MAX_STARS,
  DEFAULT_ACADEMIC_RUBRIC,
  DEFAULT_ATTITUDE_RUBRIC,
  DEFAULT_ATTITUDE_ASPECTS,
  getDefaultRubric,
  matchRubricByScore,
  matchRubricByStars,
  averageStars,
} from "@/lib/raport-rubric-defaults";
export type { RubricTypeValue, RubricSeed } from "@/lib/raport-rubric-defaults";

export interface RubricLevelData {
  id: string;
  type: RubricTypeValue;
  stars: number;
  minScore: number;
  maxScore: number;
  category: string;
  description: string | null;
  colorHex: string | null;
  order: number;
  isActive: boolean;
}

export async function getRubricLevels(type: RubricTypeValue): Promise<RubricLevelData[]> {
  const levels = await db.rubricLevel.findMany({
    where: { type, isActive: true },
    orderBy: { stars: "desc" },
  });
  return levels as RubricLevelData[];
}

export function starsToScore(stars: number): number {
  const clamped = Math.max(1, Math.min(MAX_STARS, stars));
  const spans = [50, 65, 75, 85, 95];
  return spans[clamped - 1];
}

export async function ensureDefaultRubric(): Promise<{ createdLevels: number; createdAspects: number }> {
  let createdLevels = 0;
  let createdAspects = 0;

  for (const type of ["ACADEMIC", "ATTITUDE"] as RubricTypeValue[]) {
    const count = await db.rubricLevel.count({ where: { type } });
    if (count > 0) continue;

    const seeds = getDefaultRubric(type);
    await db.rubricLevel.createMany({
      data: seeds.map((s) => ({
        type,
        stars: s.stars,
        minScore: s.minScore,
        maxScore: s.maxScore,
        category: s.category,
        description: s.description,
        colorHex: s.colorHex,
        order: MAX_STARS - s.stars,
      })),
    });
    createdLevels += seeds.length;
  }

  const aspectCount = await db.attitudeAspect.count();
  if (aspectCount === 0) {
    await db.attitudeAspect.createMany({
      data: DEFAULT_ATTITUDE_ASPECTS.map((a, i) => ({
        name: a.name,
        description: a.description,
        weight: 1,
        order: i,
      })),
    });
    createdAspects = DEFAULT_ATTITUDE_ASPECTS.length;
  }

  return { createdLevels, createdAspects };
}
