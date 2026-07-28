import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Product preview clip — autoplays muted; tap volume to unmute. Keeps native aspect & quality. */
export function PreviewProductVideo({
  src,
  title = "Product preview",
  className,
}: {
  src: string;
  title?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setMuted(true);
    const play = () => {
      void v.play().catch(() => undefined);
    };
    play();
    v.addEventListener("loadeddata", play);
    return () => v.removeEventListener("loadeddata", play);
  }, [src]);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next) void v.play().catch(() => undefined);
  }

  return (
    <section className={cn(className)}>
      <div className="mb-3 flex items-end justify-between gap-3 md:mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Preview
          </p>
          <h2 className="mt-1 font-display text-xl tracking-tight text-foreground md:text-2xl">
            {title}
          </h2>
        </div>
      </div>

      <div className="relative overflow-hidden border border-border bg-black/[0.04] dark:bg-white/[0.04]">
        <video
          ref={videoRef}
          src={src}
          className="mx-auto block h-auto w-full max-h-[min(80vh,820px)] object-contain"
          playsInline
          loop
          muted={muted}
          autoPlay
          preload="metadata"
          aria-label={title}
        />
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70 md:bottom-4 md:right-4"
        >
          {muted ? <VolumeX width={18} height={18} /> : <Volume2 width={18} height={18} />}
        </button>
        {muted ? (
          <p className="pointer-events-none absolute bottom-4 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white drop-shadow md:left-4">
            Tap volume for sound
          </p>
        ) : null}
      </div>
    </section>
  );
}
