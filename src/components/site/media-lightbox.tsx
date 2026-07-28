import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, type TouchEvent } from "react";

export type MediaItem = { url: string; type: "image" | "video" };

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: MediaItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const open = index !== null && index >= 0 && index < items.length;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (dir: number) => {
      if (index === null || items.length <= 1) return;
      const next = (index + dir + items.length) % items.length;
      onIndexChange(next);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go, onClose]);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    if (!touchStart.current || items.length <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) go(1);
    else go(-1);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
          onClick={onClose}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X width={20} height={20} />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-6"
              >
                <ChevronLeft width={24} height={24} />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-6"
              >
                <ChevronRight width={24} height={24} />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              drag={items.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_e, info) => {
                if (items.length <= 1) return;
                if (info.offset.x < -64 || info.velocity.x < -500) go(1);
                else if (info.offset.x > 64 || info.velocity.x > 500) go(-1);
              }}
              className="max-h-[85vh] max-w-[90vw] touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              {items[index!].type === "video" ? (
                <video
                  src={items[index!].url}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="max-h-[85vh] max-w-[90vw] rounded-md"
                />
              ) : (
                <img
                  src={items[index!].url}
                  alt=""
                  draggable={false}
                  decoding="async"
                  className="max-h-[85vh] max-w-[90vw] cursor-grab rounded-md object-contain active:cursor-grabbing"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {items.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-mono text-xs text-white/70">
              {index! + 1} / {items.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
