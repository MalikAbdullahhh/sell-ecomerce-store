import { Router } from "express";
import SiteSettings from "../models/SiteSettings.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

async function getSettings() {
  let s = await SiteSettings.findOne({ key: "main" });
  if (!s) s = await SiteSettings.create({ key: "main" });
  if (!Array.isArray(s.discountCodes)) s.discountCodes = [];
  if (!Array.isArray(s.extraCharges)) s.extraCharges = [];
  return s;
}

router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const { code, subtotal } = req.body || {};
    const normalizedCode = String(code || "").trim().toUpperCase();
    const baseSubtotal = Math.max(0, Number(subtotal) || 0);

    if (!normalizedCode) return res.status(400).json({ message: "Discount code is required" });

    const settings = await getSettings();
    const coupon = (settings.discountCodes || []).find(
      (c) =>
        String(c.code || "").trim().toUpperCase() === normalizedCode &&
        c.enabled !== false,
    );

    if (!coupon) return res.status(400).json({ message: "Invalid discount code" });

    const maxUses = Number(coupon.maxUses) || 0;
    const usedUses = Number(coupon.usedUses) || 0;
    const remainingUses = maxUses - usedUses;
    if (remainingUses <= 0) return res.status(400).json({ message: "Discount code exhausted" });

    let discountAmount = 0;
    if (baseSubtotal > 0) {
      const value = Number(coupon.value) || 0;
      if (value > 0) {
        discountAmount =
          coupon.type === "percent"
            ? Math.round((baseSubtotal * value) / 100)
            : Math.round(value);
        discountAmount = Math.max(0, Math.min(baseSubtotal, discountAmount));
      }
    }

    return res.json({
      valid: true,
      code: normalizedCode,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      discountedSubtotal: baseSubtotal - discountAmount,
      maxUses,
      usedUses,
      remainingUses,
    });
  }),
);

export default router;

