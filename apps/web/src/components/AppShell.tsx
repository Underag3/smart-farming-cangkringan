"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calculator,
  FileCheck2,
  MapPin,
  MessageSquareText,
  Sprout,
} from "lucide-react";
import { api } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Tanya AI", shortLabel: "Chat", icon: MessageSquareText },
  {
    href: "/analisis-lahan",
    label: "Cek Lahan",
    shortLabel: "Lahan",
    icon: Sprout,
  },
  {
    href: "/kalkulator-biaya",
    label: "Hitung Biaya",
    shortLabel: "Biaya",
    icon: Calculator,
  },
  {
    href: "/peta-kalurahan",
    label: "Kalurahan",
    shortLabel: "Peta",
    icon: MapPin,
  },
  {
    href: "/metodologi",
    label: "Data & Audit",
    shortLabel: "Data",
    icon: FileCheck2,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [offline, setOffline] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 min-h-[44px]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf text-white">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold leading-tight text-ink">
                TaniCerdas Cangkringan
              </p>
              <p className="text-xs text-ink-muted">
                Asisten Lahan &amp; RAB Lereng Merapi
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-leaf text-white"
                      : "text-ink-muted hover:bg-leaf-soft hover:text-leaf-dark"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
            {offline ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                API Offline
              </span>
            ) : health ? (
              <span className="rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-semibold text-leaf-dark">
                {health.llm_configured ? "LLM Aktif" : "Mode Hemat"}
              </span>
            ) : (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-ink-muted">
                Memuat...
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-5 md:pb-10">
        {children}
      </main>

      <nav
        aria-label="Navigasi utama mobile"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white md:hidden"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-semibold ${
                  active ? "text-leaf" : "text-ink-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
