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
  { left: "4%", size: 18, delay: 0, duration: 22, drift: 18 },
  { left: "12%", size: 14, delay: 3.2, duration: 26, drift: -12 },
  { left: "21%", size: 20, delay: 7.1, duration: 24, drift: 10 },
  { left: "33%", size: 13, delay: 1.4, duration: 28, drift: -16 },
  { left: "42%", size: 16, delay: 9.5, duration: 23, drift: 14 },
  { left: "55%", size: 15, delay: 4.8, duration: 27, drift: -8 },
  { left: "64%", size: 19, delay: 11.2, duration: 25, drift: 20 },
  { left: "73%", size: 12, delay: 2.6, duration: 29, drift: -14 },
  { left: "82%", size: 17, delay: 6.4, duration: 22, drift: 11 },
  { left: "91%", size: 14, delay: 13.8, duration: 26, drift: -18 },
  { left: "8%", size: 11, delay: 16, duration: 30, drift: 9 },
  { left: "48%", size: 13, delay: 18.5, duration: 24, drift: -11 },
  { left: "78%", size: 16, delay: 20.2, duration: 27, drift: 15 },
  { left: "27%", size: 12, delay: 14.7, duration: 31, drift: -7 },
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
            className="absolute text-primary/10 dark:text-primary/14"
            style={{ left: p.left, top: "-8%" }}
            animate={{
              y: ["0vh", "112vh"],
              x: [0, p.drift, 0],
              rotate: [0, p.drift > 0 ? 18 : -18, 0],
              opacity: [0, 0.35, 0.35, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.08, 0.88, 1],
            }}
          >
            <Icon width={p.size} height={p.size} strokeWidth={1.25} />
          </motion.div>
        );
      })}
    </div>
  );
}
