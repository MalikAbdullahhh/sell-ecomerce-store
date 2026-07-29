import { ReactLenis, useLenis } from "lenis/react";
import { useRouterState } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { useLayoutEffect, type ReactNode } from "react";
import "lenis/dist/lenis.css";

const options = {
  autoRaf: true,
  lerp: 0.14,
  smoothWheel: true,
  anchors: true,
  touchMultiplier: 1.0,
  syncTouch: false,
  wheelMultiplier: 1.0,
} as const;

function forceScrollTop(
  lenis?: { scrollTo: (y: number, opts: { immediate: boolean }) => void } | null,
) {
  lenis?.scrollTo(0, { immediate: true });
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function ScrollToTopLenis() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (hash) return;
    if (status !== "idle" || isLoading) return;
    forceScrollTop(lenis);
  }, [pathname, hash, lenis, status, isLoading]);

  return null;
}

function ScrollToTopWindow() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  useLayoutEffect(() => {
    if (hash) return;
    if (status !== "idle" || isLoading) return;
    forceScrollTop(null);
  }, [pathname, hash, status, isLoading]);

  return null;
}

/** Premium inertia scrolling for the storefront (skipped when reduced motion). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <>
        <ScrollToTopWindow />
        {children}
      </>
    );
  }

  return (
    <ReactLenis root options={options}>
      <ScrollToTopLenis />
      {children}
    </ReactLenis>
  );
}
