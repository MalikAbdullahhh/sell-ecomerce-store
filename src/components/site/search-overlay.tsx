import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/data/catalog";
import { money } from "@/lib/store";

const TRENDING = ["Aperture One", "Titanium watch", "GaN charger", "65% keyboard"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.includes(term) ||
          p.short.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-background"
        >
          <div className="mx-auto flex h-full max-w-[1440px] flex-col px-4 py-4 md:px-10">
            <div className="flex items-center gap-3 border-b border-foreground pb-3">
              <Search width={18} height={18} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the catalogue"
                className="h-11 w-full bg-transparent font-mono text-base outline-none placeholder:text-muted-foreground"
              />
              <button onClick={onClose} aria-label="Close search" className="grid h-11 w-11 place-items-center">
                <X width={18} height={18} />
              </button>
            </div>

            <div className="no-scrollbar mt-6 flex-1 overflow-y-auto">
              {q.trim() === "" ? (
                <div className="space-y-8">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-60">Trending</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TRENDING.map((t) => (
                        <button
                          key={t}
                          onClick={() => setQ(t)}
                          className="border border-border px-3 py-2 font-mono text-xs hover:bg-foreground hover:text-background"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground">
                  Nothing matches "{q}". Try a category like audio or desk.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        onClick={onClose}
                        className="flex items-center gap-4 py-3"
                      >
                        <img src={p.images[0]} alt="" className="h-14 w-14 border border-border object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block truncate font-mono text-xs text-muted-foreground">{p.short}</span>
                        </span>
                        <span className="font-mono text-sm">{money(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {q.trim() !== "" && (
                <Link
                  to="/search"
                  search={{ q }}
                  onClick={onClose}
                  className="mt-6 inline-block border-b border-foreground pb-1 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  See all results
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}