"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

    gsap.registerPlugin(ScrollTrigger);
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(el, { opacity: 1, filter: "blur(0px)", y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      if (immediate) {
        gsap.fromTo(
          el,
          { opacity: 0, filter: "blur(10px)", y },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.9,
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

    return () => ctx.revert();
  }, [delay, y, immediate]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
