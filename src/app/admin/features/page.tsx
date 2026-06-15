import { getAllFeatureFlags, getFeatureFlagsByCategory } from "@/lib/feature-flags";
import { FeatureControlPanel } from "@/components/admin/FeatureControlPanel";

export const metadata = { title: "Feature Control Panel" };

const CATEGORY_LABELS: Record<string, string> = {
  akademik: "Akademik",
  operasional: "Operasional",
  keuangan: "Keuangan",
  komunikasi: "Komunikasi",
  laporan: "Laporan",
  portal: "Portal",
  online: "Online",
  engagement: "Engagement",
  teknis: "Teknis",
};

export default async function FeaturesPage() {
  const flagsByCategory = await getFeatureFlagsByCategory();
  const allFlags = await getAllFeatureFlags();
  const activeCount = allFlags.filter((f) => f.isActive).length;
  const totalCount = allFlags.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Control Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aktifkan atau nonaktifkan modul fitur sesuai kebutuhan lembaga. Perubahan berlaku secara real-time.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          <p className="text-sm text-gray-500 mt-1">Fitur Aktif</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{totalCount - activeCount}</p>
          <p className="text-sm text-gray-500 mt-1">Fitur Nonaktif</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total Fitur</p>
        </div>
      </div>

      {/* Feature Panels */}
      <FeatureControlPanel
        flagsByCategory={flagsByCategory}
        categoryLabels={CATEGORY_LABELS}
      />
    </div>
  );
}
