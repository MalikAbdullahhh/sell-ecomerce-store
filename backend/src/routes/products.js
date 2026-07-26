import { Router } from "express";
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

function mapProduct(p) {
  const obj = p.toObject ? p.toObject() : p;
  return {
    ...obj,
    id: obj._id,
    category: obj.categorySlug || (obj.category?.slug ?? obj.category),
  };
}

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
    if (category) filter.categorySlug = category;
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
        .populate("category", "name slug"),
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
      "category",
      "name slug",
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
    const products = await Product.find().sort({ createdAt: -1 }).populate("category", "name slug");
    res.json({ products: products.map(mapProduct) });
  }),
);

router.get(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product: mapProduct(product) });
  }),
);

async function resolveCategory(body) {
  let categoryDoc = null;
  if (body.categoryId) categoryDoc = await Category.findById(body.categoryId);
  else if (body.category) {
    const key = String(body.category).trim();
    categoryDoc =
      (await Category.findOne({ slug: key })) ||
      (await Category.findOne({ name: key })) ||
      (await Category.findById(key).catch(() => null));
  }
  return categoryDoc;
}

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (req.body.price === undefined) return res.status(400).json({ message: "Price is required" });

    const categoryDoc = await resolveCategory(req.body);
    if (!categoryDoc) return res.status(400).json({ message: "Valid category is required" });

    const slug = (req.body.slug || slugify(name, { lower: true, strict: true })).toLowerCase();
    if (await Product.findOne({ slug })) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const product = await Product.create({
      ...req.body,
      name,
      slug,
      category: categoryDoc._id,
      categorySlug: categoryDoc.slug,
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

    res.status(201).json({ product: mapProduct(product) });
  }),
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    if (updates.categoryId || updates.category) {
      const categoryDoc = await resolveCategory(updates);
      if (categoryDoc) {
        updates.category = categoryDoc._id;
        updates.categorySlug = categoryDoc.slug;
      }
      delete updates.categoryId;
    }
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
    }).populate("category", "name slug");
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
