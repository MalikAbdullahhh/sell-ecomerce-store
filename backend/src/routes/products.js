import { Router } from "express";
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

function collectCategorySlugs(obj) {
  const slugs = [];
  const push = (s) => {
    const v = String(s || "").trim();
    if (v && !slugs.includes(v)) slugs.push(v);
  };

  if (Array.isArray(obj.categorySlugs)) obj.categorySlugs.forEach(push);
  if (Array.isArray(obj.categories)) {
    for (const c of obj.categories) {
      if (c && typeof c === "object" && c.slug) push(c.slug);
    }
  }
  if (obj.categorySlug) push(obj.categorySlug);
  if (obj.category && typeof obj.category === "object" && obj.category.slug) {
    push(obj.category.slug);
  } else if (typeof obj.category === "string") {
    push(obj.category);
  }
  return slugs;
}

function mapProduct(p) {
  const obj = p.toObject ? p.toObject() : p;
  const categorySlugs = collectCategorySlugs(obj);
  const primary = categorySlugs[0] || obj.categorySlug || "";
  return {
    ...obj,
    id: obj._id,
    category: primary,
    categorySlug: primary,
    categories: categorySlugs,
    categorySlugs,
  };
}

const categoryPopulate = [
  { path: "category", select: "name slug" },
  { path: "categories", select: "name slug" },
];

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      category,
      brand,
      q,
      flag,
      minPrice,
      maxPrice,
      inStock,
      sort = "newest",
      page = 1,
      limit = 48,
    } = req.query;

    const filter = { isActive: true };
    if (category) {
      filter.$or = [{ categorySlug: category }, { categorySlugs: category }];
    }
    if (brand) filter.brand = brand;
    if (flag) filter.flags = flag;
    if (inStock === "true") filter.inStock = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: String(q) };

    let sortSpec = { createdAt: -1 };
    if (sort === "price-asc") sortSpec = { price: 1 };
    if (sort === "price-desc") sortSpec = { price: -1 };
    if (sort === "rating") sortSpec = { rating: -1 };
    if (sort === "name") sortSpec = { name: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(Number(limit))
        .populate(categoryPopulate),
      Product.countDocuments(filter),
    ]);

    res.json({
      products: items.map(mapProduct),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  }),
);

router.get(
  "/slug/:slug",
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
      categoryPopulate,
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    const reviews = await Review.find({ product: product._id, isApproved: true }).sort({
      createdAt: -1,
    });
    res.json({
      product: {
        ...mapProduct(product),
        reviews: reviews.map((r) => ({
          id: r._id,
          userId: r.user ? String(r.user) : null,
          author: r.author,
          authorImage: r.authorImage,
          rating: r.rating,
          date: r.createdAt.toISOString().slice(0, 10),
          title: r.title,
          body: r.body,
          images: r.images,
          videos: r.videos,
        })),
      },
    });
  }),
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const products = await Product.find().sort({ createdAt: -1 }).populate(categoryPopulate);
    res.json({ products: products.map(mapProduct) });
  }),
);

router.get(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(categoryPopulate);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product: mapProduct(product) });
  }),
);

async function resolveOneCategory(key) {
  if (!key) return null;
  const raw = String(key).trim();
  if (!raw) return null;
  return (
    (await Category.findOne({ slug: raw })) ||
    (await Category.findOne({ name: raw })) ||
    (await Category.findById(raw).catch(() => null))
  );
}

/** Accepts categories[], categoryIds[], category, or categoryId. Returns unique Category docs (order preserved). */
async function resolveCategories(body) {
  const keys = [];
  const push = (v) => {
    if (v == null || v === "") return;
    const s = String(v).trim();
    if (s && !keys.includes(s)) keys.push(s);
  };

  if (Array.isArray(body.categories)) body.categories.forEach(push);
  if (Array.isArray(body.categoryIds)) body.categoryIds.forEach(push);
  if (Array.isArray(body.categorySlugs)) body.categorySlugs.forEach(push);
  push(body.categoryId);
  push(body.category);

  const docs = [];
  for (const key of keys) {
    const doc = await resolveOneCategory(key);
    if (doc && !docs.some((d) => String(d._id) === String(doc._id))) docs.push(doc);
  }
  return docs;
}

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (req.body.price === undefined) return res.status(400).json({ message: "Price is required" });

    const categoryDocs = await resolveCategories(req.body);
    if (!categoryDocs.length) return res.status(400).json({ message: "Select at least one category" });

    const slug = (req.body.slug || slugify(name, { lower: true, strict: true })).toLowerCase();
    if (await Product.findOne({ slug })) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const primary = categoryDocs[0];
    const product = await Product.create({
      ...req.body,
      name,
      slug,
      category: primary._id,
      categorySlug: primary.slug,
      categories: categoryDocs.map((c) => c._id),
      categorySlugs: categoryDocs.map((c) => c.slug),
      price: Number(req.body.price),
      compareAt: req.body.compareAt != null ? Number(req.body.compareAt) : undefined,
      saleDiscountPercent: Number(req.body.saleDiscountPercent) || 0,
      stock: Number(req.body.stock) || 0,
      inStock: req.body.inStock !== false && (Number(req.body.stock) || 0) > 0,
      images: req.body.images || [],
      videos: req.body.videos || [],
      specs: req.body.specs || [],
      colors: req.body.colors || [],
      sizes: req.body.sizes || [],
      variants: req.body.variants || [],
      flags: req.body.flags || [],
    });

    await product.populate(categoryPopulate);
    res.status(201).json({ product: mapProduct(product) });
  }),
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    const hasCategoryInput =
      updates.categoryId ||
      updates.category ||
      updates.categories ||
      updates.categoryIds ||
      updates.categorySlugs;

    if (hasCategoryInput) {
      const categoryDocs = await resolveCategories(updates);
      if (!categoryDocs.length) {
        return res.status(400).json({ message: "Select at least one category" });
      }
      const primary = categoryDocs[0];
      updates.category = primary._id;
      updates.categorySlug = primary.slug;
      updates.categories = categoryDocs.map((c) => c._id);
      updates.categorySlugs = categoryDocs.map((c) => c.slug);
    }
    delete updates.categoryId;
    delete updates.categoryIds;

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock) || 0;
      // Quantity drives availability: restocking removes sold-out on the site.
      updates.inStock = updates.stock > 0;
    } else if (updates.inStock !== undefined) {
      updates.inStock = Boolean(updates.inStock);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate(categoryPopulate);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product: mapProduct(product) });
  }),
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await Review.deleteMany({ product: product._id });
    res.json({ message: "Deleted" });
  }),
);

export default router;
