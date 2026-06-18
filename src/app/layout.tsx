import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";

const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EduBimbel LMS",
    template: "%s | EduBimbel LMS",
  },
  description: "Sistem Manajemen Pembelajaran untuk Lembaga Bimbingan Belajar",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/icons/icon-192x192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "EduBimbel" },
  other: { "mobile-web-app-capable": "yes" },
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
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
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
