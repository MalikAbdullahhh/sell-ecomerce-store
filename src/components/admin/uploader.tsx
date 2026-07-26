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

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const list = Array.from(files);
      const { files: uploaded } = await adminApi.upload(list);
      const urls = uploaded.map((f) => f.url);
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
      toast.success(urls.length === 1 ? "Uploaded" : `${urls.length} files uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => {
          const src = mediaUrl(url);
          const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
          return (
            <div key={`${url}-${i}`} className="relative h-20 w-20 border border-border">
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
        onChange={(e) => onPick(e.target.files)}
      />
      <div className="flex gap-2">
        <input
          placeholder="Or paste URL"
          className="h-9 flex-1 border border-border bg-transparent px-2 font-mono text-xs outline-none focus:border-foreground"
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
