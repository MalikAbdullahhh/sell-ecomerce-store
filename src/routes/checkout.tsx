import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronUp, Phone, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { money, useBrand, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { discountApi, orderApi, mediaUrl, type OrderResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Aperture" },
      {
        name: "description",
        content: "Three-step checkout with Cash on Delivery or card payment.",
      },
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
  const {
    lines,
    lineProduct,
    subtotal,
    giftTotal,
    shipping,
    charges,
    total,
    clearCart,
    settings,
    refreshSettings,
    setGift,
    setGiftMessage,
  } = useStore();
  const { name: brandName } = useBrand();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState<"cod" | "online">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [result, setResult] = useState<OrderResponse | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [accountChoice, setAccountChoice] = useState(false);
  const [accountMode, setAccountMode] = useState(false);
  const [password, setPassword] = useState("");
  const [placing, setPlacing] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountAmount: number;
    remainingUses: number;
    type: "percent" | "flat";
    value: number;
  } | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Pull latest admin-managed fees (gift, shipping, tax…) so totals stay live.
  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  // Autofill from the signed-in profile whenever auth resolves or profile changes.
  useEffect(() => {
    if (authLoading || !user) return;
    const addr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
    setShippingForm({
      name: (user.name || addr?.name || "").trim(),
      email: (user.email || "").trim(),
      phone: (user.phone || addr?.phone || "").trim(),
      address: (addr?.address || "").trim(),
      city: (addr?.city || "").trim(),
      postalCode: (addr?.postalCode || "").trim(),
    });
  }, [authLoading, user, user?.id, user?.name, user?.email, user?.phone, user?.addresses]);

  const setField = (key: keyof typeof shippingForm, value: string) =>
    setShippingForm((prev) => ({ ...prev, [key]: value }));

  const validateShipping = () => {
    if (!shippingForm.name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (shippingForm.phone.replace(/\D/g, "").length < 11) {
      toast.error("Phone must be at least 11 digits.");
      return false;
    }
    if (shippingForm.address.trim().length < 10) {
      toast.error("Address must be at least 10 characters.");
      return false;
    }
    if (!shippingForm.city.trim()) {
      toast.error("City is required.");
      return false;
    }
    return true;
  };

  const applyDiscount = async () => {
    if (!discountInput.trim()) {
      toast.error("Enter a discount code.");
      return;
    }
    setApplyingDiscount(true);
    try {
      const res = await discountApi.validate({ code: discountInput.trim(), subtotal });
      setAppliedDiscount({
        code: res.code,
        discountAmount: res.discountAmount,
        remainingUses: res.remainingUses,
        type: res.type,
        value: res.value,
      });
      if (res.discountAmount > 0) toast.success(`Discount applied (${res.code}).`);
      else toast.success(`Code applied (${res.code}).`);
    } catch (err) {
      setAppliedDiscount(null);
      toast.error(err instanceof Error ? err.message : "Invalid discount code");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const discountCode = appliedDiscount?.code ?? null;

  const freeThreshold = Number(settings?.shipping?.freeThreshold ?? 20000) || 0;
  const flatFee = Number(settings?.shipping?.flatFee ?? 250) || 0;
  const goodsSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingComputed = goodsSubtotal === 0 || goodsSubtotal >= freeThreshold ? 0 : flatFee;

  const chargesComputed = (settings?.extraCharges || [])
    .filter((c) => c && c.enabled !== false && c.label && Number(c.value) > 0)
    .map((c) => ({
      label: c.label,
      amount:
        c.type === "percent"
          ? Math.round((goodsSubtotal * (Number(c.value) || 0)) / 100)
          : Number(c.value) || 0,
    }))
    .filter((c) => c.amount > 0);
  const chargesTotalComputed = chargesComputed.reduce((sum, c) => sum + c.amount, 0);
  const totalComputed = goodsSubtotal + giftTotal + shippingComputed + chargesTotalComputed;

  const placeOrder = async (createAccount = false) => {
    if (!validateShipping()) return;
    if (createAccount && (!shippingForm.email.trim() || password.length < 6)) {
      toast.error("Email and a 6-character password are required to create an account.");
      return;
    }
    setPlacing(true);
    try {
      const response = await orderApi.create({
        shipping: shippingForm,
        paymentMethod: pay,
        discountCode: discountCode || undefined,
        items: lines.map((l) => ({
          slug: l.slug,
          color: l.color,
          size: l.size,
          qty: l.qty,
          gift: l.gift,
          giftMessage: l.giftMessage,
        })),
        createAccount,
        accountPassword: createAccount ? password : undefined,
        transactionId: pay === "online" ? transactionId.trim() || undefined : undefined,
        paymentProof: pay === "online" ? paymentProofUrl || undefined : undefined,
      });
      setResult(response);
      setAccountChoice(false);
      clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  const continueStep = () => {
    if (step === 0 && !validateShipping()) return;
    if (step < 2) setStep(step + 1);
    else if (user) void placeOrder(false);
    else setAccountChoice(true);
  };

  if (result) {
    const order = result.order;
    const contact = result.settings.contact;
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center border border-foreground">
            <Check width={22} height={22} />
          </div>
          <h1 className="mt-6 text-4xl">Order confirmed</h1>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            {order.orderNumber} · Estimated delivery {order.estimatedDelivery}
          </p>
        </div>

        <section className="mt-10 border border-foreground p-5 sm:p-8">
          <div className="flex items-end justify-between border-b border-border pb-5">
            <div>
              <Eyebrow>Receipt</Eyebrow>
              <p className="mt-1 font-mono text-xs">
                {new Date(order.createdAt).toLocaleString("en-PK")}
              </p>
            </div>
            <p className="font-display text-xl">{brandName}</p>
          </div>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={`${item.slug}-${item.color}-${item.size}`} className="flex gap-4 py-4">
                {item.image && (
                  <img
                    src={mediaUrl(item.image)}
                    alt=""
                    className="h-16 w-16 border border-border object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {[item.color, item.size].filter(Boolean).join(" · ")} · Qty {item.qty}
                  </p>
                  {item.gift && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      🎁 Gift wrapped
                      {item.giftMessage ? ` — "${item.giftMessage}"` : ""}
                    </p>
                  )}
                </div>
                <p className="font-mono text-sm">{money(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-foreground pt-4 font-mono text-xs">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>-{money(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Gift wrapping</dt>
              <dd>{money(order.giftTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingFee ? money(order.shippingFee) : "Free"}</dd>
            </div>
            {(order.charges || []).map((c) => (
              <div key={c.label} className="flex justify-between">
                <dt>{c.label}</dt>
                <dd>{money(c.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-base">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ship to
              </p>
              <p className="mt-2">
                {order.shipping.name}
                <br />
                {order.shipping.address}
                <br />
                {order.shipping.city}
                <br />
                {order.shipping.phone}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Payment
              </p>
              <p className="mt-2">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online transfer"}
                <br />
                <span className="text-muted-foreground">
                  {order.paymentStatus.replaceAll("_", " ")}
                </span>
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {user && (
            <Link
              to="/account/orders"
              className="glass-sweep grid h-12 place-items-center bg-primary px-8 font-mono text-xs uppercase tracking-[0.22em] text-primary-foreground"
            >
              Track order
            </Link>
          )}
          <Link
            to="/shop"
            className="glass-sweep grid h-12 place-items-center border border-foreground px-8 font-mono text-xs uppercase tracking-[0.22em]"
          >
            Keep shopping
          </Link>
        </div>
        <div className="mt-10 border-t border-border pt-8 text-center">
          <Eyebrow>Contact & help</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">{result.settings.help.helpText}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              href={`tel:${contact.phone}`}
              className="flex h-11 items-center gap-2 border border-foreground px-4 font-mono text-xs"
            >
              <Phone width={15} /> {contact.phone}
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
              className="flex h-11 items-center gap-2 bg-primary px-4 font-mono text-xs text-primary-foreground"
            >
              <MessageCircle width={15} /> WhatsApp
            </a>
          </div>
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
            <span
              className={cn(
                "h-1 flex-1 transition-colors duration-500",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.18em] transition-opacity duration-300",
                i === step ? "opacity-100" : "opacity-45",
              )}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[240px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={shippingForm.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={field}
                    placeholder="Full name *"
                    autoComplete="name"
                  />
                  <input
                    value={shippingForm.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={field}
                    placeholder="Email (optional)"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                  <input
                    required
                    value={shippingForm.address}
                    onChange={(e) => setField("address", e.target.value)}
                    className={cn(field, "sm:col-span-2")}
                    placeholder="Street address *"
                    autoComplete="street-address"
                  />
                  <input
                    required
                    value={shippingForm.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className={field}
                    placeholder="City *"
                    autoComplete="address-level2"
                  />
                  <input
                    value={shippingForm.postalCode}
                    onChange={(e) => setField("postalCode", e.target.value)}
                    className={field}
                    placeholder="Postal code (optional)"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                  <input
                    required
                    value={shippingForm.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={cn(field, "sm:col-span-2")}
                    placeholder="Phone *"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  {(["cod", "online"] as const)
                    .filter((m) =>
                      m === "cod"
                        ? settings?.payment.codEnabled !== false
                        : settings?.payment.onlineEnabled !== false,
                    )
                    .map((m) => (
                      <button
                        key={m}
                        onClick={() => setPay(m)}
                        className={cn(
                          "w-full border p-5 text-left transition-colors",
                          pay === m ? "border-foreground ring-1 ring-foreground" : "border-border",
                        )}
                      >
                        <p className="font-medium">
                          {m === "cod" ? "Cash on Delivery" : "Pay online"}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {m === "cod"
                            ? "Pay the courier at handover"
                            : "Scan QR or transfer using the provided account details"}
                        </p>
                      </button>
                    ))}
                  <AnimatePresence>
                    {pay === "online" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border border-border p-5"
                      >
                        {settings?.payment.online.qrImage && (
                          <img
                            src={mediaUrl(settings.payment.online.qrImage)}
                            alt="Payment QR code"
                            className="mx-auto h-48 w-48 object-contain"
                          />
                        )}
                        <dl className="mt-4 space-y-2 font-mono text-xs">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Account name</dt>
                            <dd className="text-right">{settings?.payment.online.accountName}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Account number</dt>
                            <dd className="text-right">{settings?.payment.online.accountNumber}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Bank</dt>
                            <dd className="text-right">{settings?.payment.online.bankName}</dd>
                          </div>
                          {settings?.payment.online.iban && (
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">IBAN</dt>
                              <dd className="break-all text-right">
                                {settings.payment.online.iban}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <p className="mt-4 text-sm text-muted-foreground">
                          {settings?.payment.online.instructions}
                        </p>

                        <div className="mt-5 space-y-3 border-t border-border pt-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Payment proof (optional)
                          </p>
                          <input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className={field}
                            placeholder="Transaction ID (optional)"
                          />
                          <label
                            className={cn(
                              "relative flex min-h-12 cursor-pointer items-center justify-between gap-3 border border-dashed border-border px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-foreground",
                              uploadingProof && "pointer-events-none opacity-70",
                            )}
                          >
                            <span className="inline-flex items-center gap-2">
                              {uploadingProof && (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                              )}
                              {uploadingProof
                                ? "Uploading…"
                                : paymentProofUrl
                                  ? "Change proof image"
                                  : "Upload transfer screenshot"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                setUploadingProof(true);
                                try {
                                  const res = await orderApi.uploadPaymentProof(file);
                                  setPaymentProofUrl(res.url);
                                  setPaymentProofPreview(URL.createObjectURL(file));
                                  toast.success("Proof uploaded");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Could not upload proof",
                                  );
                                } finally {
                                  setUploadingProof(false);
                                }
                              }}
                            />
                          </label>
                          {(paymentProofPreview || paymentProofUrl) && (
                            <div className="relative inline-block">
                              <img
                                src={paymentProofPreview || mediaUrl(paymentProofUrl)}
                                alt="Payment proof preview"
                                className="max-h-40 border border-border object-contain"
                              />
                              <button
                                type="button"
                                aria-label="Remove proof"
                                onClick={() => {
                                  setPaymentProofUrl("");
                                  setPaymentProofPreview("");
                                }}
                                className="absolute right-1 top-1 grid h-8 w-8 place-items-center bg-background/90"
                              >
                                <X width={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile: items + discount code (important on COD/Online screen) */}
                  <div className="mt-4 rounded-2xl border border-border bg-background/60 p-4 md:hidden">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
                      Order items
                    </p>
                    <ul className="mt-3 space-y-3">
                      {lines.map((l) => {
                        const p = lineProduct(l);
                        if (!p) return null;
                        const giftFee = Number(settings?.shipping?.giftFee ?? 0) || 0;
                        const lineTotal = p.price * l.qty + (l.gift ? giftFee : 0);
                        return (
                          <li key={l.id} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.name}</p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {l.color} · Qty {l.qty}
                                {l.gift ? ` · Gift` : ""}
                              </p>
                            </div>
                            <p className="shrink-0 font-mono text-sm">{money(lineTotal)}</p>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={discountInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDiscountInput(v);
                          if (
                            appliedDiscount &&
                            v.trim().toUpperCase() !== appliedDiscount.code.toUpperCase()
                          ) {
                            setAppliedDiscount(null);
                          }
                        }}
                        placeholder="Discount code"
                        className="h-11 min-w-0 flex-1 border border-border bg-transparent px-3 font-mono text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void applyDiscount()}
                        disabled={applyingDiscount || !discountInput.trim()}
                        className="h-11 bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
                      >
                        {applyingDiscount ? "…" : "Apply"}
                      </button>
                    </div>

                    {appliedDiscount && (
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        Applied <span className="text-foreground">{appliedDiscount.code}</span>{" "}
                        {appliedDiscount.discountAmount > 0
                          ? `· -${money(appliedDiscount.discountAmount)}`
                          : ""}
                        {appliedDiscount.remainingUses >= 0
                          ? `· ${appliedDiscount.remainingUses} uses left`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <ul className="divide-y divide-border border-y border-border">
                  {lines.map((l) => {
                    const p = lineProduct(l);
                    if (!p) return null;
                    const giftFee = Number(settings?.shipping?.giftFee ?? 0) || 0;
                    return (
                      <li key={l.id} className="py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-16 w-16 border border-border object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {l.color} · Qty {l.qty}
                            </p>
                          </div>
                          <span className="font-mono text-sm">
                            {money(p.price * l.qty + (l.gift ? giftFee : 0))}
                          </span>
                        </div>
                        <label className="mt-3 flex items-center gap-2 font-mono text-[11px]">
                          <input
                            type="checkbox"
                            checked={Boolean(l.gift)}
                            onChange={(e) => setGift(l.id, e.target.checked)}
                          />
                          Gift wrap +{money(giftFee)}
                        </label>
                        {l.gift && (
                          <input
                            className="mt-2 h-10 w-full border border-border bg-transparent px-3 font-mono text-xs outline-none focus:border-foreground"
                            placeholder="Gift message (optional)"
                            value={l.giftMessage || ""}
                            onChange={(e) => setGiftMessage(l.id, e.target.value)}
                          />
                        )}
                      </li>
                    );
                  })}
                  <li className="py-4 font-mono text-xs text-muted-foreground">
                    Payment: {pay === "cod" ? "Cash on Delivery" : "Online transfer / QR"}
                    {pay === "online" && transactionId ? ` · Txn ${transactionId}` : ""}
                    {pay === "online" && paymentProofUrl ? " · Proof attached" : ""}
                  </li>
                </ul>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 hidden gap-3 md:flex">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="glass-sweep h-12 border border-foreground px-8 font-mono text-xs uppercase tracking-[0.22em]"
              >
                Back
              </button>
            )}
            <button
              onClick={continueStep}
              disabled={placing || lines.length === 0}
              className="glass-sweep h-12 bg-primary px-8 font-mono text-xs uppercase tracking-[0.22em] text-primary-foreground"
            >
              {placing ? "Placing…" : step === 2 ? "Place order" : "Continue"}
            </button>
          </div>
        </div>

        <aside className="hidden h-fit border border-border p-6 lg:sticky lg:top-24 lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
            Order summary
          </p>
          <div className="mt-5 flex gap-2">
            <input
              value={discountInput}
              onChange={(e) => {
                const v = e.target.value;
                setDiscountInput(v);
                if (
                  appliedDiscount &&
                  v.trim().toUpperCase() !== appliedDiscount.code.toUpperCase()
                ) {
                  setAppliedDiscount(null);
                }
              }}
              placeholder="Discount code"
              className="h-11 min-w-0 flex-1 border border-border bg-transparent px-3 font-mono text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => void applyDiscount()}
              disabled={applyingDiscount || !discountInput.trim()}
              className="h-11 bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
            >
              {applyingDiscount ? "…" : "Apply"}
            </button>
          </div>
          {appliedDiscount && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Applied <span className="text-foreground">{appliedDiscount.code}</span>
              {appliedDiscount.discountAmount > 0
                ? ` · -${money(appliedDiscount.discountAmount)}`
                : " · No discount amount"}
              {appliedDiscount.remainingUses >= 0
                ? ` · ${appliedDiscount.remainingUses} uses left`
                : ""}
            </p>
          )}

          <dl className="mt-4 space-y-3 font-mono text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd>-{money(discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Gift wrapping</dt>
              <dd>{money(giftTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shippingComputed === 0 ? "Free" : money(shippingComputed)}</dd>
            </div>
            {chargesComputed.map((c) => (
              <div key={c.label} className="flex justify-between">
                <dt className="text-muted-foreground">{c.label}</dt>
                <dd>{money(c.amount)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex justify-between border-t border-border pt-4 font-mono text-base">
            <span className="uppercase tracking-[0.18em]">Total</span>
            <span>{money(totalComputed)}</span>
          </div>
        </aside>
      </div>

      <section className="mt-16 border-t border-border pt-8">
        <Eyebrow>Contact & help</Eyebrow>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {settings?.help.helpText || "Need help placing your order? Reach us by call or WhatsApp."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`tel:${settings?.contact.phone || ""}`}
            className="flex h-11 items-center gap-2 border border-foreground px-4 font-mono text-xs"
          >
            <Phone width={15} /> {settings?.contact.phone || "Call us"}
          </a>
          <a
            href={`https://wa.me/${(settings?.contact.whatsapp || "").replace(/\D/g, "")}`}
            className="flex h-11 items-center gap-2 bg-primary px-4 font-mono text-xs text-primary-foreground"
          >
            <MessageCircle width={15} /> WhatsApp
          </a>
        </div>
      </section>

      <AnimatePresence>
        {accountChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-foreground/60 p-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="relative w-full max-w-lg bg-background p-6 sm:p-8"
            >
              <button
                onClick={() => setAccountChoice(false)}
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center"
              >
                <X width={18} />
              </button>
              <Eyebrow>Before you place the order</Eyebrow>
              <h2 className="mt-2 text-3xl">Continue with an account?</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                An account saves this order to your private order history. Guest orders cannot be
                tracked from an account later.
              </p>
              {accountMode && (
                <div className="mt-5 grid gap-3">
                  <input
                    required
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={field}
                    placeholder="Email *"
                  />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={field}
                    placeholder="Create password (6+ characters) *"
                  />
                </div>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => (accountMode ? void placeOrder(true) : setAccountMode(true))}
                  disabled={placing}
                  className="h-12 bg-primary px-4 font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
                >
                  {accountMode ? "Create & place order" : "Continue with account"}
                </button>
                <button
                  onClick={() => void placeOrder(false)}
                  disabled={placing}
                  className="h-12 border border-foreground px-4 font-mono text-xs uppercase tracking-[0.18em] disabled:opacity-50"
                >
                  Continue as guest
                </button>
              </div>
              <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground">
                Already registered?{" "}
                <Link to="/account" className="underline">
                  Sign in
                </Link>
                , then return — your checkout remains saved.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sticky summary + action */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 font-mono text-xs"
        >
          <span className="uppercase tracking-[0.18em]">Order total</span>
          <span className="flex items-center gap-2">
            {money(totalComputed)}{" "}
            <ChevronUp width={14} height={14} className={expanded ? "rotate-180" : ""} />
          </span>
        </button>
        <AnimatePresence>
          {expanded && (
            <>
              <motion.dl
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2 border-t border-border px-4 py-3 font-mono text-[12px]"
              >
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd>-{money(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Gift wrapping</dt>
                  <dd>{money(giftTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>{shippingComputed === 0 ? "Free" : money(shippingComputed)}</dd>
                </div>
                {chargesComputed.map((c) => (
                  <div key={c.label} className="flex justify-between">
                    <dt className="text-muted-foreground">{c.label}</dt>
                    <dd>{money(c.amount)}</dd>
                  </div>
                ))}
              </motion.dl>

              <div className="px-4 pb-3">
                <div className="flex gap-2">
                  <input
                    value={discountInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiscountInput(v);
                      if (
                        appliedDiscount &&
                        v.trim().toUpperCase() !== appliedDiscount.code.toUpperCase()
                      ) {
                        setAppliedDiscount(null);
                      }
                    }}
                    placeholder="Discount code"
                    className="h-11 min-w-0 flex-1 border border-border bg-transparent px-3 font-mono text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void applyDiscount()}
                    disabled={applyingDiscount || !discountInput.trim()}
                    className="h-11 bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
                  >
                    {applyingDiscount ? "…" : "Apply"}
                  </button>
                </div>
                {appliedDiscount && (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    Applied <span className="text-foreground">{appliedDiscount.code}</span>
                    {appliedDiscount.discountAmount > 0
                      ? ` · -${money(appliedDiscount.discountAmount)}`
                      : ""}
                    {appliedDiscount.remainingUses >= 0
                      ? ` · ${appliedDiscount.remainingUses} uses left`
                      : ""}
                  </p>
                )}
              </div>
            </>
          )}
        </AnimatePresence>
        <div className="flex gap-2 px-3 pb-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="glass-sweep h-12 border border-foreground px-5 font-mono text-xs uppercase tracking-[0.2em]"
            >
              Back
            </button>
          )}
          <button
            onClick={continueStep}
            disabled={placing || lines.length === 0}
            className="glass-sweep h-12 flex-1 bg-primary font-mono text-xs uppercase tracking-[0.22em] text-primary-foreground"
          >
            {placing ? "Placing…" : step === 2 ? "Place order" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
