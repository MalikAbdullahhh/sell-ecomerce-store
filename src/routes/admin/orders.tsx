import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import {
  adminBtn,
  adminBtnGhost,
  adminBtnOutline,
  adminField,
  adminTextarea,
  Field,
  pkr,
} from "@/components/admin/field";
import { AdminTableSkeleton } from "@/components/site/skeletons";
import { adminApi, mediaUrl, type OrderDoc, type ProductDoc } from "@/lib/api";
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
const PAY_METHODS = ["cod", "online"] as const;

type LineForm = {
  productId: string;
  name: string;
  slug: string;
  price: string;
  qty: string;
  color: string;
  size: string;
  gift: boolean;
  giftFee: string;
  giftMessage: string;
};

type OrderForm = {
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: "cod" | "online";
  paymentStatus: string;
  status: string;
  statusNote: string;
  shippingFee: string;
  discount: string;
  couponCode: string;
  notes: string;
  estimatedDelivery: string;
  transactionId: string;
  items: LineForm[];
  adjustStock: boolean;
};

const emptyLine = (): LineForm => ({
  productId: "",
  name: "",
  slug: "",
  price: "",
  qty: "1",
  color: "",
  size: "",
  gift: false,
  giftFee: "0",
  giftMessage: "",
});

const emptyForm = (): OrderForm => ({
  shipping: {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  },
  paymentMethod: "cod",
  paymentStatus: "pending",
  status: "confirmed",
  statusNote: "",
  shippingFee: "0",
  discount: "0",
  couponCode: "",
  notes: "",
  estimatedDelivery: "",
  transactionId: "",
  items: [emptyLine()],
  adjustStock: true,
});

function orderToForm(o: OrderDoc): OrderForm {
  return {
    shipping: {
      name: o.shipping?.name || "",
      email: o.shipping?.email || "",
      phone: o.shipping?.phone || "",
      address: o.shipping?.address || "",
      city: o.shipping?.city || "",
      postalCode: o.shipping?.postalCode || "",
    },
    paymentMethod: o.paymentMethod || "cod",
    paymentStatus: o.paymentStatus || "pending",
    status: o.status || "pending",
    statusNote: "",
    shippingFee: String(o.shippingFee ?? 0),
    discount: String(o.discount ?? 0),
    couponCode: o.couponCode || "",
    notes: o.notes || "",
    estimatedDelivery: o.estimatedDelivery || "",
    transactionId: o.transactionId || "",
    items: (o.items || []).map((item) => ({
      productId: typeof item.product === "string" ? item.product : "",
      name: item.name || "",
      slug: item.slug || "",
      price: String(item.price ?? 0),
      qty: String(item.qty ?? 1),
      color: item.color || "",
      size: item.size || "",
      gift: Boolean(item.gift),
      giftFee: String(item.giftFee ?? 0),
      giftMessage: item.giftMessage || "",
    })),
    adjustStock: false,
  };
}

function formToPayload(form: OrderForm) {
  const items = form.items
    .filter((l) => l.productId || l.name.trim() || l.slug.trim())
    .map((l) => ({
      productId: l.productId || undefined,
      slug: l.slug || undefined,
      name: l.name || undefined,
      price: Number(l.price) || 0,
      qty: Math.max(1, Number(l.qty) || 1),
      color: l.color,
      size: l.size,
      gift: l.gift,
      giftFee: Number(l.giftFee) || 0,
      giftMessage: l.giftMessage,
    }));

  return {
    shipping: {
      name: form.shipping.name.trim(),
      email: form.shipping.email.trim(),
      phone: form.shipping.phone.trim(),
      address: form.shipping.address.trim(),
      city: form.shipping.city.trim(),
      postalCode: form.shipping.postalCode.trim(),
    },
    paymentMethod: form.paymentMethod,
    paymentStatus: form.paymentStatus,
    status: form.status,
    statusNote: form.statusNote.trim() || undefined,
    shippingFee: Number(form.shippingFee) || 0,
    discount: Number(form.discount) || 0,
    couponCode: form.couponCode.trim(),
    notes: form.notes.trim(),
    estimatedDelivery: form.estimatedDelivery.trim(),
    transactionId: form.transactionId.trim(),
    items,
    adjustStock: form.adjustStock,
  };
}

function previewTotals(form: OrderForm) {
  const subtotal = form.items.reduce(
    (s, l) => s + (Number(l.price) || 0) * Math.max(1, Number(l.qty) || 1),
    0,
  );
  const giftTotal = form.items.reduce((s, l) => s + (l.gift ? Number(l.giftFee) || 0 : 0), 0);
  const discount = Math.max(0, Math.min(subtotal, Number(form.discount) || 0));
  const shippingFee = Math.max(0, Number(form.shippingFee) || 0);
  return {
    subtotal,
    giftTotal,
    discount,
    shippingFee,
    total: subtotal - discount + giftTotal + shippingFee,
  };
}

