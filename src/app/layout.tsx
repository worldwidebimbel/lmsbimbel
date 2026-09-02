import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";
import { Providers } from "./providers";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Serif+Javanese&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
      </head>
      <body className={inter.className}>
        <FeatureFlagProvider>
          <Providers>
            {children}
            <Toaster position="top-right" richColors />
          </Providers>
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
