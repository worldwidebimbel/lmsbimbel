import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EduBimbel LMS",
    template: "%s | EduBimbel LMS",
  },
  description: "Sistem Manajemen Pembelajaran untuk Lembaga Bimbingan Belajar",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
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
      </body>
    </html>
  );
}
