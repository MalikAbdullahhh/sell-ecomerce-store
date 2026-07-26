import { createFileRoute, Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/site/focus";
import { money } from "@/lib/store";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "Order History — Aperture Account" },
      { name: "description", content: "Track shipments, download invoices and start a return from your Aperture order history." },
      { property: "og:title", content: "Order History — Aperture" },
      { property: "og:description", content: "Track shipments and start returns." },
    ],
  }),
  component: Orders,
});

const orders = [
  { id: "APR-10482", date: "14 Jul 2026", status: "Delivered", total: 349, items: ["Aperture One", "Cable Set 03"] },
  { id: "APR-10344", date: "02 Jun 2026", status: "In transit", total: 519, items: ["Field 02 Headphones"] },
  { id: "APR-10119", date: "18 Mar 2026", status: "Delivered", total: 129, items: ["Signal Watch Band"] },
];

function Orders() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <Eyebrow>{orders.length} orders</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Order history</h1>

      <div className="mt-10 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border border-border p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{o.id}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{o.date}</p>
              </div>
              <span className="shrink-0 border border-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                {o.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{o.items.join(" · ")}</p>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-dotted border-border pt-3">
              <p className="font-mono text-sm">{money(o.total)}</p>
              <button className="h-11 shrink-0 border border-border px-4 font-mono text-[11px] uppercase tracking-[0.18em]">
                Start a return
              </button>
            </div>
          </div>
        ))}
      </div>

      <Link to="/shop" className="mt-10 inline-block border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.18em]">
        Continue shopping
      </Link>
    </div>
  );
}