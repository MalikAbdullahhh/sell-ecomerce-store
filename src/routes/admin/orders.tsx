import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminBtnGhost, adminField, pkr } from "@/components/admin/field";
import { AdminTableSkeleton } from "@/components/site/skeletons";
import { adminApi, mediaUrl, type OrderDoc } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
  head: () => ({ meta: [{ title: "Orders — Aperture Admin" }] }),
});

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const PAYMENTS = ["pending", "awaiting_transfer", "paid", "failed", "refunded"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<OrderDoc | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", statusFilter],
    queryFn: () => adminApi.orders(statusFilter ? { status: statusFilter } : undefined),
    refetchInterval: 12000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateOrder(id, body),
    onSuccess: (res) => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      const order = (res as { order?: OrderDoc }).order;
      if (order) setSelected(order);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openOrder = async (o: OrderDoc) => {
    setSelected(o);
    if (!o.isRead) {
      try {
        const res = await adminApi.markOrderRead(o._id);
        setSelected(res.order);
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
        qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      } catch {
        /* keep selected */
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Commerce
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Orders</h1>
          {(data?.unreadCount ?? 0) > 0 && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {data?.unreadCount} unread · open an order to clear its badge
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(data?.unreadCount ?? 0) > 0 && (
            <button
              type="button"
              className={adminBtnGhost}
              onClick={async () => {
                await adminApi.markAllOrdersRead();
                qc.invalidateQueries({ queryKey: ["admin", "orders"] });
                qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
                toast.success("All orders marked read");
              }}
            >
              Mark all read
            </button>
          )}
          <select
            className={adminField + " w-auto"}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-mist/40 font-mono text-[10px] uppercase tracking-[0.16em] dark:bg-muted/40">
              <tr>
                <th className="px-3 py-3 font-normal">Order</th>
                <th className="px-3 py-3 font-normal">Customer</th>
                <th className="px-3 py-3 font-normal">Total</th>
                <th className="px-3 py-3 font-normal">Payment</th>
                <th className="px-3 py-3 font-normal">Status</th>
                <th className="px-3 py-3 font-normal">Date</th>
                <th className="px-3 py-3 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.orders || []).map((o) => (
                <tr
                  key={o._id}
                  className={cn(
                    "transition-colors hover:bg-mist/30 dark:hover:bg-muted/30",
                    !o.isRead && "bg-foreground/[0.03]",
                  )}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {!o.isRead && (
                        <span className="inline-flex items-center gap-1 border border-foreground px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
                          New
                        </span>
                      )}
                      {o.orderNumber}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p>{o.shipping?.name}</p>
                    <p className="text-xs text-muted-foreground">{o.shipping?.phone}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{pkr(o.total)}</td>
                  <td className="px-3 py-3 font-mono text-[10px] uppercase">
                    {o.paymentMethod} · {o.paymentStatus}
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] uppercase">{o.status}</td>
                  <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-PK") : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" className={adminBtnGhost} onClick={() => void openOrder(o)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {(data?.orders || []).length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center font-mono text-xs text-muted-foreground"
                  >
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[120] grid place-items-end bg-foreground/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto border border-border bg-background p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Order detail
                </p>
                <h2 className="mt-1 font-display text-2xl">{selected.orderNumber}</h2>
              </div>
              <button type="button" className={adminBtnGhost} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <dl className="mt-5 space-y-2 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="text-right">
                  {selected.shipping.name}
                  <br />
                  {selected.shipping.email || "—"}
                  <br />
                  {selected.shipping.phone}
                  <br />
                  {selected.shipping.address}, {selected.shipping.city}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="text-right uppercase">
                  {selected.paymentMethod} · {selected.paymentStatus}
                </dd>
              </div>
              {selected.transactionId && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Txn ID</dt>
                  <dd className="break-all text-right">{selected.transactionId}</dd>
                </div>
              )}
              {selected.paymentProof && (
                <div>
                  <dt className="text-muted-foreground">Payment proof</dt>
                  <dd className="mt-2">
                    <a href={mediaUrl(selected.paymentProof)} target="_blank" rel="noreferrer">
                      <img
                        src={mediaUrl(selected.paymentProof)}
                        alt="Payment proof"
                        className="max-h-48 border border-border object-contain"
                      />
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{pkr(selected.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Gift wrapping</dt>
                <dd>{pkr(selected.giftTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{pkr(selected.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <dt>Total</dt>
                <dd>{pkr(selected.total)}</dd>
              </div>
            </dl>

            <ul className="mt-5 divide-y divide-border border-y border-border">
              {selected.items.map((item, i) => (
                <li key={`${item.slug}-${i}`} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {[item.color, item.size].filter(Boolean).join(" · ")} · Qty {item.qty}
                      </p>
                      {item.gift && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                          Gift wrap · {pkr(item.giftFee || 0)}
                          {item.giftMessage ? ` · “${item.giftMessage}”` : ""}
                        </p>
                      )}
                    </div>
                    <p className="font-mono text-xs">{pkr(item.price * item.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Status
                </span>
                <select
                  className={adminField}
                  value={selected.status}
                  onChange={(e) =>
                    updateMut.mutate({ id: selected._id, body: { status: e.target.value } })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Payment
                </span>
                <select
                  className={adminField}
                  value={selected.paymentStatus}
                  onChange={(e) =>
                    updateMut.mutate({
                      id: selected._id,
                      body: { paymentStatus: e.target.value },
                    })
                  }
                >
                  {PAYMENTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
