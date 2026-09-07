import { StarRating, CategoryBadge } from "@/components/raport/StarRating";

interface RubricLevelLite {
  type: "ACADEMIC" | "ATTITUDE";
  stars: number;
  category: string;
  description: string | null;
  colorHex: string | null;
}

interface AttitudeEntry {
  aspectId: string;
  stars: number;
  note: string | null;
  aspect: { id: string; name: string; order: number };
}

export interface RaportRubricData {
  academicStars: number | null;
  academicCategory: string | null;
  academicDescription: string | null;
  attitudeStars: number | null;
  attitudeCategory: string | null;
  attitudeDescription: string | null;
  attitudeNote: string | null;
  attitudes: AttitudeEntry[];
}

export default function RaportRubricSummary({
  raport,
  rubricLevels,
}: {
  raport: RaportRubricData;
  rubricLevels: RubricLevelLite[];
}) {
  function level(type: "ACADEMIC" | "ATTITUDE", stars: number | null) {
    if (stars === null) return null;
    return rubricLevels.find((l) => l.type === type && l.stars === stars) ?? null;
  }

  const academicLevel = level("ACADEMIC", raport.academicStars);
  const attitudeLevel = level("ATTITUDE", raport.attitudeStars);

  const hasAcademic = raport.academicStars !== null;
  const hasAttitude = raport.attitudeStars !== null || raport.attitudes.length > 0;

  if (!hasAcademic && !hasAttitude) return null;

  const sortedAttitudes = [...raport.attitudes].sort((a, b) => a.aspect.order - b.aspect.order);

  return (
    <div className="space-y-3">
      {hasAcademic && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Capaian Akademik
          </p>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <StarRating value={raport.academicStars} size="md" />
            <CategoryBadge category={raport.academicCategory} colorHex={academicLevel?.colorHex} />
          </div>
          <p className="text-sm text-gray-600">
            {raport.academicDescription ?? academicLevel?.description ?? "—"}
          </p>
        </div>
      )}

      {hasAttitude && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sikap dalam Belajar
          </p>
          {raport.attitudeStars !== null && (
            <>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <StarRating value={raport.attitudeStars} size="md" />
                <CategoryBadge category={raport.attitudeCategory} colorHex={attitudeLevel?.colorHex} />
              </div>
              <p className="text-sm text-gray-600">
                {raport.attitudeDescription ?? attitudeLevel?.description ?? "—"}
              </p>
            </>
          )}

          {sortedAttitudes.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2">
              {sortedAttitudes.map((entry) => {
                const entryLevel = level("ATTITUDE", entry.stars);
                return (
                  <li key={entry.aspectId} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-[130px] text-gray-700">{entry.aspect.name}</span>
                    <StarRating value={entry.stars} size="sm" />
                    <CategoryBadge category={entryLevel?.category} colorHex={entryLevel?.colorHex} />
                    {entry.note && <span className="text-xs italic text-gray-500">{entry.note}</span>}
                  </li>
                );
              })}
            </ul>
          )}

          {raport.attitudeNote && (
            <p className="mt-2 border-t border-gray-200 pt-2 text-xs italic text-gray-500">
              Catatan: {raport.attitudeNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