function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [selected, setSelected] = useState<OrderDoc | null>(null);
  const [form, setForm] = useState<OrderForm>(emptyForm());
  const [initialStatus, setInitialStatus] = useState("");

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter) p.status = statusFilter;
    if (searchApplied) p.q = searchApplied;
    return p;
  }, [statusFilter, searchApplied]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", queryParams],
    queryFn: () => adminApi.orders(Object.keys(queryParams).length ? queryParams : undefined),
    refetchInterval: 12000,
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminApi.products(),
  });
  const products = productsData?.products || [];

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (!payload.shipping.name) throw new Error("Customer name is required");
      if (!payload.shipping.phone) throw new Error("Phone is required");
      if (!payload.shipping.address) throw new Error("Address is required");
      if (!payload.shipping.city) throw new Error("City is required");
      if (!payload.items.length) throw new Error("Add at least one line item");

      if (mode === "create") {
        return adminApi.createOrder(payload);
      }
      if (!selected?._id) throw new Error("No order selected");
      return adminApi.updateOrder(selected._id, payload);
    },
    onSuccess: (res) => {
      toast.success(mode === "create" ? "Order created" : "Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      const order = res.order;
      setSelected(order);
      setForm(orderToForm(order));
      setInitialStatus(order.status);
      setMode("view");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickUpdateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateOrder(id, body),
    onSuccess: (res) => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      setSelected(res.order);
      setForm(orderToForm(res.order));
      setInitialStatus(res.order.status);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteOrder(id),
    onSuccess: () => {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      closePanel();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function closePanel() {
    setMode("closed");
    setSelected(null);
    setForm(emptyForm());
    setInitialStatus("");
  }

  function openCreate() {
    setSelected(null);
    setForm(emptyForm());
    setInitialStatus("");
    setMode("create");
  }

  async function openOrder(o: OrderDoc, edit = false) {
    setSelected(o);
    setForm(orderToForm(o));
    setInitialStatus(o.status);
    setMode(edit ? "edit" : "view");
    if (!o.isRead) {
      try {
        const res = await adminApi.markOrderRead(o._id);
        setSelected(res.order);
        setForm(orderToForm(res.order));
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
        qc.invalidateQueries({ queryKey: ["admin-unread-orders"] });
      } catch {
        /* keep selected */
      }
    }
  }

  function applyProduct(index: number, product: ProductDoc | undefined) {
    if (!product) return;
    setForm((f) => {
      const items = [...f.items];
      items[index] = {
        ...items[index],
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: String(product.price),
      };
      return { ...f, items };
    });
  }

  function updateLine(index: number, patch: Partial<LineForm>) {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], ...patch };
      return { ...f, items };
    });
  }

  const totals = previewTotals(form);
  const editing = mode === "create" || mode === "edit";

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
          <button type="button" className={adminBtn} onClick={openCreate}>
            Create order
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={adminField + " max-w-xs"}
          placeholder="Search order, name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearchApplied(search.trim());
          }}
        />
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => setSearchApplied(search.trim())}
        >
          Search
        </button>
        {searchApplied && (
          <button
            type="button"
            className={adminBtnGhost}
            onClick={() => {
              setSearch("");
              setSearchApplied("");
            }}
          >
            Clear
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

      {isLoading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[920px] text-left text-sm">
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
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() => void openOrder(o)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() => void openOrder(o, true)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() => {
                          if (
                            confirm(
                              `Delete order ${o.orderNumber}? Stock will be restored if the order is not cancelled.`,
                            )
                          ) {
                            deleteMut.mutate(o._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

      {mode !== "closed" && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {mode === "create"
                    ? "New order"
                    : mode === "edit"
                      ? "Edit order"
                      : "Order detail"}
                </p>
                <h2 className="font-display text-lg leading-tight">
                  {mode === "create" ? "Create order" : selected?.orderNumber}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {mode === "view" && selected && (
                  <button type="button" className={adminBtnGhost} onClick={() => setMode("edit")}>
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center"
                  onClick={closePanel}
                  aria-label="Close"
                >
                  <X width={18} height={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
              {mode === "view" && selected ? (
                <OrderView
                  order={selected}
                  onStatus={(status) =>
                    quickUpdateMut.mutate({ id: selected._id, body: { status } })
                  }
                  onPayment={(paymentStatus) =>
                    quickUpdateMut.mutate({ id: selected._id, body: { paymentStatus } })
                  }
                  onDelete={() => {
                    if (
                      confirm(
                        `Delete order ${selected.orderNumber}? Stock will be restored if not cancelled.`,
                      )
                    ) {
                      deleteMut.mutate(selected._id);
                    }
                  }}
                />
              ) : (
                <OrderEditor
                  form={form}
                  setForm={setForm}
                  products={products}
                  totals={totals}
                  initialStatus={initialStatus}
                  applyProduct={applyProduct}
                  updateLine={updateLine}
                />
              )}
            </div>

            {editing && (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <input
                    type="checkbox"
                    checked={form.adjustStock}
                    onChange={(e) => setForm((f) => ({ ...f, adjustStock: e.target.checked }))}
                  />
                  Adjust product stock
                </label>
                <div className="flex gap-2">
                  <button type="button" className={adminBtnOutline} onClick={closePanel}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={adminBtn}
                    disabled={saveMut.isPending}
                    onClick={() => saveMut.mutate()}
                  >
                    {saveMut.isPending
                      ? "Saving…"
                      : mode === "create"
                        ? "Create order"
                        : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderView({
  order,
  onStatus,
  onPayment,
  onDelete,
}: {
  order: OrderDoc;
  onStatus: (s: string) => void;
  onPayment: (s: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <dl className="space-y-2 font-mono text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="text-right">
            {order.shipping.name}
            <br />
            {order.shipping.email || "—"}
            <br />
            {order.shipping.phone}
            <br />
            {order.shipping.address}, {order.shipping.city}
            {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right uppercase">
            {order.paymentMethod} · {order.paymentStatus}
          </dd>
        </div>
        {order.transactionId && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Txn ID</dt>
            <dd className="break-all text-right">{order.transactionId}</dd>
          </div>
        )}
        {order.paymentProof && (
          <div>
            <dt className="text-muted-foreground">Payment proof</dt>
            <dd className="mt-2">
              <a href={mediaUrl(order.paymentProof)} target="_blank" rel="noreferrer">
                <img
                  src={mediaUrl(order.paymentProof)}
                  alt="Payment proof"
                  className="max-h-48 border border-border object-contain"
                />
              </a>
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{pkr(order.subtotal)}</dd>
        </div>
        {(order.discount ?? 0) > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Discount{order.couponCode ? ` (${order.couponCode})` : ""}
            </dt>
            <dd>-{pkr(order.discount || 0)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Gift wrapping</dt>
          <dd>{pkr(order.giftTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd>{pkr(order.shippingFee)}</dd>
        </div>
        {(order.charges || []).map((c, i) => (
          <div key={`${c.label}-${i}`} className="flex justify-between">
            <dt className="text-muted-foreground">{c.label}</dt>
            <dd>{pkr(c.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-sm">
          <dt>Total</dt>
          <dd>{pkr(order.total)}</dd>
        </div>
        {order.notes && (
          <div className="pt-2">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm normal-case tracking-normal">
              {order.notes}
            </dd>
          </div>
        )}
      </dl>

      <ul className="divide-y divide-border border-y border-border">
        {order.items.map((item, i) => (
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

      {(order.statusHistory || []).length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Status history
          </p>
          <ul className="mt-2 space-y-2 border border-border p-3 font-mono text-[11px]">
            {(order.statusHistory || []).map((h, i) => (
              <li key={`${h.status}-${i}`} className="flex justify-between gap-3">
                <span className="uppercase">
                  {h.status}
                  {h.note ? ` · ${h.note}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {h.at ? new Date(h.at).toLocaleString("en-PK") : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status">
          <select
            className={adminField}
            value={order.status}
            onChange={(e) => onStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment">
          <select
            className={adminField}
            value={order.paymentStatus}
            onChange={(e) => onPayment(e.target.value)}
          >
            {PAYMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button type="button" className={adminBtnOutline} onClick={onDelete}>
        Delete order
      </button>
    </>
  );
}

function OrderEditor({
  form,
  setForm,
  products,
  totals,
  initialStatus,
  applyProduct,
  updateLine,
}: {
  form: OrderForm;
  setForm: Dispatch<SetStateAction<OrderForm>>;
  products: ProductDoc[];
  totals: ReturnType<typeof previewTotals>;
  initialStatus: string;
  applyProduct: (index: number, product: ProductDoc | undefined) => void;
  updateLine: (index: number, patch: Partial<LineForm>) => void;
}) {
  return (
    <>
      <section className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Customer & shipping
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              required
              className={adminField}
              value={form.shipping.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping: { ...f.shipping, name: e.target.value } }))
              }
            />
          </Field>
          <Field label="Phone">
            <input
              required
              className={adminField}
              value={form.shipping.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping: { ...f.shipping, phone: e.target.value } }))
              }
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={adminField}
              value={form.shipping.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping: { ...f.shipping, email: e.target.value } }))
              }
            />
          </Field>
          <Field label="City">
            <input
              required
              className={adminField}
              value={form.shipping.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping: { ...f.shipping, city: e.target.value } }))
              }
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea
              required
              rows={2}
              className={adminTextarea}
              value={form.shipping.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping: { ...f.shipping, address: e.target.value } }))
              }
            />
          </Field>
          <Field label="Postal code">
            <input
              className={adminField}
              value={form.shipping.postalCode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shipping: { ...f.shipping, postalCode: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Estimated delivery">
            <input
              className={adminField}
              value={form.estimatedDelivery}
              onChange={(e) => setForm((f) => ({ ...f, estimatedDelivery: e.target.value }))}
              placeholder="e.g. 3–5 business days"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Line items
          </p>
          <button
            type="button"
            className={adminBtnGhost}
            onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyLine()] }))}
          >
            <Plus width={12} height={12} className="mr-1" />
            Add item
          </button>
        </div>
        <div className="space-y-4">
          {form.items.map((line, index) => (
            <div key={index} className="space-y-3 border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <Field label="Product" className="min-w-0 flex-1">
                  <select
                    className={adminField}
                    value={line.productId}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        updateLine(index, { productId: "" });
                        return;
                      }
                      applyProduct(
                        index,
                        products.find((p) => p._id === id),
                      );
                    }}
                  >
                    <option value="">Custom / select product…</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} · {pkr(p.price)}
                      </option>
                    ))}
                  </select>
                </Field>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    className={adminBtnGhost + " mt-6"}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        items: f.items.filter((_, i) => i !== index),
                      }))
                    }
                    aria-label="Remove item"
                  >
                    <Trash2 width={14} height={14} />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={adminField}
                    value={line.name}
                    onChange={(e) => updateLine(index, { name: e.target.value })}
                  />
                </Field>
                <Field label="Slug">
                  <input
                    className={adminField}
                    value={line.slug}
                    onChange={(e) => updateLine(index, { slug: e.target.value })}
                  />
                </Field>
                <Field label="Price">
                  <input
                    type="number"
                    min={0}
                    className={adminField}
                    value={line.price}
                    onChange={(e) => updateLine(index, { price: e.target.value })}
                  />
                </Field>
                <Field label="Qty">
                  <input
                    type="number"
                    min={1}
                    className={adminField}
                    value={line.qty}
                    onChange={(e) => updateLine(index, { qty: e.target.value })}
                  />
                </Field>
                <Field label="Color">
                  <input
                    className={adminField}
                    value={line.color}
                    onChange={(e) => updateLine(index, { color: e.target.value })}
                  />
                </Field>
                <Field label="Size">
                  <input
                    className={adminField}
                    value={line.size}
                    onChange={(e) => updateLine(index, { size: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                <input
                  type="checkbox"
                  checked={line.gift}
                  onChange={(e) => updateLine(index, { gift: e.target.checked })}
                />
                Gift wrap
              </label>
              {line.gift && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Gift fee">
                    <input
                      type="number"
                      min={0}
                      className={adminField}
                      value={line.giftFee}
                      onChange={(e) => updateLine(index, { giftFee: e.target.value })}
                    />
                  </Field>
                  <Field label="Gift message">
                    <input
                      className={adminField}
                      value={line.giftMessage}
                      onChange={(e) => updateLine(index, { giftMessage: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Payment & fulfillment
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Payment method">
            <select
              className={adminField}
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  paymentMethod: e.target.value as "cod" | "online",
                }))
              }
            >
              {PAY_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment status">
            <select
              className={adminField}
              value={form.paymentStatus}
              onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
            >
              {PAYMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order status">
            <select
              className={adminField}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transaction ID">
            <input
              className={adminField}
              value={form.transactionId}
              onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value }))}
            />
          </Field>
          {form.status !== initialStatus && initialStatus && (
            <Field label="Status note" className="sm:col-span-2">
              <input
                className={adminField}
                value={form.statusNote}
                onChange={(e) => setForm((f) => ({ ...f, statusNote: e.target.value }))}
                placeholder="Optional note for status history"
              />
            </Field>
          )}
          <Field label="Shipping fee">
            <input
              type="number"
              min={0}
              className={adminField}
              value={form.shippingFee}
              onChange={(e) => setForm((f) => ({ ...f, shippingFee: e.target.value }))}
            />
          </Field>
          <Field label="Discount amount">
            <input
              type="number"
              min={0}
              className={adminField}
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            />
          </Field>
          <Field label="Coupon code">
            <input
              className={adminField}
              value={form.couponCode}
              onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
            />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={3}
              className={adminTextarea}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      <div className="border border-border p-4 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{pkr(totals.subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span>-{pkr(totals.discount)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Gift</span>
          <span>{pkr(totals.giftTotal)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{pkr(totals.shippingFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
          <span>Total</span>
          <span>{pkr(totals.total)}</span>
        </div>
      </div>
    </>
  );
}
