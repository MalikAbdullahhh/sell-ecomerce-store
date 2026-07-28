import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Underline } from "lucide-react";
import { useEffect, useRef } from "react";
import { adminBtnGhost } from "./field";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  mode?: "html" | "plain";
  className?: string;
  rows?: number;
  placeholder?: string;
};

export function RichEditor({
  value,
  onChange,
  mode = "html",
  className,
  rows = 12,
  placeholder,
}: Props) {
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
        placeholder={placeholder || "HTML content…"}
      />
    );
  }

  return (
    <div className={cn("border border-border", className)}>
      <div className="flex flex-wrap gap-1 border-b border-border p-1">
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
          onClick={() => exec("underline")}
          title="Underline"
        >
          <Underline width={13} height={13} />
        </button>
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => exec("insertUnorderedList")}
          title="Bullet list"
        >
          <List width={13} height={13} />
        </button>
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => exec("insertOrderedList")}
          title="Numbered list"
        >
          <ListOrdered width={13} height={13} />
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
          className={adminBtnGhost}
          onClick={() => exec("formatBlock", "h3")}
          title="Heading"
        >
          H
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
        data-placeholder={placeholder || "Write product details…"}
        className="min-h-[220px] p-3 font-sans text-sm outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:underline [&_b]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_i]:italic [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
      />
    </div>
  );
}
