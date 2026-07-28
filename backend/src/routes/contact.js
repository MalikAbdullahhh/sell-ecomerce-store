import { Router } from "express";
import ContactInquiry from "../models/ContactInquiry.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

function normalizeEmail(raw) {
  return String(raw || "")
    .toLowerCase()
    .trim();
}

function normalizePhone(raw) {
  return String(raw || "").trim();
}

function hasValidEmail(email) {
  return Boolean(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

/** Public: submit contact form */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const orderNumber = String(req.body.orderNumber || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!message) return res.status(400).json({ message: "Message is required" });

    const emailOk = hasValidEmail(email);
    const phoneOk = hasValidPhone(phone);
    if (!emailOk && !phoneOk) {
      return res.status(400).json({
        message: "Provide a valid email or phone number (at least one is required)",
      });
    }
    if (email && !emailOk) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (phone && !phoneOk) {
      return res.status(400).json({ message: "Enter a valid phone number" });
    }

    const inquiry = await ContactInquiry.create({
      name,
      email: emailOk ? email : "",
      phone: phoneOk ? phone : "",
      orderNumber,
      message,
      status: "new",
    });

    res.status(201).json({ message: "Message received", inquiry });
  }),
);

/** Admin: list inquiries */
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || "").trim();
    const filter = {};
    if (status && ["new", "read", "replied", "archived"].includes(status)) {
      filter.status = status;
    }
    const inquiries = await ContactInquiry.find(filter).sort({ createdAt: -1 });
    const unreadCount = await ContactInquiry.countDocuments({ status: "new" });
    res.json({ inquiries, unreadCount });
  }),
);

/** Admin: unread count for nav badge */
router.get(
  "/unread-count",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const count = await ContactInquiry.countDocuments({ status: "new" });
    res.json({ count });
  }),
);

/** Admin: update status / note */
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    if (req.body.status !== undefined) {
      const status = String(req.body.status);
      if (!["new", "read", "replied", "archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      inquiry.status = status;
    }
    if (req.body.adminNote !== undefined) {
      inquiry.adminNote = String(req.body.adminNote || "");
    }
    await inquiry.save();
    res.json({ inquiry });
  }),
);

/** Admin: delete */
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json({ message: "Deleted" });
  }),
);

export default router;
