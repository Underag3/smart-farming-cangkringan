"use client";

import { useEffect, useRef } from "react";

interface BlurRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  immediate?: boolean;
}

export function BlurReveal({
  children,
  className = "",
  delay = 0,
  y = 22,
  immediate = false,
}: BlurRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = true;
    let revertCtx: (() => void) | null = null;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      el.style.filter = "blur(0px)";
      el.style.transform = "none";
      return;
    }

    async function runAnimation() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!active || !ref.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        if (immediate) {
          gsap.fromTo(
            el,
            { opacity: 0, filter: "blur(10px)", y },
            {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              duration: 0.85,
              delay,
              ease: "power3.out",
            }
          );
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, filter: "blur(10px)", y },
            {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              duration: 0.85,
              delay,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            }
          );
        }
      }, ref);

      revertCtx = () => ctx.revert();
    }

    runAnimation().catch(() => {});

    return () => {
      active = false;
      if (revertCtx) revertCtx();
    };
  }, [delay, y, immediate]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
