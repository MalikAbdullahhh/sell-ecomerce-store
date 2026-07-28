import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Product preview clip — autoplays muted; tap the volume control to unmute. */
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
      <div className="mb-3 flex items-end justify-between gap-3 md:mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Preview
          </p>
          <h2 className="mt-1 font-display text-xl tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
        </div>
      </div>

      <div className="relative overflow-hidden border border-border bg-foreground/[0.03]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, hsl(var(--primary) / 0.18), transparent 55%), radial-gradient(ellipse at 90% 100%, hsl(var(--foreground) / 0.06), transparent 45%)",
          }}
        />
        <div className="relative aspect-[9/14] max-h-[70vh] w-full md:aspect-video md:max-h-[min(72vh,720px)]">
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full object-cover"
            playsInline
            loop
            muted={muted}
            autoPlay
            preload="metadata"
            aria-label={title}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70 md:bottom-5 md:right-5 md:h-12 md:w-12"
          >
            {muted ? <VolumeX width={18} height={18} /> : <Volume2 width={18} height={18} />}
          </button>
          {muted ? (
            <p className="pointer-events-none absolute bottom-4 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80 md:bottom-6 md:left-5 md:text-[11px]">
              Tap volume for sound
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
