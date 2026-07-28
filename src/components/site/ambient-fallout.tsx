import { motion, useReducedMotion } from "framer-motion";
import {
  Battery,
  Bluetooth,
  CircuitBoard,
  Cpu,
  Gamepad2,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Mic,
  Monitor,
  Mouse,
  Radio,
  Smartphone,
  Speaker,
  Tablet,
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
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Gamepad2,
  Speaker,
  Mic,
  Tablet,
  MemoryStick,
];

/** Deterministic soft fallout — tech icons drifting down the viewport. */
const PARTICLES = [
  { left: "2%", size: 40, delay: 0, duration: 19, drift: 20 },
  { left: "7%", size: 34, delay: 1.8, duration: 23, drift: -14 },
  { left: "12%", size: 48, delay: 4.2, duration: 21, drift: 16 },
  { left: "17%", size: 32, delay: 0.6, duration: 25, drift: -18 },
  { left: "22%", size: 44, delay: 6.5, duration: 20, drift: 12 },
  { left: "27%", size: 36, delay: 2.9, duration: 24, drift: -22 },
  { left: "32%", size: 50, delay: 8.1, duration: 22, drift: 18 },
  { left: "37%", size: 30, delay: 1.2, duration: 26, drift: -10 },
  { left: "42%", size: 46, delay: 5.4, duration: 19, drift: 24 },
  { left: "47%", size: 38, delay: 9.7, duration: 27, drift: -16 },
  { left: "52%", size: 42, delay: 3.3, duration: 23, drift: 14 },
  { left: "57%", size: 34, delay: 11.0, duration: 21, drift: -20 },
  { left: "62%", size: 52, delay: 7.2, duration: 25, drift: 22 },
  { left: "67%", size: 36, delay: 2.1, duration: 20, drift: -12 },
  { left: "72%", size: 44, delay: 10.4, duration: 24, drift: 15 },
  { left: "77%", size: 32, delay: 4.8, duration: 28, drift: -19 },
  { left: "82%", size: 48, delay: 12.6, duration: 22, drift: 11 },
  { left: "87%", size: 38, delay: 6.0, duration: 26, drift: -24 },
  { left: "92%", size: 40, delay: 13.9, duration: 21, drift: 17 },
  { left: "96%", size: 34, delay: 8.8, duration: 25, drift: -13 },
  { left: "4%", size: 46, delay: 15.2, duration: 23, drift: 19 },
  { left: "14%", size: 30, delay: 16.8, duration: 27, drift: -15 },
  { left: "24%", size: 50, delay: 14.1, duration: 20, drift: 21 },
  { left: "34%", size: 36, delay: 17.5, duration: 24, drift: -11 },
  { left: "44%", size: 42, delay: 19.0, duration: 22, drift: 13 },
  { left: "54%", size: 48, delay: 15.9, duration: 26, drift: -23 },
  { left: "64%", size: 32, delay: 18.4, duration: 21, drift: 16 },
  { left: "74%", size: 44, delay: 20.2, duration: 25, drift: -17 },
  { left: "84%", size: 38, delay: 16.3, duration: 23, drift: 20 },
  { left: "94%", size: 46, delay: 21.1, duration: 27, drift: -14 },
  { left: "9%", size: 34, delay: 22.5, duration: 24, drift: 12 },
  { left: "29%", size: 40, delay: 23.8, duration: 20, drift: -18 },
  { left: "49%", size: 52, delay: 22.0, duration: 26, drift: 23 },
  { left: "69%", size: 36, delay: 24.6, duration: 22, drift: -10 },
  { left: "89%", size: 42, delay: 25.2, duration: 25, drift: 15 },
  { left: "19%", size: 30, delay: 26.4, duration: 21, drift: -21 },
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
