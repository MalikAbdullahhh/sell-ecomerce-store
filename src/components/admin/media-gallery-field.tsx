import { Crop, Film, GripVertical, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { adminApi, mediaUrl } from "@/lib/api";
import { VideoThumb } from "@/components/site/video-thumb";
import { ImageEditorModal } from "./image-editor";
import { adminBtnGhost } from "./field";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  url: string;
  type: "image" | "video";
};

type Props = {
  value?: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  /** Called (debounced) after gallery changes — use to auto-save existing products. */
  onPersist?: (items: GalleryItem[]) => void | Promise<void>;
  className?: string;
  enableEdit?: boolean;
};

type EditSession =
  | {
      mode: "queue";
      src: string;
      file: File;
      rest: File[];
      pending: GalleryItem[];
      index: number;
      total: number;
    }
  | {
      mode: "replace";
      src: string;
      index: number;
      fileName: string;
      revokeOnClose?: string;
    };

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|3gp|mpeg|mpg|ogv)(\?|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)(\?|$)/i;

function isVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  if (file.type.startsWith("image/")) return false;
  return VIDEO_EXT.test(file.name);
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return false;
  return IMAGE_EXT.test(file.name) || (!VIDEO_EXT.test(file.name) && !file.type);
}

function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url) || /\/video\//i.test(url) || /resource_type[=_]video/i.test(url);
}

function detectType(file: File): "image" | "video" | null {
  if (isVideoFile(file)) return "video";
  if (isImageFile(file)) return "image";
  return null;
}

function fileMatchesMedia(file: File) {
  return detectType(file) != null;
}

export function galleryFromParts(images: string[] = [], videos: string[] = []): GalleryItem[] {
  return [
    ...images.filter(Boolean).map((url) => ({ url, type: "image" as const })),
    ...videos.filter(Boolean).map((url) => ({ url, type: "video" as const })),
  ];
}

export function splitGallery(items: GalleryItem[]) {
  return {
    images: items.filter((i) => i.type === "image").map((i) => i.url),
    videos: items.filter((i) => i.type === "video").map((i) => i.url),
  };
}

