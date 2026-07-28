import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Renders a still first-frame thumbnail from a video URL. */
export function VideoThumb({
  src,
  className,
  videoClassName,
  children,
}: {
  src: string;
  className?: string;
  videoClassName?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const thumbSrc = src.includes("#") ? src : `${src}#t=0.1`;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const paint = () => {
      try {
        if (v.readyState >= 1 && (Number.isNaN(v.currentTime) || v.currentTime < 0.05)) {
          v.currentTime = 0.1;
        }
      } catch {
        /* seek can fail on some streams */
      }
    };
    v.addEventListener("loadedmetadata", paint);
    v.addEventListener("loadeddata", paint);
    paint();
    return () => {
      v.removeEventListener("loadedmetadata", paint);
      v.removeEventListener("loadeddata", paint);
    };
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      <video
        ref={ref}
        src={thumbSrc}
        muted
        playsInline
        preload="metadata"
        className={cn("pointer-events-none h-full w-full object-cover", videoClassName)}
      />
      {children}
    </div>
  );
}
