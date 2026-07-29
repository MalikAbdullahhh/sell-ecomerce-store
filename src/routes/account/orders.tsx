import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { AccountOrdersSkeleton } from "@/components/site/skeletons";
import { mediaUrl, orderApi, type OrderDoc } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "Order History — Aperture Account" },
      {
        name: "description",
        content:
          "Track shipments, download invoices and start a return from your Aperture order history.",
      },
      { property: "og:title", content: "Order History — Aperture" },
      { property: "og:description", content: "Track shipments and start returns." },
    ],
  }),
  component: Orders,
});

const PIPELINE = ["confirmed", "processing", "shipped", "delivered"] as const;

function StatusTrack({ status }: { status: string }) {
  const idx = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
  const active = idx >= 0 ? idx : status === "cancelled" ? -1 : 0;
  return (
    <div className="mt-4">
      <div className="flex gap-1">
        {PIPELINE.map((step, i) => (
          <div
            key={step}
            className={cn(
              "h-1 flex-1 transition-colors duration-500",
              status === "cancelled" ? "bg-border" : i <= active ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {PIPELINE.map((step) => (
          <span key={step} className={cn(step === status && "text-foreground")}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function Orders() {
  const { user, loading } = useAuth();
  const { settings } = useStore();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [fetching, setFetching] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }
    orderApi
      .mine()
      .then((data) => setOrders(data.orders))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <AccountOrdersSkeleton />;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Eyebrow>Private order history</Eyebrow>
        <h1 className="mt-2 text-4xl">Sign in to view orders</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Only orders placed while signed in or while creating an account at checkout appear here.
        </p>
        <Link
          to="/account"
          className="mt-7 grid h-12 place-items-center bg-foreground font-mono text-xs uppercase tracking-[0.2em] text-background"
        >
          Sign in
        </Link>
      </div>
    );

  const contact = settings?.contact;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <Eyebrow>{orders.length} orders</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Order history</h1>

      <div className="mt-10 space-y-4">
        {orders.map((o) => (
          <div
            key={o._id}
            className="border border-border p-4 transition-shadow hover:shadow-[0_0_0_1px_var(--color-foreground)]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{o.orderNumber}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("en-PK")}
                </p>
              </div>
              <span className="shrink-0 border border-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                {o.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {o.paymentMethod === "cod" ? "Cash on Delivery" : "Online transfer"}
              {" · "}
              Payment {o.paymentStatus.replaceAll("_", " ")}
            </p>

            <div className="mt-4 flex gap-2 overflow-x-auto">
              {o.items.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="flex min-w-[200px] flex-1 gap-3 border border-border p-2"
                >
                  {item.image ? (
                    <img
                      src={mediaUrl(item.image)}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center bg-secondary font-mono text-[10px] text-muted-foreground">
                      N/A
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {[item.color, item.size].filter(Boolean).join(" · ")} · ×{item.qty}
                    </p>
                    <p className="mt-1 font-mono text-[11px]">{money(item.price * item.qty)}</p>
                    {item.gift && (
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                        Gift wrapped
                        {item.giftMessage ? ` · “${item.giftMessage}”` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <StatusTrack status={o.status} />

            {(o.charges?.length || 0) > 0 && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Includes {o.charges!.map((c) => `${c.label} ${money(c.amount)}`).join(" · ")}
              </p>
            )}

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-dotted border-border pt-3">
              <p className="font-mono text-sm">{money(o.total)}</p>
              <button
                type="button"
                onClick={() => setOpenId(openId === o._id ? null : o._id)}
                className="h-11 shrink-0 border border-border px-4 font-mono text-[11px] uppercase tracking-[0.18em]"
              >
                {openId === o._id ? "Hide" : "Details"}
              </button>
            </div>
            {openId === o._id && (
              <div className="mt-4 space-y-2 border-t border-border pt-4 font-mono text-xs animate-in fade-in">
                <div className="flex justify-between gap-3">
                  <span className="uppercase tracking-[0.14em]">Payment</span>
                  <span className="text-right text-muted-foreground">
                    {o.paymentMethod === "cod" ? "COD" : "Online"} ·{" "}
                    {o.paymentStatus.replaceAll("_", " ")}
                  </span>
                </div>
                {o.transactionId && (
                  <div className="flex justify-between gap-3">
                    <span className="uppercase tracking-[0.14em]">Txn ID</span>
                    <span className="break-all text-right">{o.transactionId}</span>
                  </div>
                )}
                {o.paymentProof && (
                  <div className="pt-1">
                    <p className="mb-2 uppercase tracking-[0.14em]">Payment proof</p>
                    <a href={mediaUrl(o.paymentProof)} target="_blank" rel="noreferrer">
                      <img
                        src={mediaUrl(o.paymentProof)}
                        alt="Payment proof"
                        className="max-h-48 border border-border object-contain"
                      />
                    </a>
                  </div>
                )}
                {o.statusHistory?.map((h, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span className="uppercase tracking-[0.14em]">{h.status}</span>
                    <span className="text-muted-foreground">
                      {h.at ? new Date(h.at).toLocaleString("en-PK") : ""}
                    </span>
                  </div>
                ))}
                <p className="pt-2 text-muted-foreground">
                  Ship to {o.shipping.address}, {o.shipping.city}
                </p>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && (
          <div className="border border-border p-10 text-center text-muted-foreground">
            No orders yet.
          </div>
        )}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <Eyebrow>Contact & help</Eyebrow>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings?.help?.helpText || "Need help with an order? Reach us anytime."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`tel:${contact?.phone || ""}`}
            className="flex h-11 items-center gap-2 border border-foreground px-4 font-mono text-xs"
          >
            <Phone width={15} /> {contact?.phone}
          </a>
          <a
            href={`https://wa.me/${(contact?.whatsapp || "").replace(/\D/g, "")}`}
            className="flex h-11 items-center gap-2 bg-foreground px-4 font-mono text-xs text-background"
          >
            <MessageCircle width={15} /> WhatsApp
          </a>
        </div>
      </section>

      <Link
        to="/shop"
        className="mt-10 inline-block border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.18em]"
      >
        Continue shopping
      </Link>
    </div>
  );
}
