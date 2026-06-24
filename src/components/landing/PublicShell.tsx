import { getSiteConfig } from "@/lib/site-config";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

interface Props {
  children: React.ReactNode;
}

export default async function PublicShell({ children }: Props) {
  const cfg = await getSiteConfig();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader config={cfg} />
      <main className="flex-1">{children}</main>
      <PublicFooter config={cfg} />
    </div>
  );
}
