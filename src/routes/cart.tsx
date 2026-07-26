import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Eyebrow } from "@/components/site/focus";
import { GIFT_FEE, money, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Aperture" },
      {
        name: "description",
        content: "Review your Aperture order, add gift wrapping and apply a discount code.",
      },
      { property: "og:title", content: "Your Cart — Aperture" },
      { property: "og:description", content: "Review your Aperture order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const {
    lines,
    lineProduct,
    setQty,
    removeLine,
    setGift,
    setGiftMessage,
    subtotal,
    giftTotal,
    shipping,
    charges,
    total,
    settings,
  } = useStore();
  const giftFee = settings?.shipping?.giftFee ?? GIFT_FEE;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-16">
      <Eyebrow>{lines.length} line items</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Cart</h1>

      {lines.length === 0 ? (
        <div className="mt-12 border border-border p-10 text-center">
          <p className="text-lg">Nothing in focus yet.</p>
          <Link
            to="/shop"
            className="mt-5 inline-grid h-12 place-items-center bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ul className="divide-y divide-border border-y border-border">
            {lines.map((line) => {
              const p = lineProduct(line);
              if (!p) return null;
              return (
                <li key={line.id} className="flex gap-4 py-6">
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-28 w-28 shrink-0 border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <div className="min-w-0">
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          className="truncate font-medium"
                        >
                          {p.name}
                        </Link>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {line.color}
                          {line.size ? ` · ${line.size}` : ""}
                        </p>
                      </div>
                      <p className="font-mono text-sm">{money(p.price * line.qty)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease"
                          onClick={() => setQty(line.id, line.qty - 1)}
                          className="grid h-11 w-11 place-items-center"
                        >
                          <Minus width={13} height={13} />
                        </button>
                        <span className="w-8 text-center font-mono text-xs">{line.qty}</span>
                        <button
                          aria-label="Increase"
                          onClick={() => setQty(line.id, line.qty + 1)}
                          className="grid h-11 w-11 place-items-center"
                        >
                          <Plus width={13} height={13} />
                        </button>
                      </div>
                      <label className="flex items-center gap-2 font-mono text-[11px]">
                        <Checkbox
                          checked={line.gift}
                          onCheckedChange={(v) => setGift(line.id, v === true)}
                        />
                        Gift wrap +{money(giftFee)}
                      </label>
                      <button
                        onClick={() => removeLine(line.id)}
                        aria-label="Remove item"
                        className="grid h-11 w-11 place-items-center text-muted-foreground"
                      >
                        <Trash2 width={15} height={15} />
                      </button>
                    </div>
                    {line.gift && (
                      <input
                        className="mt-3 h-11 w-full border border-border bg-transparent px-3 font-mono text-xs outline-none focus:border-foreground"
                        placeholder="Gift message (optional)"
                        value={line.giftMessage || ""}
                        onChange={(e) => setGiftMessage(line.id, e.target.value)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit border border-border p-6 lg:sticky lg:top-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Summary</p>
            <dl className="mt-5 space-y-3 font-mono text-[13px]">
              <Row label="Subtotal" value={money(subtotal)} />
              <Row label="Gift wrapping" value={money(giftTotal)} />
              <Row label="Shipping" value={shipping === 0 ? "Free" : money(shipping)} />
              {charges.map((c) => (
                <Row key={c.label} label={c.label} value={money(c.amount)} />
              ))}
            </dl>
            <div className="mt-5 flex gap-2">
              <input
                placeholder="Discount code"
                className="h-11 min-w-0 flex-1 border border-border bg-transparent px-3 font-mono text-xs outline-none"
              />
              <button className="h-11 border border-foreground px-4 font-mono text-[11px] uppercase tracking-[0.18em]">
                Apply
              </button>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono text-base">
              <span className="uppercase tracking-[0.18em]">Total</span>
              <span>{money(total)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-5 grid h-12 place-items-center bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
