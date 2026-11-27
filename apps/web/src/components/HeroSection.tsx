"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";

export function HeroSection() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    const content = contentRef.current;
    const veil = veilRef.current;
    const curtain = document.getElementById("curtain-content");
    if (!media || !content || !veil || !curtain) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let active = true;
    let revertCtx: (() => void) | null = null;

    async function initParallax() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!active || !mediaRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: curtain,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });

        tl.to(media, { yPercent: 8, scale: 1.03, ease: "none" }, 0)
          .to(content, { y: -32, opacity: 0.35, ease: "none" }, 0)
          .to(veil, { opacity: 0.55, ease: "none" }, 0);
      });

      revertCtx = () => ctx.revert();
    }

    initParallax().catch(() => {});

    return () => {
      active = false;
      if (revertCtx) revertCtx();
    };
  }, []);

  return (
    <section className="sticky top-[56px] z-0 h-[calc(100vh-56px)] w-full overflow-hidden bg-[#112617] text-[#F2EADA] md:top-[50px] md:h-[calc(100vh-50px)]">
      {/* Moving Landscape Layer (oversized vertically to prevent top gap during parallax) */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[12%] -bottom-[12%]"
      >
        <img
          src="/images/hero-merapi.jpg"
          alt="Lanskap pertanian terasering lereng Gunung Merapi di Cangkringan saat fajar"
          className="hero-kenburns h-full w-full object-cover"
        />

        {/* Localized Merapi Summit Plume / Asap Kawah (subtle, does not wash out hills) */}
        <div
          className="crater-plume-a absolute left-[25%] top-[5%] h-24 w-44 rounded-full mix-blend-screen blur-2xl md:h-28 md:w-52"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(235, 240, 238, 0.38) 0%, rgba(220, 226, 224, 0.14) 50%, transparent 78%)",
          }}
        />
        <div
          className="crater-plume-b absolute left-[27%] top-[7%] h-20 w-40 rounded-full mix-blend-screen blur-2xl md:h-24 md:w-48"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(235, 240, 238, 0.32) 0%, rgba(220, 226, 224, 0.10) 52%, transparent 78%)",
          }}
        />

        {/* Subtle Drifting Valley Mist Ribbon A */}
        <div
          className="mist-layer-a absolute -left-[10%] top-[38%] h-24 w-[120%] mix-blend-screen blur-2xl md:h-28"
          style={{
            background:
              "radial-gradient(ellipse 32% 55% at 32% 50%, rgba(232, 238, 234, 0.22) 0%, transparent 72%), radial-gradient(ellipse 36% 55% at 72% 48%, rgba(232, 238, 234, 0.18) 0%, transparent 72%)",
          }}
        />

        {/* Subtle Drifting Valley Mist Ribbon B */}
        <div
          className="mist-layer-b absolute -left-[10%] top-[48%] h-24 w-[120%] mix-blend-screen blur-2xl md:h-28"
          style={{
            background:
              "radial-gradient(ellipse 34% 50% at 52% 50%, rgba(232, 238, 234, 0.18) 0%, transparent 72%)",
          }}
        />
      </div>

      {/* Base Botanical Contrast Scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#112617]/65 via-[#112617]/20 to-[#112617]/85"
      />

      {/* Scroll-Driven Darkening Veil as Next Section Slides Over */}
      <div
        ref={veilRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#112617] opacity-0"
      />

      {/* Foreground Typography & Dual CTAs */}
      <div
        ref={contentRef}
        className="relative z-10 flex h-full flex-col justify-between"
      >
        <div className="flex items-start justify-between px-5 pt-7 md:px-10 md:pt-8">
          <BlurReveal immediate y={16}>
            <h1 className="font-serif text-[44px] font-light uppercase leading-none tracking-[-0.02em] text-[#F2EADA] drop-shadow-sm sm:text-6xl md:text-[78px]">
              TANICERDAS
            </h1>
          </BlurReveal>
          <p className="vertical-display font-serif text-[26px] font-light uppercase leading-none tracking-[0.06em] text-[#F2EADA]/95 sm:text-4xl md:text-[56px]">
            CANGKRINGAN
          </p>
        </div>

        <div className="flex flex-col justify-between gap-8 px-5 pb-8 md:flex-row md:items-end md:px-10 md:pb-10">
          <BlurReveal immediate delay={0.12} className="max-w-md md:ml-[24%]">
            <p className="font-serif text-3xl font-light leading-[1.15] text-[#F2EADA] md:text-[42px]">
              Memahami Lahan Merapi, Menanam Lebih Terukur
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link href="/analisis-lahan" className="btn-drs-primary">
                Cek Lahan Anda
              </Link>
              <a href="#tanya-tani" className="btn-drs-dashed-light">
                Tanya Asisten AI
              </a>
            </div>
          </BlurReveal>

          <a
            href="#cerita-lahan"
            className="inline-flex items-center gap-3 self-end text-xs tracking-wide text-[#F2EADA]/90 hover:text-[#F2EADA]"
          >
            <span>Gulir untuk jelajahi</span>
            <ArrowDown className="h-4 w-4 arrows-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
