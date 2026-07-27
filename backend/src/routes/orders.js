import { Router } from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import SiteSettings from "../models/SiteSettings.js";
import User from "../models/User.js";
import { requireUser, requireAdmin, optionalUser } from "../middleware/auth.js";
import { signUserToken } from "../middleware/auth.js";
import { sendOrderConfirmation } from "../utils/email.js";
import { asyncHandler, makeOrderNumber, estimatedDeliveryLabel } from "../utils/helpers.js";

const router = Router();

async function getSettings() {
  let s = await SiteSettings.findOne({ key: "main" });
  if (!s) s = await SiteSettings.create({ key: "main" });
  return s;
}

router.post(
  "/",
  optionalUser,
  asyncHandler(async (req, res) => {
    const {
      shipping,
      paymentMethod,
      items,
      notes,
      createAccount,
      accountPassword,
      transactionId,
      paymentProof,
      discountCode,
    } = req.body;

    if (!shipping?.name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!shipping?.phone?.trim() || shipping.phone.replace(/\D/g, "").length < 11) {
      return res.status(400).json({ message: "Phone must be at least 11 digits" });
    }
    if (!shipping?.address?.trim() || shipping.address.trim().length < 10) {
      return res.status(400).json({ message: "Address must be at least 10 characters" });
    }
    if (!shipping?.city?.trim()) return res.status(400).json({ message: "City is required" });
    if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Select a payment method (COD or Online)" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const settings = await getSettings();
    if (paymentMethod === "cod" && !settings.payment.codEnabled) {
      return res.status(400).json({ message: "Cash on Delivery is currently unavailable" });
    }
    if (paymentMethod === "online" && !settings.payment.onlineEnabled) {
      return res.status(400).json({ message: "Online payment is currently unavailable" });
    }
    if (!settings.payment.codEnabled && !settings.payment.onlineEnabled) {
      return res.status(400).json({ message: "No payment methods are enabled" });
    }

    const giftFee = Number(settings.shipping.giftFee ?? 500) || 0;
    const freeThreshold = Number(settings.shipping.freeThreshold ?? 20000) || 0;
    const flatFee = Number(settings.shipping.flatFee ?? 250) || 0;

    const lineDocs = [];
    let subtotal = 0;
    let giftTotal = 0;

    for (const line of items) {
      const product = await Product.findOne({
        $or: [{ slug: line.slug }, { _id: line.productId }],
        isActive: true,
      });
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product not found: ${line.slug || line.productId}` });
      }
      if (!product.inStock || product.stock < (line.qty || 1)) {
        return res.status(400).json({ message: `${product.name} is out of stock` });
      }
      const qty = Math.max(1, Number(line.qty) || 1);
      const gift = Boolean(line.gift);
      const lineGift = gift ? giftFee : 0;
      giftTotal += lineGift;
      subtotal += product.price * qty;
      lineDocs.push({
        product: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0] || "",
        color: line.color || "",
        size: line.size || "",
        qty,
        price: product.price,
        gift,
        giftFee: lineGift,
        giftMessage: gift ? (line.giftMessage || "").trim().slice(0, 500) : "",
      });
    }

    // Optional discount code applied at checkout.
    let discountAmount = 0;
    let discountedSubtotal = subtotal;
    const normalizedCode = String(discountCode || "").trim().toUpperCase();
    if (normalizedCode) {
      const coupon = (settings.discountCodes || []).find(
        (c) => String(c.code || "").trim().toUpperCase() === normalizedCode && c.enabled !== false,
      );

      if (!coupon) return res.status(400).json({ message: "Invalid discount code" });

      const maxUses = Number(coupon.maxUses) || 0;
      const usedUses = Number(coupon.usedUses) || 0;
      const remainingUses = maxUses - usedUses;
      if (remainingUses <= 0) return res.status(400).json({ message: "Discount code exhausted" });

      const value = Number(coupon.value) || 0;
      if (value > 0 && subtotal > 0) {
        discountAmount =
          coupon.type === "percent"
            ? Math.round((subtotal * value) / 100)
            : Math.round(value);
        discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
        discountedSubtotal = subtotal - discountAmount;
      }
    }

    const shippingFee =
      discountedSubtotal === 0 || discountedSubtotal >= freeThreshold ? 0 : flatFee;

    // Admin-defined extra charges (tax, delivery surcharge, handling, …).
    // Percentage charges are computed against the discounted goods subtotal.
    const charges = [];
    let chargesTotal = 0;
    for (const charge of settings.extraCharges || []) {
      if (!charge || charge.enabled === false || !charge.label) continue;
      const amount =
        charge.type === "percent"
          ? Math.round((discountedSubtotal * (Number(charge.value) || 0)) / 100)
          : Number(charge.value) || 0;
      if (amount <= 0) continue;
      charges.push({ label: charge.label, amount });
      chargesTotal += amount;
    }

    const total = discountedSubtotal + giftTotal + shippingFee + chargesTotal;

    let user = req.user || null;
    let accountToken = null;
    let accountCreated = false;

    if (!user && createAccount && shipping.email?.trim()) {
      const email = shipping.email.toLowerCase().trim();
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({
          message: "An account with this email already exists. Sign in to continue with account.",
          code: "EMAIL_EXISTS",
        });
      }
      if (!accountPassword || accountPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user = await User.create({
        name: shipping.name.trim(),
        email,
        password: accountPassword,
        phone: shipping.phone.trim(),
        addresses: [
          {
            label: "Default",
            name: shipping.name.trim(),
            phone: shipping.phone.trim(),
            address: shipping.address.trim(),
            city: shipping.city.trim(),
            postalCode: shipping.postalCode || "",
            isDefault: true,
          },
        ],
      });
      accountToken = signUserToken(user);
      accountCreated = true;
    }

    const order = await Order.create({
      orderNumber: makeOrderNumber(),
      user: user?._id,
      guest: !user,
      items: lineDocs,
      shipping: {
        name: shipping.name.trim(),
        email: (shipping.email || "").trim().toLowerCase(),
        phone: shipping.phone.trim(),
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        postalCode: (shipping.postalCode || "").trim(),
      },
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "awaiting_transfer" : "pending",
      transactionId:
        paymentMethod === "online" ? String(transactionId || "").trim().slice(0, 120) : "",
      paymentProof:
        paymentMethod === "online" ? String(paymentProof || "").trim().slice(0, 500) : "",
      status: "confirmed",
      subtotal,
      giftTotal,
      shippingFee,
      charges,
      chargesTotal,
      discount: discountAmount,
      couponCode: normalizedCode || "",
      total,
      currency: "PKR",
      notes: notes || "",
      estimatedDelivery: estimatedDeliveryLabel(4),
      statusHistory: [{ status: "confirmed", note: "Order placed" }],
      isRead: false,
    });

    for (const line of lineDocs) {
      await Product.findByIdAndUpdate(line.product, {
        $inc: { stock: -line.qty, soldCount: line.qty },
      });
      const p = await Product.findById(line.product);
      if (p && p.stock <= 0) {
        p.inStock = false;
        await p.save();
      }
    }

    // Consume discount code usage after successful order placement.
    if (normalizedCode && discountAmount > 0) {
      const idx = (settings.discountCodes || []).findIndex(
        (c) => String(c.code || "").trim().toUpperCase() === normalizedCode && c.enabled !== false,
      );
      if (idx >= 0) {
        settings.discountCodes[idx].usedUses = Number(settings.discountCodes[idx].usedUses) + 1;
        await settings.save();
      }
    }

    let emailResult = { sent: false };
    try {
      emailResult = await sendOrderConfirmation(order, settings);
      if (emailResult.sent) {
        order.emailSent = true;
        await order.save();
      }
    } catch (err) {
      console.error("[email] failed", err.message);
    }

    res.status(201).json({
      order,
      accountToken,
      accountCreated,
      emailSent: Boolean(emailResult.sent),
      settings: {
        contact: settings.contact,
        help: settings.help,
        payment: settings.payment,
      },
    });
  }),
);

router.get(
  "/mine",
  requireUser,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  }),
);

router.get(
  "/mine/:orderNumber",
  requireUser,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
      user: req.user._id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  }),
);

router.get(
  "/admin/unread-count",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const count = await Order.countDocuments({ isRead: false });
    res.json({ count });
  }),
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, paymentMethod, q, unread } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (unread === "true") filter.isRead = false;
    if (q) {
      filter.$or = [
        { orderNumber: new RegExp(q, "i") },
        { "shipping.name": new RegExp(q, "i") },
        { "shipping.email": new RegExp(q, "i") },
        { "shipping.phone": new RegExp(q, "i") },
      ];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("user", "name email");
    const unreadCount = await Order.countDocuments({ isRead: false });
    res.json({ orders, unreadCount });
  }),
);

router.get(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate("user", "name email phone");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.isRead) {
      order.isRead = true;
      order.readAt = new Date();
      await order.save();
    }
    res.json({ order });
  }),
);

router.post(
  "/admin/:id/read",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    const unreadCount = await Order.countDocuments({ isRead: false });
    res.json({ order, unreadCount });
  }),
);

router.post(
  "/admin/mark-all-read",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    await Order.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ unreadCount: 0 });
  }),
);

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAY_STATUSES = ["pending", "awaiting_transfer", "paid", "failed", "refunded"];

async function buildAdminLineItems(items, { adjustStock = false, restoreFrom = [] } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error("At least one line item is required"), { status: 400 });
  }

  // Restore stock from previous lines when replacing items on edit.
  if (adjustStock && restoreFrom.length) {
    for (const prev of restoreFrom) {
      if (!prev?.product || !prev.qty) continue;
      const p = await Product.findById(prev.product);
      if (!p) continue;
      p.stock = Math.max(0, Number(p.stock || 0) + Number(prev.qty || 0));
      p.soldCount = Math.max(0, Number(p.soldCount || 0) - Number(prev.qty || 0));
      p.inStock = p.stock > 0;
      await p.save();
    }
  }

  const lineDocs = [];
  let subtotal = 0;
  let giftTotal = 0;

  for (const line of items) {
    let product = null;
    if (line.productId) product = await Product.findById(line.productId);
    else if (line.slug) product = await Product.findOne({ slug: line.slug });
    else if (line.product) product = await Product.findById(line.product);

    const qty = Math.max(1, Number(line.qty) || 1);
    const gift = Boolean(line.gift);
    const lineGift = gift ? Number(line.giftFee) || 0 : 0;
    const price =
      line.price !== undefined && line.price !== null && line.price !== ""
        ? Number(line.price)
        : product
          ? Number(product.price)
          : NaN;

    if (!Number.isFinite(price) || price < 0) {
      throw Object.assign(new Error(`Invalid price for item: ${line.name || line.slug || "unknown"}`), {
        status: 400,
      });
    }

    if (adjustStock && product) {
      if (product.stock < qty) {
        throw Object.assign(new Error(`${product.name} does not have enough stock`), { status: 400 });
      }
      product.stock -= qty;
      product.soldCount = Number(product.soldCount || 0) + qty;
      product.inStock = product.stock > 0;
      await product.save();
    }

    giftTotal += lineGift;
    subtotal += price * qty;
    lineDocs.push({
      product: product?._id || line.product || undefined,
      slug: product?.slug || line.slug || "",
      name: product?.name || line.name || "Custom item",
      image: product?.images?.[0] || line.image || "",
      color: line.color || "",
      size: line.size || "",
      qty,
      price,
      gift,
      giftFee: lineGift,
      giftMessage: gift ? String(line.giftMessage || "").trim().slice(0, 500) : "",
    });
  }

  return { lineDocs, subtotal, giftTotal };
}

function computeOrderTotals({
  subtotal,
  giftTotal,
  shippingFee,
  discount,
  charges,
}) {
  const chargesList = Array.isArray(charges)
    ? charges
        .filter((c) => c && String(c.label || "").trim())
        .map((c) => ({ label: String(c.label).trim(), amount: Math.max(0, Number(c.amount) || 0) }))
    : [];
  const chargesTotal = chargesList.reduce((s, c) => s + c.amount, 0);
  const discountAmount = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const ship = Math.max(0, Number(shippingFee) || 0);
  const gifts = Math.max(0, Number(giftTotal) || 0);
  const total = subtotal - discountAmount + gifts + ship + chargesTotal;
  return {
    charges: chargesList,
    chargesTotal,
    discount: discountAmount,
    shippingFee: ship,
    giftTotal: gifts,
    total,
  };
}

router.post(
  "/admin",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      shipping,
      paymentMethod = "cod",
      paymentStatus,
      status = "confirmed",
      items,
      notes,
      shippingFee,
      discount,
      couponCode,
      charges,
      transactionId,
      paymentProof,
      estimatedDelivery,
      adjustStock = true,
    } = req.body;

    if (!shipping?.name?.trim()) return res.status(400).json({ message: "Customer name is required" });
    if (!shipping?.phone?.trim()) return res.status(400).json({ message: "Phone is required" });
    if (!shipping?.address?.trim()) return res.status(400).json({ message: "Address is required" });
    if (!shipping?.city?.trim()) return res.status(400).json({ message: "City is required" });
    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({ message: "paymentMethod must be cod or online" });
    }

    let built;
    try {
      built = await buildAdminLineItems(items, { adjustStock: Boolean(adjustStock) });
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }

    const totals = computeOrderTotals({
      subtotal: built.subtotal,
      giftTotal: built.giftTotal,
      shippingFee: shippingFee ?? 0,
      discount: discount ?? 0,
      charges: charges || [],
    });

    const orderStatus = STATUSES.includes(status) ? status : "confirmed";
    const payStatus =
      paymentStatus || (paymentMethod === "online" ? "awaiting_transfer" : "pending");

    const order = await Order.create({
      orderNumber: makeOrderNumber(),
      guest: true,
      items: built.lineDocs,
      shipping: {
        name: shipping.name.trim(),
        email: (shipping.email || "").trim().toLowerCase(),
        phone: shipping.phone.trim(),
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        postalCode: (shipping.postalCode || "").trim(),
      },
      paymentMethod,
      paymentStatus: payStatus,
      transactionId: String(transactionId || "").trim().slice(0, 120),
      paymentProof: String(paymentProof || "").trim().slice(0, 500),
      status: orderStatus,
      subtotal: built.subtotal,
      ...totals,
      couponCode: String(couponCode || "").trim().toUpperCase(),
      currency: "PKR",
      notes: notes || "",
      estimatedDelivery: estimatedDelivery || estimatedDeliveryLabel(4),
      statusHistory: [{ status: orderStatus, note: "Created by admin" }],
      isRead: true,
      readAt: new Date(),
    });

    res.status(201).json({ order });
  }),
);

router.patch(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const {
      status,
      paymentStatus,
      paymentMethod,
      notes,
      isRead,
      shipping,
      items,
      shippingFee,
      discount,
      couponCode,
      charges,
      transactionId,
      paymentProof,
      estimatedDelivery,
      statusNote,
      adjustStock = false,
    } = req.body;

    if (shipping && typeof shipping === "object") {
      order.shipping = {
        name: (shipping.name ?? order.shipping.name ?? "").trim(),
        email: (shipping.email ?? order.shipping.email ?? "").trim().toLowerCase(),
        phone: (shipping.phone ?? order.shipping.phone ?? "").trim(),
        address: (shipping.address ?? order.shipping.address ?? "").trim(),
        city: (shipping.city ?? order.shipping.city ?? "").trim(),
        postalCode: (shipping.postalCode ?? order.shipping.postalCode ?? "").trim(),
      };
      if (!order.shipping.name) return res.status(400).json({ message: "Customer name is required" });
      if (!order.shipping.phone) return res.status(400).json({ message: "Phone is required" });
      if (!order.shipping.address) return res.status(400).json({ message: "Address is required" });
      if (!order.shipping.city) return res.status(400).json({ message: "City is required" });
    }

    if (Array.isArray(items)) {
      let built;
      try {
        built = await buildAdminLineItems(items, {
          adjustStock: Boolean(adjustStock),
          restoreFrom: adjustStock ? order.items : [],
        });
      } catch (err) {
        return res.status(err.status || 400).json({ message: err.message });
      }
      order.items = built.lineDocs;
      order.subtotal = built.subtotal;
      const totals = computeOrderTotals({
        subtotal: built.subtotal,
        giftTotal: built.giftTotal,
        shippingFee: shippingFee !== undefined ? shippingFee : order.shippingFee,
        discount: discount !== undefined ? discount : order.discount,
        charges: charges !== undefined ? charges : order.charges,
      });
      Object.assign(order, totals);
    } else if (
      shippingFee !== undefined ||
      discount !== undefined ||
      charges !== undefined
    ) {
      const totals = computeOrderTotals({
        subtotal: order.subtotal,
        giftTotal: order.giftTotal,
        shippingFee: shippingFee !== undefined ? shippingFee : order.shippingFee,
        discount: discount !== undefined ? discount : order.discount,
        charges: charges !== undefined ? charges : order.charges,
      });
      Object.assign(order, totals);
    }

    if (couponCode !== undefined) order.couponCode = String(couponCode || "").trim().toUpperCase();
    if (transactionId !== undefined) order.transactionId = String(transactionId || "").trim().slice(0, 120);
    if (paymentProof !== undefined) order.paymentProof = String(paymentProof || "").trim().slice(0, 500);
    if (estimatedDelivery !== undefined) order.estimatedDelivery = String(estimatedDelivery || "");
    if (paymentMethod && ["cod", "online"].includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
    }
    if (paymentStatus && PAY_STATUSES.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }
    if (status && STATUSES.includes(status) && status !== order.status) {
      // Restore stock when cancelling an active order.
      if (status === "cancelled" && order.status !== "cancelled" && adjustStock !== false) {
        for (const line of order.items) {
          if (!line.product || !line.qty) continue;
          const p = await Product.findById(line.product);
          if (!p) continue;
          p.stock = Math.max(0, Number(p.stock || 0) + Number(line.qty || 0));
          p.soldCount = Math.max(0, Number(p.soldCount || 0) - Number(line.qty || 0));
          p.inStock = p.stock > 0;
          await p.save();
        }
      }
      order.status = status;
      order.statusHistory.push({ status, note: statusNote || "Updated by admin" });
    }
    if (notes !== undefined) order.notes = notes;
    if (isRead !== undefined) {
      order.isRead = Boolean(isRead);
      if (order.isRead) order.readAt = new Date();
    }

    await order.save();
    res.json({ order });
  }),
);

router.delete(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const restoreStock = req.query.restoreStock !== "false" && order.status !== "cancelled";
    if (restoreStock) {
      for (const line of order.items) {
        if (!line.product || !line.qty) continue;
        const p = await Product.findById(line.product);
        if (!p) continue;
        p.stock = Math.max(0, Number(p.stock || 0) + Number(line.qty || 0));
        p.soldCount = Math.max(0, Number(p.soldCount || 0) - Number(line.qty || 0));
        p.inStock = p.stock > 0;
        await p.save();
      }
    }

    await order.deleteOne();
    res.json({ message: "Order deleted" });
  }),
);

export default router;
