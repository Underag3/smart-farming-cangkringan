"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUp, Menu, X } from "lucide-react";
import { api } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Beranda & Tanya AI", num: "1" },
  { href: "/analisis-lahan", label: "Cek Lahan", num: "2" },
  { href: "/kalkulator-biaya", label: "Kalkulator Biaya", num: "3" },
  { href: "/peta-kalurahan", label: "Peta Kalurahan", num: "4" },
  { href: "/metodologi", label: "Audit & Data", num: "5" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");

  useEffect(() => {
    let active = true;
    api
      .health()
      .then((res) => {
        if (active) {
          setHealth(res);
          setOffline(false);
        }
      })
      .catch(() => {
        if (active) setOffline(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function handleFooterAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = quickQuery.trim();
    if (!q) return;
    setQuickQuery("");
    router.push(`/?q=${encodeURIComponent(q)}#tanya-tani`);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone text-ink">
      {/* Sticky Architectural Header */}
      <header className="sticky top-0 z-40 border-b border-[rgba(48,48,48,0.18)] bg-[#F2EADA]">
        {/* Desktop 5-cell horizontal hairline grid */}
        <div className="hidden md:grid md:grid-cols-[220px_190px_1fr_180px_170px] md:h-[50px]">
          <Link
            href="/"
            className="flex items-center px-5 font-serif text-lg tracking-tight text-[#303030] border-r border-[rgba(48,48,48,0.16)] hover:text-[#20462B]"
          >
            TaniCerdas
          </Link>

          <div className="flex flex-col justify-center px-4 text-[11px] leading-tight text-[#5C584F] border-r border-[rgba(48,48,48,0.16)]">
            <span className="font-medium text-[#303030]">Lereng Merapi</span>
            <span>
              {offline
                ? "API Offline"
                : health
                  ? health.llm_configured
                    ? "100 Lahan · LLM Aktif"
                    : "100 Lahan · Mode Hemat"
                  : "100 Lahan · Cangkringan"}
            </span>
          </div>

          <nav
            aria-label="Navigasi desktop"
            className="flex items-center gap-6 px-6 text-[13px] font-medium text-[#5C584F] border-r border-[rgba(48,48,48,0.16)]"
          >
            {NAV_ITEMS.filter((i) => i.href !== "/analisis-lahan").map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-[#20462B] ${
                    active ? "text-[#20462B] underline underline-offset-4" : ""
                  }`}
                >
                  {item.label === "Beranda & Tanya AI" ? "Tanya AI" : item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/analisis-lahan"
            className="flex items-center justify-center bg-[#1A3822] text-[13px] font-medium tracking-wide text-[#F2EADA] transition-colors hover:bg-[#20462B]"
          >
            Cek Lahan
          </Link>

          <Link
            href="/#tanya-tani"
            className="flex items-center justify-center border-l border-[rgba(48,48,48,0.16)] text-[13px] font-medium text-[#303030] transition-colors hover:bg-[#DFD7C9]/50"
          >
            Mulai Tanya
          </Link>
        </div>

        {/* Mobile Header (< md) */}
        <div className="flex h-[56px] items-center justify-between px-4 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? "Tutup menu" : "Buka menu"}
            className="flex h-10 w-10 min-h-[40px] items-center justify-center rounded-full bg-[#20462B] text-[#F2EADA]"
          >
            {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href="/"
            className="font-serif text-lg tracking-tight text-[#303030]"
          >
            TaniCerdas Cangkringan
          </Link>

          <Link
            href="/analisis-lahan"
            className="flex items-center text-[13px] font-medium text-[#303030] hover:text-[#20462B]"
          >
            Cek Lahan
          </Link>
        </div>
      </header>

      {/* Mobile Full-Height Dark Pine Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 top-[56px] z-40 flex md:hidden">
          <div className="flex h-full w-[92%] max-w-sm flex-col justify-between bg-[#112617] text-[#F2EADA] shadow-2xl">
            <nav className="flex flex-col px-6 pt-8">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`py-2 font-serif text-[30px] font-light leading-tight transition-opacity ${
                      active ? "text-[#ADB19F]" : "text-[#F2EADA] hover:opacity-80"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div>
              <div className="border-t border-[#F2EADA]/15 px-6 py-4 text-xs text-[#ADB19F]">
                <p>Wilayah Cangkringan, Sleman</p>
                <p className="mt-0.5 text-[#F2EADA]">
                  100 Lahan · 451–899 mdpl · Regosol Merapi
                </p>
              </div>
              <div className="border-t border-[#F2EADA]/15 px-6 py-4 text-xs text-[#ADB19F]">
                <p>Status Layanan</p>
                <p className="mt-0.5 text-[#F2EADA]">
                  {offline
                    ? "API Offline"
                    : health?.llm_configured
                      ? "LLM Terhubung & RAG Aktif"
                      : "Mode Hemat Deterministik"}
                </p>
              </div>
              <div className="grid grid-cols-2 border-t border-[#F2EADA]/15">
                <Link
                  href="/#tanya-tani"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-[54px] items-center justify-center bg-[#F2EADA] text-sm font-medium text-[#303030]"
                >
                  Tanya AI
                </Link>
                <Link
                  href="/analisis-lahan"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-[54px] items-center justify-center bg-[#1A3822] text-sm font-medium text-[#F2EADA]"
                >
                  Cek Lahan
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup panel menu"
            onClick={() => setDrawerOpen(false)}
            className="flex-1 bg-black/45"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Architectural Dark Pine Footer (#112617) */}
      <footer className="bg-[#112617] text-[#F2EADA]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            {/* Col 1: Quick Ask Box */}
            <div className="md:col-span-5">
              <p className="eyebrow-tag-light">Tanya Cepat</p>
              <h2 className="mt-4 max-w-sm font-serif text-3xl font-light leading-snug text-[#F2EADA]">
                Ajukan pertanyaan budidaya langsung ke asisten data.
              </h2>
              <form
                onSubmit={handleFooterAsk}
                className="mt-6 flex max-w-md items-center rounded-[4px] bg-[#2F4032] p-1.5"
              >
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Mis. biaya tanam salak 0,4 ha..."
                  className="min-h-[44px] flex-1 bg-transparent px-3 text-sm text-[#F2EADA] placeholder:text-[#ADB19F] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Kirim pertanyaan cepat"
                  className="flex h-10 w-10 min-h-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#F2EADA] text-[#112617] transition-colors hover:bg-[#DFD7C9]"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Col 2: Metadata */}
            <div className="space-y-6 text-sm md:col-span-3">
              <div>
                <p className="text-xs text-[#ADB19F]">Wilayah</p>
                <p className="mt-1">Kecamatan Cangkringan, Sleman, DIY</p>
              </div>
              <div>
                <p className="text-xs text-[#ADB19F]">Program &amp; Penyusun</p>
                <p className="mt-1">Studi Independen Vinix7</p>
                <p className="text-[#ADB19F]">Mohammad Tyas Subianto</p>
              </div>
              <div>
                <p className="text-xs text-[#ADB19F]">Prinsip Kejujuran Data</p>
                <p className="mt-1 text-[#ADB19F]">
                  Tanpa data pribadi petani · Tanpa prediksi yield R² negatif ·
                  Acuan BPS/Bapanas
                </p>
              </div>
            </div>

            {/* Col 3: Numbered Sitemap (1-5) */}
            <div className="md:col-span-4">
              <p className="text-xs text-[#ADB19F]">Peta Halaman</p>
              <div className="mt-3 border-t border-[#F2EADA]/15">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-6 border-b border-[#F2EADA]/15 py-3.5 transition-colors hover:bg-[#F2EADA]/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F2EADA]/25 text-xs text-[#ADB19F] transition-colors group-hover:border-[#F2EADA] group-hover:text-[#F2EADA]">
                      {item.num}
                    </span>
                    <span className="text-lg font-normal text-[#F2EADA]">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[#F2EADA]/15 pt-6 text-xs text-[#ADB19F]">
            <p>© TaniCerdas Cangkringan 2026</p>
            <div className="flex items-center gap-6">
              <Link href="/metodologi" className="hover:text-[#F2EADA]">
                Audit Data &amp; Batasan
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex min-h-[36px] items-center gap-1.5 hover:text-[#F2EADA]"
              >
                <span>Kembali ke atas</span>
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
