import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { RotateCcw, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminBtn, adminBtnGhost, adminBtnOutline } from "./field";
import { cn } from "@/lib/utils";

export type AspectOption = {
  label: string;
  value: number | undefined;
};

const ASPECTS: AspectOption[] = [
  { label: "1:1", value: 1 },
  { label: "Free", value: undefined },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

type Props = {
  /** Object URL or remote image URL to edit. */
  src: string;
  open: boolean;
  title?: string;
  onClose: () => void;
  /** Called with a cropped File ready to upload. */
  onApply: (file: File) => void | Promise<void>;
  /** Optional: skip editing and keep original. */
  onSkip?: () => void;
  fileName?: string;
  /**
   * Default crop aspect when the editor opens.
   * Product gallery uses 1 (square) to match the PDP frame.
   */
  defaultAspect?: number | undefined;
};

export function ImageEditorModal({
  src,
  open,
  title = "Edit image",
  onClose,
  onApply,
  onSkip,
  fileName = "image.jpg",
  defaultAspect = 1,
}: Props) {
  const cropperRef = useRef<CropperRef>(null);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saving, setSaving] = useState(false);
  /** Track rotation so the slider stays in sync with button clicks. */
  const [rotation, setRotation] = useState(0);
  /** Track zoom level (1 = 100%) for the slider. */
  const [zoom, setZoom] = useState(1);

  // Reset all state when the modal opens or src changes.
  useEffect(() => {
    if (!open) return;
    setAspect(defaultAspect);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setZoom(1);
  }, [open, src, defaultAspect]);

  // Keyboard close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  /** Rotate by a fixed increment (button clicks). */
  const rotateBy = useCallback((delta: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotateImage(delta);
      setRotation((r) => r + delta);
    }
  }, []);

  /** Set an absolute rotation target from the slider. */
  const setAbsoluteRotation = useCallback(
    (target: number) => {
      if (cropperRef.current) {
        const current = cropperRef.current.getTransforms()?.rotate ?? rotation;
        const delta = target - current;
        if (delta !== 0) {
          cropperRef.current.rotateImage(delta);
        }
      }
      setRotation(target);
    },
    [rotation],
  );

  /** Zoom via slider — value is absolute (1–3). */
  const handleZoomSlider = useCallback(
    (target: number) => {
      if (cropperRef.current) {
        // zoomImage is relative; compute factor from current to target.
        const factor = target / zoom;
        cropperRef.current.zoomImage(factor);
      }
      setZoom(target);
    },
    [zoom],
  );

  async function apply() {
    if (!cropperRef.current) return;
    setSaving(true);
    try {
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) throw new Error("Cropper canvas not available");

      let finalCanvas: HTMLCanvasElement = canvas;

      // Apply brightness/contrast if they differ from defaults.
      if (brightness !== 100 || contrast !== 100) {
        const out = document.createElement("canvas");
        out.width = canvas.width;
        out.height = canvas.height;
        const ctx = out.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(canvas, 0, 0);
        finalCanvas = out;
      }

      const mime = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      const blob: Blob = await new Promise((resolve, reject) => {
        finalCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to export image"))),
          mime,
          mime === "image/jpeg" ? 0.92 : undefined,
        );
      });

      const base = fileName.replace(/\.[^.]+$/, "") || "edited";
      const ext = mime === "image/png" ? "png" : "jpg";
      const file = new File([blob], `${base}-edited.${ext}`, { type: mime });
      await onApply(file);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className="flex max-h-[min(920px,95vh)] w-full max-w-3xl flex-col border border-border bg-background shadow-2xl"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Image editor
            </p>
            <p className="text-sm font-medium">{title}</p>
          </div>
          <button
            type="button"
            className={adminBtnGhost}
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X width={14} height={14} />
          </button>
        </div>

        {/* ── Cropper canvas ── */}
        <div className="relative h-[min(420px,50vh)] bg-neutral-950 overflow-hidden">
          <Cropper
            key={src}
            ref={cropperRef}
            src={src}
            stencilProps={
              aspect !== undefined
                ? { aspectRatio: aspect }
                : { aspectRatio: undefined }
            }
            className="h-full w-full"
            style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
          />
        </div>

        {/* ── Controls ── */}
        <div className="space-y-4 overflow-y-auto border-t border-border p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            1:1 matches the product page image frame — what you crop is what shoppers see
          </p>

          {/* Aspect ratio + rotate buttons */}
          <div className="flex flex-wrap gap-1.5">
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={cn(
                  adminBtnGhost,
                  aspect === a.value && "border-foreground bg-mist",
                )}
                onClick={() => setAspect(a.value)}
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              className={adminBtnGhost}
              onClick={() => rotateBy(-90)}
              title="Rotate left"
            >
              <RotateCcw width={13} height={13} />
            </button>
            <button
              type="button"
              className={adminBtnGhost}
              onClick={() => rotateBy(90)}
              title="Rotate right"
            >
              <RotateCw width={13} height={13} />
            </button>
          </div>

          {/* Zoom slider */}
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Zoom · {zoom.toFixed(1)}×
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoomSlider(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </label>

          {/* Rotation slider */}
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Rotate · {Math.round(rotation)}°
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setAbsoluteRotation(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </label>

          {/* Brightness / Contrast */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Brightness · {brightness}%
              </span>
              <input
                type="range"
                min={50}
                max={150}
                step={1}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Contrast · {contrast}%
              </span>
              <input
                type="range"
                min={50}
                max={150}
                step={1}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </label>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          {onSkip ? (
            <button type="button" className={adminBtnOutline} disabled={saving} onClick={onSkip}>
              Skip edit
            </button>
          ) : (
            <button type="button" className={adminBtnOutline} disabled={saving} onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className={adminBtn}
            disabled={saving}
            onClick={() => {
              void apply().catch(() => {
                /* toast handled by parent */
              });
            }}
          >
            {saving ? "Saving…" : "Apply & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
