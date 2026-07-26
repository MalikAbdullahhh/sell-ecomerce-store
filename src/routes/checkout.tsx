import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { money, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Aperture" },
      { name: "description", content: "Three-step checkout with Cash on Delivery or card payment." },
      { property: "og:title", content: "Checkout — Aperture" },
      { property: "og:description", content: "Complete your Aperture order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const STEPS = ["Shipping", "Payment", "Review"] as const;

const field =
  "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground";

function Checkout() {
  const { lines, lineProduct, subtotal, giftTotal, shipping, total, clearCart } = useStore();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState<"cod" | "card">("cod");
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center border border-foreground">
          <Check width={22} height={22} />
        </div>
        <h1 className="mt-6 text-4xl">Order confirmed</h1>
        <p className="mt-3 font-mono text-sm text-muted-foreground">
          Order APT-249183 · Estimated delivery Thu 30 Jul
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/account/orders"
            className="grid h-12 place-items-center bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background"
          >
            Track order
          </Link>
          <Link to="/shop" className="grid h-12 place-items-center border border-foreground px-8 font-mono text-xs uppercase tracking-[0.22em]">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-40 pt-10 md:px-10 md:pb-20">
      <Eyebrow>Step {step + 1} of 3</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Checkout</h1>

      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("h-1 flex-1", i <= step ? "bg-foreground" : "bg-border")} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{s}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="Full name" autoComplete="name" />
              <input className={field} placeholder="Email" type="email" inputMode="email" autoComplete="email" />
              <input className={cn(field, "sm:col-span-2")} placeholder="Street address" autoComplete="street-address" />
              <input className={field} placeholder="City" autoComplete="address-level2" />
              <input className={field} placeholder="Postal code" inputMode="numeric" autoComplete="postal-code" />
              <input className={field} placeholder="Phone" type="tel" inputMode="tel" autoComplete="tel" />
              <input className={field} placeholder="Country" autoComplete="country-name" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {(["cod", "card"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPay(m)}
                  className={cn(
                    "w-full border p-5 text-left transition-colors",
                    pay === m ? "border-foreground ring-1 ring-foreground" : "border-border",
                  )}
                >
                  <p className="font-medium">{m === "cod" ? "Cash on Delivery" : "Pay online"}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {m === "cod" ? "Pay the courier at handover · domestic orders up to $600" : "Card, Apple Pay, Google Pay"}
                  </p>
                </button>
              ))}
              <AnimatePresence>
                {pay === "card" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid gap-3 overflow-hidden sm:grid-cols-2"
                  >
                    <input className={cn(field, "sm:col-span-2")} placeholder="Card number" inputMode="numeric" autoComplete="cc-number" />
                    <input className={field} placeholder="MM / YY" inputMode="numeric" autoComplete="cc-exp" />
                    <input className={field} placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {step === 2 && (
            <ul className="divide-y divide-border border-y border-border">
              {lines.map((l) => {
                const p = lineProduct(l);
                if (!p) return null;
                return (
                  <li key={l.id} className="flex items-center gap-4 py-4">
                    <img src={p.images[0]} alt="" className="h-16 w-16 border border-border object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {l.color} · Qty {l.qty}
                      </p>
                    </div>
                    <span className="font-mono text-sm">{money(p.price * l.qty)}</span>
                  </li>
                );
              })}
              <li className="py-4 font-mono text-xs text-muted-foreground">
                Payment: {pay === "cod" ? "Cash on Delivery" : "Card"}
              </li>
            </ul>
          )}

          <div className="mt-8 hidden gap-3 md:flex">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="h-12 border border-foreground px-8 font-mono text-xs uppercase tracking-[0.22em]">
                Back
              </button>
            )}
            <button
              onClick={() => (step === 2 ? (clearCart(), setDone(true)) : setStep(step + 1))}
              className="h-12 bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background"
            >
              {step === 2 ? "Place order" : "Continue"}
            </button>
          </div>
        </div>

        <aside className="hidden h-fit border border-border p-6 lg:sticky lg:top-24 lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Order summary</p>
          <dl className="mt-5 space-y-3 font-mono text-[13px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Gift wrapping</dt><dd>{money(giftTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : money(shipping)}</dd></div>
          </dl>
          <div className="mt-5 flex justify-between border-t border-border pt-4 font-mono text-base">
            <span className="uppercase tracking-[0.18em]">Total</span>
            <span>{money(total)}</span>
          </div>
        </aside>
      </div>

      {/* Mobile sticky summary + action */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 font-mono text-xs"
        >
          <span className="uppercase tracking-[0.18em]">Order total</span>
          <span className="flex items-center gap-2">
            {money(total)} <ChevronUp width={14} height={14} className={expanded ? "rotate-180" : ""} />
          </span>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.dl
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2 border-t border-border px-4 py-3 font-mono text-[12px]"
            >
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Gift wrapping</dt><dd>{money(giftTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : money(shipping)}</dd></div>
            </motion.dl>
          )}
        </AnimatePresence>
        <div className="flex gap-2 px-3 pb-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="h-12 border border-foreground px-5 font-mono text-xs uppercase tracking-[0.2em]">
              Back
            </button>
          )}
          <button
            onClick={() => (step === 2 ? (clearCart(), setDone(true)) : setStep(step + 1))}
            className="h-12 flex-1 bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background"
          >
            {step === 2 ? "Place order" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}