import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";
import { getSiteConfig } from "@/lib/site-config";

const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig();
  const name = cfg.siteName || "EduBimbel";
  const faviconUrl = cfg.faviconUrl || "/favicon.ico";
  return {
    title: { default: `${name} LMS`, template: `%s | ${name} LMS` },
    description: cfg.description || "Sistem Manajemen Pembelajaran untuk Lembaga Bimbingan Belajar",
    manifest: "/manifest.json",
    icons: { icon: faviconUrl, apple: "/icons/icon-192x192.png" },
    appleWebApp: { capable: true, statusBarStyle: "default", title: name },
    other: { "mobile-web-app-capable": "yes" },
  };
}

export const viewport: Viewport = {
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <FeatureFlagProvider>
          {children}
          <Toaster position="top-right" richColors />
        </FeatureFlagProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        ` }} />
      </body>
    </html>
  );
}
