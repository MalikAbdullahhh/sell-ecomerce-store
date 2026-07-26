import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Category from "../models/Category.js";
import Journal from "../models/Journal.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

router.use(requireAdmin);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [
      ordersCount,
      usersCount,
      productsCount,
      reviewsCount,
      categoriesCount,
      journalsCount,
      revenueAgg,
      recentOrders,
      lowStock,
      statusBreakdown,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Review.countDocuments(),
      Category.countDocuments(),
      Journal.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(8),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .sort({ stock: 1 })
        .limit(8),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const weekOrders = await Order.countDocuments({ createdAt: { $gte: last7 } });
    const weekRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      stats: {
        orders: ordersCount,
        users: usersCount,
        products: productsCount,
        reviews: reviewsCount,
        categories: categoriesCount,
        journals: journalsCount,
        revenue: revenueAgg[0]?.total || 0,
        weekOrders,
        weekRevenue: weekRevenue[0]?.total || 0,
      },
      recentOrders,
      lowStock,
      statusBreakdown,
    });
  }),
);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  }),
);

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");
    const phone = String(req.body.phone || "").trim();

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      isActive: req.body.isActive !== false,
    });

    const safe = await User.findById(user._id).select("-password");
    res.status(201).json({ user: safe });
  }),
);

router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    if (req.body.email !== undefined) {
      const email = String(req.body.email).toLowerCase().trim();
      if (!email) return res.status(400).json({ message: "Email is required" });
      const clash = await User.findOne({ email, _id: { $ne: user._id } });
      if (clash) return res.status(409).json({ message: "Email already in use" });
      user.email = email;
    }
    if (req.body.phone !== undefined) user.phone = String(req.body.phone).trim();
    if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
    if (req.body.password) {
      if (String(req.body.password).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user.password = String(req.body.password);
    }

    await user.save();
    const safe = await User.findById(user._id).select("-password");
    res.json({ user: safe });
  }),
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  }),
);

export default router;
