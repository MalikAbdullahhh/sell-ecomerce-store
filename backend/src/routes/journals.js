import { Router } from "express";
import slugify from "slugify";
import Journal from "../models/Journal.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const posts = await Journal.find({ isPublished: true }).sort({ date: -1 });
    res.json({ posts });
  }),
);

router.get(
  "/slug/:slug",
  asyncHandler(async (req, res) => {
    const post = await Journal.findOne({ slug: req.params.slug, isPublished: true });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ post });
  }),
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const posts = await Journal.find().sort({ date: -1 });
    res.json({ posts });
  }),
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: "Title is required" });
    const slug = (req.body.slug || slugify(title, { lower: true, strict: true })).toLowerCase();
    if (await Journal.findOne({ slug })) {
      return res.status(409).json({ message: "Slug already exists" });
    }
    const post = await Journal.create({ ...req.body, title, slug });
    res.status(201).json({ post });
  }),
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const post = await Journal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ post });
  }),
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const post = await Journal.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Deleted" });
  }),
);

export default router;
