import { db } from "@/lib/db";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let hideLoginInfo = false;
  try {
    const row = await db.appSetting.findUnique({ where: { key: "disable_login_info" } });
    hideLoginInfo = row?.value === "true";
  } catch {
    hideLoginInfo = false;
  }

  return <LoginForm hideLoginInfo={hideLoginInfo} />;
}
