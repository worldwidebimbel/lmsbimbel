import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAISettings, getProviderStatus } from "@/lib/ai-settings";
import { getMonthlyUsageSummary } from "@/lib/ai-guard";
import { isFeatureActive } from "@/lib/feature-flags";
import AiBuilderClient from "@/components/guru/AiBuilderClient";

export const metadata = { title: "AI Builder" };
export const dynamic = "force-dynamic";

export default async function AiBuilderPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const [settings, jobs, usage, moduleActive] = await Promise.all([
    getAISettings(),
    db.aiGenerationJob.findMany({
      where: { createdBy: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getMonthlyUsageSummary(session.user.id),
    isFeatureActive("FEAT_AI_BUILDER").catch(() => false),
  ]);

  return (
    <AiBuilderClient
      settings={settings}
      providerStatus={getProviderStatus()}
      moduleActive={moduleActive}
      jobs={JSON.parse(JSON.stringify(jobs))}
      usage={usage}
      role={session.user.role}
      quotaForRole={settings.quotas[session.user.role] ?? {}}
    />
  );
}
