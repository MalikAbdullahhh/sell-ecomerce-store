import Cropper, { type Area } from "react-easy-crop";
import { RotateCcw, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { adminBtn, adminBtnGhost, adminBtnOutline } from "./field";
import { cn } from "@/lib/utils";

export type AspectOption = {
  label: string;
  value: number | undefined;
};

const ASPECTS: AspectOption[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
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
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  return {
    width: Math.floor(width * cos + height * sin),
    height: Math.floor(width * sin + height * cos),
  };
}

/**
 * Draw the source image with rotation + crop + brightness/contrast into a canvas,
 * then export as a JPEG/PNG File.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  brightness = 100,
  contrast = 100,
  fileName = "edited.jpg",
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const rot = ((rotation % 360) + 360) % 360;
  const { width: bBoxW, height: bBoxH } = rotateSize(image.width, image.height, rot);

  // Intermediate canvas holds the fully rotated image.
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = bBoxW;
  rotCanvas.height = bBoxH;
  const rotCtx = rotCanvas.getContext("2d");
  if (!rotCtx) throw new Error("Canvas not supported");

  rotCtx.translate(bBoxW / 2, bBoxH / 2);
  rotCtx.rotate((rot * Math.PI) / 180);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const mime = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image"))),
      mime,
      mime === "image/jpeg" ? 0.92 : undefined,
    );
  });

  const base = fileName.replace(/\.[^.]+$/, "") || "edited";
  const ext = mime === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}-edited.${ext}`, { type: mime });
}

export function ImageEditorModal({
  src,
  open,
  title = "Edit image",
  onClose,
  onApply,
  onSkip,
  fileName = "image.jpg",
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(undefined);
    setBrightness(100);
    setContrast(100);
    setCroppedAreaPixels(null);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function apply() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const file = await getCroppedImageFile(
        src,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast,
        fileName,
      );
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

        <div className="relative h-[min(420px,50vh)] bg-neutral-950">
          <div
            className="absolute inset-0"
            style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
          >
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto border-t border-border p-4">
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
              onClick={() => setRotation((r) => r - 90)}
              title="Rotate left"
            >
              <RotateCcw width={13} height={13} />
            </button>
            <button
              type="button"
              className={adminBtnGhost}
              onClick={() => setRotation((r) => r + 90)}
              title="Rotate right"
            >
              <RotateCw width={13} height={13} />
            </button>
          </div>

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
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </label>

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
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </label>

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
            disabled={saving || !croppedAreaPixels}
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
