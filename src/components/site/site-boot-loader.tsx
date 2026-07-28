import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useBrand, useStore } from "@/lib/store";

const BOOT_KEY = "aperture-boot-done";

/**
 * Full-screen loader shown once per browser session until site settings are ready.
 * Catalogue continues loading in the background so first paint is much faster.
 */
export function SiteBootLoader() {
  const { settingsReady } = useStore();
  const { name: brandName } = useBrand();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return sessionStorage.getItem(BOOT_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [exiting, setExiting] = useState(false);

  // Settings are often cached — don't wait on the full product catalogue.
  const ready = settingsReady;

  useEffect(() => {
    if (!visible || !ready) return;
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* ignore */
    }
    setExiting(true);
    const t = window.setTimeout(() => setVisible(false), reduce ? 0 : 140);
    return () => window.clearTimeout(t);
  }, [visible, ready, reduce]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {(visible || exiting) && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background text-foreground"
          initial={false}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          aria-busy={!ready}
          aria-live="polite"
        >
          <div className="relative flex flex-col items-center px-6">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
              animate={reduce ? undefined : { scale: [0.9, 1.15, 0.9], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative font-display text-3xl font-semibold tracking-[-0.04em] md:text-4xl"
            >
              {brandName}
            </motion.p>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
            >
              Loading
            </motion.p>

            <div className="relative mt-10 h-[2px] w-44 overflow-hidden bg-border md:w-56">
              <motion.span
                className="absolute inset-y-0 left-0 bg-primary"
                initial={{ width: "8%" }}
                animate={
                  ready
                    ? { width: "100%" }
                    : reduce
                      ? { width: "45%" }
                      : { width: ["12%", "68%", "42%", "86%", "55%"] }
                }
                transition={
                  ready
                    ? { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                }
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
