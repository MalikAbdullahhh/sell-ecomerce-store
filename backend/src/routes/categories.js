import { Router } from "express";
import slugify from "slugify";
import Category from "../models/Category.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ categories });
  }),
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ categories });
  }),
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    const slug = (req.body.slug || slugify(name, { lower: true, strict: true })).toLowerCase();
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(409).json({ message: "Slug already exists" });
    const category = await Category.create({
      name,
      slug,
      blurb: req.body.blurb || "",
      image: req.body.image || "",
      sortOrder: req.body.sortOrder ?? 0,
      isActive: req.body.isActive !== false,
    });
    res.status(201).json({ category });
  }),
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ category });
  }),
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Deleted" });
  }),
);

export default router;
