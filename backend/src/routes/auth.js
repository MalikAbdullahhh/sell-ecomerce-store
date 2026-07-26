import { Router } from "express";
import slugify from "slugify";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { signUserToken, signAdminToken, requireUser, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
}

/** User register */
router.post(
  "/register",
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  asyncHandler(async (req, res) => {
    if (!validate(req, res)) return;
    const email = req.body.email.toLowerCase().trim();
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      name: req.body.name.trim(),
      email,
      password: req.body.password,
      phone: req.body.phone || "",
    });

    const token = signUserToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  }),
);

/** User login */
router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  asyncHandler(async (req, res) => {
    if (!validate(req, res)) return;
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });
    const token = signUserToken(user);
    res.json({ token, user: user.toSafeJSON() });
  }),
);

router.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
  }),
);

router.patch(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const { name, phone, avatar, addresses } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) {
      if (phone && phone.replace(/\D/g, "").length < 11) {
        return res.status(400).json({ message: "Phone must be at least 11 digits" });
      }
      req.user.phone = phone;
    }
    if (avatar !== undefined) req.user.avatar = avatar;
    if (addresses !== undefined) {
      for (const a of addresses) {
        if (a.address && a.address.trim().length < 10) {
          return res.status(400).json({ message: "Address must be at least 10 characters" });
        }
        if (a.phone && a.phone.replace(/\D/g, "").length < 11) {
          return res.status(400).json({ message: "Phone must be at least 11 digits" });
        }
      }
      req.user.addresses = addresses;
    }
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  }),
);

router.post(
  "/me/password",
  requireUser,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Current password and new password (6+) are required" });
    }
    const user = await User.findById(req.user._id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated" });
  }),
);

/** Admin login */
router.post(
  "/admin/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  asyncHandler(async (req, res) => {
    if (!validate(req, res)) return;
    const admin = await Admin.findOne({ email: req.body.email.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(req.body.password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    if (!admin.isActive) return res.status(403).json({ message: "Admin account disabled" });
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = signAdminToken(admin);
    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  }),
);

router.get(
  "/admin/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  }),
);

export default router;
export { slugify };
