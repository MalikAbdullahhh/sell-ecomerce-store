import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { adminApi, mediaUrl } from "@/lib/api";
import { adminBtnGhost } from "./field";
import { cn } from "@/lib/utils";

type Props = {
  value?: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  className?: string;
};

export function Uploader({
  value = [],
  onChange,
  multiple = true,
  accept = "image/*,video/*",
  label = "Upload",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    try {
      // Upload in one request; update progress when the request settles.
      const { files: uploaded } = await adminApi.upload(list);
      setProgress({ done: list.length, total: list.length });
      const urls = uploaded.map((f) => f.url);
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
      toast.success(urls.length === 1 ? "Uploaded" : `${urls.length} files uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
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

      <div className={cn("flex flex-wrap gap-2", busy && "pointer-events-none opacity-40")}>
        {value.map((url, i) => {
          const src = mediaUrl(url);
          const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url) || /\/video\//i.test(url);
          return (
            <div key={`${url}-${i}`} className="relative h-20 w-20 overflow-hidden border border-border">
              {isVideo ? (
                <video src={src} className="h-full w-full object-cover" muted />
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
    </div>
  );
}

export function SingleUploader({
  value,
  onChange,
  accept = "image/*",
  label = "Upload",
}: {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  return (
    <Uploader
      value={value ? [value] : []}
      onChange={(urls) => onChange(urls[0] || "")}
      multiple={false}
      accept={accept}
      label={label}
    />
  );
}
