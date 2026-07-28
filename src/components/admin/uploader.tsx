import { Crop, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { adminApi, mediaUrl } from "@/lib/api";
import { VideoThumb } from "@/components/site/video-thumb";
import { ImageEditorModal } from "./image-editor";
import { adminBtnGhost } from "./field";
import { cn } from "@/lib/utils";

type Props = {
  value?: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  className?: string;
  /** When false, skip the crop/edit step for new images (default true for image uploads). */
  enableEdit?: boolean;
};

type EditSession =
  | {
      mode: "queue";
      src: string;
      file: File;
      rest: File[];
      pendingUpload: File[];
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

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || /\/video\//i.test(url);
}

function looksLikeImageAccept(accept: string) {
  return accept.includes("image") || accept === "*/*" || accept === "";
}

function acceptHint(accept: string) {
  const parts: string[] = [];
  if (accept.includes("image") || accept === "*/*" || !accept) parts.push("images");
  if (accept.includes("video") || accept === "*/*" || !accept) parts.push("videos");
  return parts.join(" or ") || "files";
}

/** Match a File against an HTML accept string (e.g. "image/*,video/*"). */
function fileMatchesAccept(file: File, accept: string): boolean {
  if (!accept || accept === "*/*") return true;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";

  const imageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".heic", ".heif"];
  const videoExts = [".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv", ".3gp", ".mpeg", ".mpg", ".ogv"];

  return tokens.some((token) => {
    if (token === "image/*") {
      return type.startsWith("image/") || imageExts.includes(ext);
    }
    if (token === "video/*") {
      return type.startsWith("video/") || type === "application/mp4" || videoExts.includes(ext);
    }
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);
      return type.startsWith(prefix);
    }
    if (token.startsWith(".")) return name.endsWith(token);
    return type === token;
  });
}

