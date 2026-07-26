import { ReactLenis, useLenis } from "lenis/react";
import { useRouterState } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
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

function ScrollToTopOnNavigate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const lenis = useLenis();

  useEffect(() => {
    // Only force top when there is no hash target (anchors handle #sections).
    if (hash) return;
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, lenis]);

  return null;
}

/** Premium inertia scrolling for the storefront (skipped when reduced motion). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={options}>
      <ScrollToTopOnNavigate />
      {children}
    </ReactLenis>
  );
}
