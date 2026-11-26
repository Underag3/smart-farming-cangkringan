import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "TaniCerdas Cangkringan — Asisten Agronomi & Lahan",
  description:
    "Asisten agronomi berbasis data Cangkringan: tanya budidaya, cek kesesuaian lahan, hitung RAB usaha tani, dan lihat profil 5 kalurahan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E7D32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased bg-canvas text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