export function MediaGalleryField({
  value = [],
  onChange,
  onPersist,
  className,
  enableEdit = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [session, setSession] = useState<EditSession | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const persistTimer = useRef<number | null>(null);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;

  function clearFileDrag() {
    setFileDragOver(false);
  }

  function schedulePersist(next: GalleryItem[]) {
    if (!onPersistRef.current) return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      void onPersistRef.current?.(next);
    }, 400);
  }

  function commit(next: GalleryItem[]) {
    valueRef.current = next;
    onChange(next);
    schedulePersist(next);
  }

  useEffect(() => {
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, []);

  // Escape hatch: drag cancelled outside the window / browser chrome.
  useEffect(() => {
    const end = () => clearFileDrag();
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => {
      window.removeEventListener("dragend", end);
      window.removeEventListener("drop", end);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (session?.mode === "queue") URL.revokeObjectURL(session.src);
      if (session?.mode === "replace" && session.revokeOnClose) {
        URL.revokeObjectURL(session.revokeOnClose);
      }
    };
  }, [session]);

  function isFileDrag(e: DragEvent) {
    return Array.from(e.dataTransfer?.types || []).includes("Files");
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || dragIndex !== null) return;
    if (!isFileDrag(e)) return;
    setFileDragOver(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && dropRef.current?.contains(next)) return;
    clearFileDrag();
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isFileDrag(e) || busy || dragIndex !== null) {
      if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    setFileDragOver(true);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    clearFileDrag();
    if (busy || dragIndex !== null) return;
    ingestFiles(Array.from(e.dataTransfer?.files || []));
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return [] as { url: string; type: "image" | "video" }[];
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    try {
      const { files: uploaded } = await adminApi.upload(files);
      setProgress({ done: files.length, total: files.length });
      return uploaded.map((f, i) => {
        const original = files[i];
        const type =
          (original && detectType(original)) ||
          (isVideoUrl(f.url) ? "video" : "image");
        return { url: f.url, type };
      });
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function startQueue(files: File[]) {
    const images = files.filter((f) => detectType(f) === "image");
    const videos = files.filter((f) => detectType(f) === "video");

    if (!images.length) {
      void (async () => {
        try {
          const uploaded = await uploadFiles(videos);
          if (uploaded.length) {
            commit([...valueRef.current, ...uploaded]);
            toast.success(
              uploaded.length === 1 ? "Video uploaded" : `${uploaded.length} videos uploaded`,
            );
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
        }
      })();
      return;
    }

    if (!enableEdit) {
      void (async () => {
        try {
          const uploaded = await uploadFiles([...images, ...videos]);
          if (uploaded.length) {
            commit([...valueRef.current, ...uploaded]);
            toast.success(
              uploaded.length === 1 ? "Uploaded" : `${uploaded.length} files uploaded`,
            );
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
        }
      })();
      return;
    }

    void (async () => {
      if (videos.length) {
        try {
          const uploaded = await uploadFiles(videos);
          if (uploaded.length) {
            commit([...valueRef.current, ...uploaded]);
            toast.success(
              uploaded.length === 1 ? "Video uploaded" : `${uploaded.length} videos uploaded`,
            );
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Video upload failed");
          return;
        }
      }

      const [first, ...rest] = images;
      if (!first) return;
      setSession({
        mode: "queue",
        src: URL.createObjectURL(first),
        file: first,
        rest,
        pending: [],
        index: 1,
        total: images.length,
      });
    })();
  }

  function ingestFiles(raw: File[]) {
    if (!raw.length || busy) return;
    const list = raw.filter(fileMatchesMedia);
    if (!list.length) {
      toast.error("Drop images or videos only (mp4, webm, mov, jpg, png, …)");
      return;
    }
    startQueue(list);
  }

  async function applyQueueEdit(file: File) {
    if (!session || session.mode !== "queue") return;
    const current = session;
    try {
      setBusy(true);
      const uploaded = await uploadFiles([file]);
      if (uploaded[0]) commit([...valueRef.current, uploaded[0]]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
      return;
    }

    URL.revokeObjectURL(current.src);
    const [next, ...rest] = current.rest;
    if (next) {
      setSession({
        mode: "queue",
        src: URL.createObjectURL(next),
        file: next,
        rest,
        pending: [],
        index: current.index + 1,
        total: current.total,
      });
      return;
    }
    setSession(null);
    toast.success("Images uploaded");
  }

  function skipQueueEdit() {
    if (!session || session.mode !== "queue") return;
    const current = session;
    void (async () => {
      try {
        const uploaded = await uploadFiles([current.file]);
        if (uploaded[0]) commit([...valueRef.current, uploaded[0]]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
        return;
      }
      URL.revokeObjectURL(current.src);
      const [next, ...rest] = current.rest;
      if (next) {
        setSession({
          mode: "queue",
          src: URL.createObjectURL(next),
          file: next,
          rest,
          pending: [],
          index: current.index + 1,
          total: current.total,
        });
        return;
      }
      setSession(null);
      toast.success("Images uploaded");
    })();
  }

  function closeSession() {
    if (!session) return;
    if (session.mode === "queue") URL.revokeObjectURL(session.src);
    if (session.mode === "replace" && session.revokeOnClose) {
      URL.revokeObjectURL(session.revokeOnClose);
    }
    setSession(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function openReplaceEditor(index: number) {
    const item = value[index];
    if (!item || item.type !== "image") return;
    const remote = mediaUrl(item.url);
    const fileName = item.url.split("/").pop()?.split("?")[0] || "image.jpg";
    try {
      const res = await fetch(remote);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setSession({
        mode: "replace",
        src: objectUrl,
        index,
        fileName,
        revokeOnClose: objectUrl,
      });
    } catch {
      setSession({ mode: "replace", src: remote, index, fileName });
    }
  }

  async function applyReplace(file: File) {
    if (!session || session.mode !== "replace") return;
    const index = session.index;
    try {
      const uploaded = await uploadFiles([file]);
      const nextUrl = uploaded[0]?.url;
      if (!nextUrl) throw new Error("Upload failed");
      const next = [...valueRef.current];
      next[index] = { url: nextUrl, type: "image" };
      commit(next);
      toast.success("Image updated");
      setSession(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function remove(idx: number) {
    if (busy) return;
    commit(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= value.length) return;
    const copy = [...value];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    commit(copy);
  }

  function onRowDragStart(index: number) {
    setDragIndex(index);
  }

  function onRowDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  }

  function onRowDrop(e: DragEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const copy = [...value];
    const [item] = copy.splice(dragIndex, 1);
    copy.splice(index, 0, item);
    commit(copy);
    setDragIndex(null);
    setOverIndex(null);
  }

  function onRowDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
    clearFileDrag();
  }

  return (
    <div className={cn("relative space-y-3", className)}>
      {busy && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 border border-border bg-background/85 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 width={22} height={22} className="animate-spin" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Uploading
            {progress ? ` ${progress.done}/${progress.total}` : "…"}
          </p>
        </div>
      )}

      <div
        ref={dropRef}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "relative border border-dashed p-3 transition-colors",
          fileDragOver ? "border-foreground bg-mist/80" : "border-border hover:border-foreground/40",
          busy && "pointer-events-none opacity-40",
        )}
      >
        {fileDragOver ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90">
            <Upload width={22} height={22} />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
              Drop images or videos
            </p>
          </div>
        ) : null}

        {value.length === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 py-10 text-center"
          >
            <ImagePlus width={22} height={22} className="text-muted-foreground" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Drag & drop images / videos, or click to browse
            </span>
          </button>
        ) : (
          <>
            <ul className="divide-y divide-border border border-border">
              {value.map((item, i) => {
                const src = mediaUrl(item.url);
                return (
                  <li
                    key={`${item.url}-${i}`}
                    draggable={!busy}
                    onDragStart={() => onRowDragStart(i)}
                    onDragOver={(e) => onRowDragOver(e, i)}
                    onDrop={(e) => onRowDrop(e, i)}
                    onDragEnd={onRowDragEnd}
                    className={cn(
                      "flex items-center gap-3 bg-background p-2 transition-colors",
                      dragIndex === i && "opacity-50",
                      overIndex === i && dragIndex !== i && "bg-mist",
                    )}
                  >
                    <button
                      type="button"
                      className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                      aria-label="Drag to reorder"
                      tabIndex={-1}
                    >
                      <GripVertical width={16} height={16} />
                    </button>
                    <span className="w-7 shrink-0 font-mono text-[11px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border bg-secondary">
                      {item.type === "video" ? (
                        <VideoThumb src={src} className="h-full w-full">
                          <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                            <Film width={14} height={14} />
                          </span>
                        </VideoThumb>
                      ) : (
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em]">
                        {item.type}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.url.split("/").pop()?.split("?")[0] || item.url}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className={adminBtnGhost}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={adminBtnGhost}
                        disabled={i === value.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      {item.type === "image" && enableEdit ? (
                        <button
                          type="button"
                          className={adminBtnGhost}
                          onClick={() => void openReplaceEditor(i)}
                          aria-label="Edit image"
                        >
                          <Crop width={13} height={13} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() => remove(i)}
                        aria-label="Remove"
                      >
                        <Trash2 width={13} height={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center gap-2 border border-transparent py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <Upload width={14} height={14} />
              Add more · drag & drop or browse
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv,.jpg,.jpeg,.png,.webp,.gif,.avif"
        multiple
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          ingestFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Drag rows to reorder · numbered order is what shoppers see on the product page
      </p>

      {session ? (
        <ImageEditorModal
          open
          src={session.src}
          fileName={session.mode === "queue" ? session.file.name : session.fileName}
          title={
            session.mode === "queue"
              ? `Edit image${session.total > 1 ? ` (${session.index} of ${session.total})` : ""}`
              : "Edit uploaded image"
          }
          onClose={closeSession}
          onSkip={session.mode === "queue" ? skipQueueEdit : undefined}
          onApply={async (file) => {
            try {
              if (session.mode === "queue") await applyQueueEdit(file);
              else await applyReplace(file);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not apply edit");
            }
          }}
        />
      ) : null}
    </div>
  );
}