export function Uploader({
  value = [],
  onChange,
  multiple = true,
  accept = "image/*,video/*",
  label = "Upload",
  className,
  enableEdit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [session, setSession] = useState<EditSession | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const allowEdit = enableEdit ?? looksLikeImageAccept(accept);

  function clearFileDrag() {
    setFileDragOver(false);
  }

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

  async function uploadFiles(files: File[]) {
    if (!files.length) return [] as string[];
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    try {
      const { files: uploaded } = await adminApi.upload(files);
      setProgress({ done: files.length, total: files.length });
      return uploaded.map((f) => f.url);
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function startQueue(images: File[], videos: File[]) {
    if (!images.length) {
      void (async () => {
        try {
          const urls = await uploadFiles(videos);
          if (urls.length) {
            onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
            toast.success(urls.length === 1 ? "Uploaded" : `${urls.length} files uploaded`);
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
        }
      })();
      return;
    }

    if (!allowEdit) {
      void (async () => {
        try {
          const urls = await uploadFiles([...images, ...videos]);
          if (urls.length) {
            onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
            toast.success(urls.length === 1 ? "Uploaded" : `${urls.length} files uploaded`);
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
        }
      })();
      return;
    }

    const [first, ...rest] = images;
    const src = URL.createObjectURL(first);
    setSession({
      mode: "queue",
      src,
      file: first,
      rest,
      pendingUpload: [...videos],
      index: 1,
      total: images.length,
    });
  }

  function ingestFiles(raw: File[]) {
    if (!raw.length || busy) return;
    let list = raw.filter((f) => fileMatchesAccept(f, accept));
    if (!list.length) {
      toast.error(`Drop ${acceptHint(accept)} only`);
      return;
    }
    if (!multiple) list = list.slice(0, 1);

    const images = list.filter(isImageFile);
    const videos = list.filter(isVideoFile);
    const other = list.filter((f) => !isImageFile(f) && !isVideoFile(f));
    // Non image/video that still matched accept (rare) — upload with videos path.
    startQueue(images, [...videos, ...other]);
  }

  function onPick(files: FileList | null) {
    if (!files?.length) return;
    ingestFiles(Array.from(files));
  }

  function isFileDrag(e: DragEvent) {
    return Array.from(e.dataTransfer?.types || []).includes("Files");
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || !isFileDrag(e)) return;
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
    if (!isFileDrag(e) || busy) {
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
    if (busy) return;
    ingestFiles(Array.from(e.dataTransfer?.files || []));
  }

  function finishQueueUpload(files: File[]) {
    void (async () => {
      try {
        const urls = await uploadFiles(files);
        if (urls.length) {
          onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
          toast.success(urls.length === 1 ? "Uploaded" : `${urls.length} files uploaded`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    })();
  }

  async function applyQueueEdit(file: File) {
    if (!session || session.mode !== "queue") return;
    const current = session;
    const pending = [...current.pendingUpload, file];
    const [next, ...rest] = current.rest;
    URL.revokeObjectURL(current.src);
    if (next) {
      setSession({
        mode: "queue",
        src: URL.createObjectURL(next),
        file: next,
        rest,
        pendingUpload: pending,
        index: current.index + 1,
        total: current.total,
      });
      return;
    }
    setSession(null);
    finishQueueUpload(pending);
  }

  function skipQueueEdit() {
    if (!session || session.mode !== "queue") return;
    const current = session;
    const pending = [...current.pendingUpload, current.file];
    const [next, ...rest] = current.rest;
    URL.revokeObjectURL(current.src);
    if (next) {
      setSession({
        mode: "queue",
        src: URL.createObjectURL(next),
        file: next,
        rest,
        pendingUpload: pending,
        index: current.index + 1,
        total: current.total,
      });
      return;
    }
    setSession(null);
    finishQueueUpload(pending);
  }

  function closeSession() {
    if (!session) return;
    if (session.mode === "queue") {
      URL.revokeObjectURL(session.src);
      setSession(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (session.revokeOnClose) URL.revokeObjectURL(session.revokeOnClose);
    setSession(null);
  }

  async function openReplaceEditor(index: number) {
    const url = value[index];
    if (!url || isVideoUrl(url)) return;
    const remote = mediaUrl(url);
    const fileName = url.split("/").pop()?.split("?")[0] || "image.jpg";
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
      setSession({
        mode: "replace",
        src: remote,
        index,
        fileName,
      });
    }
  }

  async function applyReplace(file: File) {
    if (!session || session.mode !== "replace") return;
    const index = session.index;
    try {
      setBusy(true);
      const { files: uploaded } = await adminApi.upload([file]);
      const nextUrl = uploaded[0]?.url;
      if (!nextUrl) throw new Error("Upload failed");
      const next = [...value];
      next[index] = nextUrl;
      onChange(next);
      toast.success("Image updated");
      setSession(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function remove(idx: number) {
    if (busy) return;
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("relative space-y-2", className)}>
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
          <p className="text-xs text-muted-foreground">Please wait — do not close this panel</p>
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
          fileDragOver
            ? "border-foreground bg-mist/80"
            : "border-border bg-transparent hover:border-foreground/40",
          busy && "pointer-events-none opacity-40",
        )}
      >
        {fileDragOver ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90">
            <Upload width={22} height={22} />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
              Drop {acceptHint(accept)} to upload
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => {
            const src = mediaUrl(url);
            const video = isVideoUrl(url);
            return (
              <div
                key={`${url}-${i}`}
                className="group relative h-20 w-20 overflow-hidden border border-border"
              >
                {video ? (
                  <VideoThumb src={src} className="h-full w-full" />
                ) : (
                  <img src={src} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute right-0 top-0 grid h-5 w-5 place-items-center bg-foreground text-background"
                  aria-label="Remove"
                >
                  <X width={11} height={11} />
                </button>
                {!video && allowEdit && (
                  <button
                    type="button"
                    onClick={() => void openReplaceEditor(i)}
                    className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-foreground/85 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-background opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Edit image"
                  >
                    <Crop width={10} height={10} />
                    Edit
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(adminBtnGhost, "h-20 w-20 flex-col gap-1")}
          >
            {busy ? (
              <Loader2 width={16} height={16} className="animate-spin" />
            ) : (
              <ImagePlus width={16} height={16} />
            )}
            <span>{busy ? "…" : label}</span>
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 border border-transparent py-4 text-center transition-colors hover:border-border"
        >
          <Upload width={16} height={16} className="text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Drag & drop {acceptHint(accept)} here, or click to browse
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={busy}
        onChange={(e) => onPick(e.target.files)}
      />
      <div className={cn("flex gap-2", busy && "pointer-events-none opacity-40")}>
        <input
          placeholder="Or paste URL"
          disabled={busy}
          className="h-9 flex-1 border border-border bg-transparent px-2 font-mono text-xs outline-none focus:border-foreground disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const el = e.currentTarget;
            const v = el.value.trim();
            if (!v) return;
            onChange(multiple ? [...value, v] : [v]);
            el.value = "";
          }}
        />
      </div>
      {allowEdit ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Images open in the editor (1:1 by default) so the crop matches the product page frame.
          Hover a thumbnail to re-edit.
        </p>
      ) : null}

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

export function SingleUploader({
  value,
  onChange,
  accept = "image/*",
  label = "Upload",
  enableEdit,
}: {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  enableEdit?: boolean;
}) {
  return (
    <Uploader
      value={value ? [value] : []}
      onChange={(urls) => onChange(urls[0] || "")}
      multiple={false}
      accept={accept}
      label={label}
      enableEdit={enableEdit}
    />
  );
}
