import { Bold, Italic, Link as LinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { adminBtnGhost } from "./field";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  mode?: "html" | "plain";
  className?: string;
  rows?: number;
};

export function RichEditor({ value, onChange, mode = "html", className, rows = 12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "html" || !ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value, mode]);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  if (mode === "plain") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(
          "w-full border border-border bg-transparent p-3 font-mono text-sm outline-none focus:border-foreground",
          className,
        )}
        placeholder="HTML content…"
      />
    );
  }

  return (
    <div className={cn("border border-border", className)}>
      <div className="flex gap-1 border-b border-border p-1">
        <button type="button" className={adminBtnGhost} onClick={() => exec("bold")} title="Bold">
          <Bold width={13} height={13} />
        </button>
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => exec("italic")}
          title="Italic"
        >
          <Italic width={13} height={13} />
        </button>
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) exec("createLink", url);
          }}
          title="Link"
        >
          <LinkIcon width={13} height={13} />
        </button>
        <button
          type="button"
          className={cn(adminBtnGhost, "ml-auto")}
          onClick={() => {
            const next = window.prompt("Edit HTML", value);
            if (next !== null) onChange(next);
          }}
        >
          HTML
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[200px] p-3 font-sans text-sm outline-none [&_a]:underline [&_b]:font-bold [&_i]:italic"
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
      />
    </div>
  );
}
