import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { money, useStore } from "@/lib/store";

export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, lineProduct, setQty, removeLine, subtotal, count } = useStore();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[80] bg-foreground/40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 right-0 top-0 z-[81] flex w-full max-w-[420px] flex-col border-l border-border bg-background"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-[0.22em]">Cart / {count} items</p>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="grid h-11 w-11 place-items-center">
                <X width={18} height={18} />
              </button>
            </header>

            <div className="no-scrollbar flex-1 overflow-y-auto px-4">
              {lines.length === 0 ? (
                <p className="py-10 font-mono text-sm text-muted-foreground">
                  Empty. Nothing in focus yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {lines.map((line) => {
                    const p = lineProduct(line);
                    if (!p) return null;
                    return (
                      <li key={line.id} className="flex gap-3 py-4">
                        <img src={p.images[0]} alt="" className="h-20 w-20 shrink-0 border border-border object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {line.color}
                            {line.size ? ` · ${line.size}` : ""}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center border border-border">
                              <button
                                aria-label="Decrease"
                                onClick={() => setQty(line.id, line.qty - 1)}
                                className="grid h-9 w-9 place-items-center"
                              >
                                <Minus width={13} height={13} />
                              </button>
                              <span className="w-7 text-center font-mono text-xs">{line.qty}</span>
                              <button
                                aria-label="Increase"
                                onClick={() => setQty(line.id, line.qty + 1)}
                                className="grid h-9 w-9 place-items-center"
                              >
                                <Plus width={13} height={13} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeLine(line.id)}
                              className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className="font-mono text-sm">{money(p.price * line.qty)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-border px-4 pb-6 pt-4">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="uppercase tracking-[0.18em]">Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="mt-4 grid gap-2">
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="grid h-12 place-items-center bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background"
                >
                  Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                  className="grid h-12 place-items-center border border-foreground font-mono text-xs uppercase tracking-[0.22em]"
                >
                  View cart
                </Link>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}