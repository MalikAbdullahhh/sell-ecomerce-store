import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";

const options = {
  autoRaf: true,
  lerp: 0.075,
  duration: 1.15,
  smoothWheel: true,
  anchors: true,
  touchMultiplier: 1.4,
  syncTouch: false,
  wheelMultiplier: 0.95,
} as const;

/** Premium inertia scrolling for the storefront (skipped when reduced motion). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
