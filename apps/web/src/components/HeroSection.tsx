"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { BlurReveal } from "@/components/BlurReveal";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    const content = contentRef.current;
    const veil = veilRef.current;
    if (!section || !media || !content || !veil) return;

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
      if (!active || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=100%",
            scrub: true,
          },
        });

        tl.to(media, { yPercent: 10, scale: 1.04, ease: "none" }, 0)
          .to(content, { y: -36, opacity: 0.35, ease: "none" }, 0)
          .to(veil, { opacity: 0.58, ease: "none" }, 0);
      }, sectionRef);

      revertCtx = () => ctx.revert();
    }

    initParallax().catch(() => {});

    return () => {
      active = false;
      if (revertCtx) revertCtx();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="sticky top-[56px] z-0 h-[calc(100vh-56px)] w-full overflow-hidden bg-[#112617] text-[#F2EADA] md:top-[50px] md:h-[calc(100vh-50px)]"
    >
      {/* Moving Landscape Layer */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <img
          src="/images/hero-merapi.jpg"
          alt="Lanskap pertanian terasering lereng Gunung Merapi di Cangkringan saat fajar"
          className="hero-kenburns h-full w-full object-cover"
        />

        {/* Merapi Summit Drifting Plume / Asap Kawah (aligned near upper-left peak) */}
        <div
          className="crater-plume-a absolute left-[24%] top-[6%] h-40 w-64 rounded-full blur-2xl md:h-52 md:w-80"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(242, 234, 218, 0.55) 0%, rgba(223, 215, 201, 0.24) 45%, transparent 75%)",
          }}
        />
        <div
          className="crater-plume-b absolute left-[26%] top-[8%] h-36 w-56 rounded-full blur-2xl md:h-48 md:w-72"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(242, 234, 218, 0.48) 0%, rgba(223, 215, 201, 0.18) 50%, transparent 75%)",
          }}
        />

        {/* Valley Morning Mist Layer A (drifting right) */}
        <div
          className="mist-layer-a absolute -left-[15%] top-[34%] h-44 w-[130%] blur-3xl md:h-56"
          style={{
            background:
              "radial-gradient(ellipse 38% 60% at 28% 50%, rgba(242, 234, 218, 0.42) 0%, transparent 70%), radial-gradient(ellipse 42% 65% at 72% 45%, rgba(223, 215, 201, 0.36) 0%, transparent 72%)",
          }}
        />

        {/* Valley Morning Mist Layer B (drifting left across terraces) */}
        <div
          className="mist-layer-b absolute -left-[15%] top-[48%] h-48 w-[130%] blur-3xl md:h-64"
          style={{
            background:
              "radial-gradient(ellipse 40% 60% at 45% 55%, rgba(242, 234, 218, 0.34) 0%, transparent 72%), radial-gradient(ellipse 35% 55% at 84% 50%, rgba(223, 215, 201, 0.30) 0%, transparent 70%)",
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
