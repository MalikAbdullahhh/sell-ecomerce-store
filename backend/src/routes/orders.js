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

    const shippingFee = subtotal === 0 || subtotal >= freeThreshold ? 0 : flatFee;

    // Admin-defined extra charges (tax, delivery surcharge, handling, …).
    // Percentage charges are computed against the goods subtotal.
    const charges = [];
    let chargesTotal = 0;
    for (const charge of settings.extraCharges || []) {
      if (!charge || charge.enabled === false || !charge.label) continue;
      const amount =
        charge.type === "percent"
          ? Math.round((subtotal * (Number(charge.value) || 0)) / 100)
          : Number(charge.value) || 0;
      if (amount <= 0) continue;
      charges.push({ label: charge.label, amount });
      chargesTotal += amount;
    }

    const total = subtotal + giftTotal + shippingFee + chargesTotal;

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

router.patch(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const { status, paymentStatus, notes, isRead } = req.body;
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({ status, note: req.body.statusNote || "" });
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;
    if (isRead !== undefined) {
      order.isRead = Boolean(isRead);
      if (order.isRead) order.readAt = new Date();
    }
    await order.save();
    res.json({ order });
  }),
);

export default router;
