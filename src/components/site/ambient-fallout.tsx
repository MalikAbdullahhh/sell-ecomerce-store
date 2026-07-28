import { motion, useReducedMotion } from "framer-motion";
import {
  Battery,
  Bluetooth,
  CircuitBoard,
  Cpu,
  Headphones,
  Radio,
  Smartphone,
  Watch,
  Wifi,
  Zap,
} from "lucide-react";

const ICONS = [
  Cpu,
  Wifi,
  Bluetooth,
  Battery,
  Zap,
  CircuitBoard,
  Headphones,
  Smartphone,
  Watch,
  Radio,
];

/** Deterministic soft fallout — tech icons drifting down the viewport. */
const PARTICLES = [
  { left: "3%", size: 42, delay: 0, duration: 20, drift: 22 },
  { left: "11%", size: 36, delay: 2.4, duration: 24, drift: -16 },
  { left: "19%", size: 48, delay: 5.8, duration: 22, drift: 14 },
  { left: "28%", size: 34, delay: 1.1, duration: 26, drift: -20 },
  { left: "37%", size: 44, delay: 8.2, duration: 21, drift: 18 },
  { left: "46%", size: 38, delay: 3.9, duration: 25, drift: -12 },
  { left: "55%", size: 50, delay: 10.1, duration: 23, drift: 24 },
  { left: "64%", size: 32, delay: 2.0, duration: 27, drift: -18 },
  { left: "73%", size: 46, delay: 6.0, duration: 20, drift: 15 },
  { left: "82%", size: 40, delay: 12.4, duration: 24, drift: -22 },
  { left: "91%", size: 36, delay: 4.6, duration: 28, drift: 12 },
  { left: "7%", size: 30, delay: 14.5, duration: 26, drift: 10 },
  { left: "24%", size: 44, delay: 16.8, duration: 22, drift: -14 },
  { left: "42%", size: 52, delay: 13.2, duration: 25, drift: 20 },
  { left: "58%", size: 34, delay: 17.6, duration: 29, drift: -10 },
  { left: "76%", size: 48, delay: 15.1, duration: 23, drift: 16 },
  { left: "88%", size: 38, delay: 19.4, duration: 27, drift: -19 },
  { left: "15%", size: 42, delay: 21.0, duration: 24, drift: 13 },
];

export function AmbientFallout() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {PARTICLES.map((p, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <motion.div
            key={i}
            className="absolute text-primary/35 dark:text-primary/40"
            style={{ left: p.left, top: "-10%" }}
            animate={{
              y: ["0vh", "115vh"],
              x: [0, p.drift, -p.drift * 0.4, 0],
              rotate: [0, p.drift > 0 ? 22 : -22, 0],
              opacity: [0, 0.85, 0.85, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.07, 0.9, 1],
            }}
          >
            <Icon width={p.size} height={p.size} strokeWidth={1.6} />
          </motion.div>
        );
      })}
    </div>
  );
}
