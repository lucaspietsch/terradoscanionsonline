"use client";
import { LazyMotion, m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const loadFeatures = () => import("@/components/motion-features").then((mod) => mod.default);

/** Fade-in discreto ao rolar. Respeita prefers-reduced-motion. Framer carrega só o necessário, de forma assíncrona. */
export function Reveal({ children, delay = 0, className, y = 16 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div
        className={cn(className)}
        initial={reduce ? false : { opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
