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
  y = 20,
  immediate = false,
}: BlurRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      el.style.filter = "none";
      el.style.transform = "none";
      return;
    }

    let active = true;
    let observer: IntersectionObserver | null = null;
    let revertCtx: (() => void) | null = null;

    async function animateElement() {
      const { default: gsap } = await import("gsap");
      if (!active || !ref.current) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { opacity: 0, filter: "blur(8px)", y },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.75,
            delay,
            ease: "power3.out",
            clearProps: "filter,transform,opacity",
          }
        );
      }, ref);

      revertCtx = () => ctx.revert();
    }

    if (immediate) {
      animateElement().catch(() => {});
    } else {
      el.style.opacity = "0";
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            animateElement().catch(() => {});
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
      );
      observer.observe(el);
    }

    return () => {
      active = false;
      observer?.disconnect();
      if (revertCtx) revertCtx();
    };
  }, [delay, y, immediate]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
