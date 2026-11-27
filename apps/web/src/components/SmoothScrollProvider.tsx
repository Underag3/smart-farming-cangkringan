"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scrollToTopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    let cleanupFn: (() => void) | null = null;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      return;
    }

    async function initSmoothScroll() {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

      if (!active) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.95,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const onTick = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);

      scrollToTopRef.current = () => {
        lenis.scrollTo(0, { immediate: true });
      };

      cleanupFn = () => {
        scrollToTopRef.current = null;
        gsap.ticker.remove(onTick);
        lenis.destroy();
      };
    }

    initSmoothScroll().catch(() => {});

    return () => {
      active = false;
      if (cleanupFn) cleanupFn();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) {
      if (scrollToTopRef.current) {
        scrollToTopRef.current();
      } else {
        window.scrollTo(0, 0);
      }
    }
    const id = window.setTimeout(async () => {
      try {
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        ScrollTrigger.refresh();
      } catch {
        // ignore if not loaded yet
      }
    }, 150);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
