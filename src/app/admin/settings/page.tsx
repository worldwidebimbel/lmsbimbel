import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDemoStatus } from "@/lib/demo-seeder";
import SettingsClient from "@/components/admin/SettingsClient";
import { Settings } from "lucide-react";

export const metadata = { title: "Pengaturan Sistem" };

const DEFAULT_SETTINGS: Record<string, string> = {
  app_name: "EduBimbel LMS",
  app_tagline: "Platform Bimbel Modern & Terpadu",
  contact_email: "",
  contact_phone: "",
  address: "",
  whatsapp_admin: "",
};

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [settingRows, demoStatus] = await Promise.all([
    db.appSetting.findMany(),
    getDemoStatus(),
  ]);

  const settings = { ...DEFAULT_SETTINGS };
  for (const r of settingRows) settings[r.key] = r.value;

  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  const appVersion = process.env.npm_package_version ?? "0.1.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          <Settings className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-sm text-gray-500">Konfigurasi umum, demo data, email, dan informasi sistem</p>
        </div>
      </div>

      <SettingsClient
        initialSettings={settings}
        demoStatus={demoStatus}
        smtpConfigured={smtpConfigured}
        appVersion={appVersion}
      />
    </div>
  );
}
