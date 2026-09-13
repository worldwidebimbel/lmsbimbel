import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAISettings, getProviderStatus } from "@/lib/ai-settings";
import { getMonthlyUsageSummary } from "@/lib/ai-guard";
import { isFeatureActive } from "@/lib/feature-flags";
import { getBranchScope } from "@/lib/branch-context";
import AiBuilderClient from "@/components/guru/AiBuilderClient";

export const metadata = { title: "AI Builder" };
export const dynamic = "force-dynamic";

export default async function AiBuilderPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  const role = session.user.role;
  const { branchId } = await getBranchScope();

  // Kelas: milik guru untuk GURU; semua kelas untuk admin yang bisa akses area guru
  const classWhere = role === "GURU" ? { teacherId: session.user.id, isActive: true } : { isActive: true };

  const [settings, jobs, usage, moduleActive, classes, subjects] = await Promise.all([
    getAISettings(),
    db.aiGenerationJob.findMany({
      where: { createdBy: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getMonthlyUsageSummary(session.user.id),
    isFeatureActive("FEAT_AI_BUILDER").catch(() => false),
    db.class.findMany({
      where: branchId ? { ...classWhere, branchId } : classWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.subject.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AiBuilderClient
      settings={settings}
      providerStatus={getProviderStatus()}
      moduleActive={moduleActive}
      jobs={JSON.parse(JSON.stringify(jobs))}
      usage={usage}
      role={role}
      quotaForRole={settings.quotas[role] ?? {}}
      classes={classes}
      subjects={subjects}
    />
  );
}
