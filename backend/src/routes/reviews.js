import { Router } from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { requireAdmin, optionalUser, requireUser } from "../middleware/auth.js";
import { asyncHandler, defaultReviewerName } from "../utils/helpers.js";
import { upload, persistFileUrl } from "../middleware/upload.js";

const router = Router();

/** Parse admin date (YYYY-MM-DD or ISO) without timezone day-shift. */
function parseReviewDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatReviewDate(r) {
  const d = r?.date || r?.createdAt;
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function sortReviewsByDate(reviews) {
  return [...reviews].sort((a, b) => {
    const ta = new Date(a.date || a.createdAt || 0).getTime();
    const tb = new Date(b.date || b.createdAt || 0).getTime();
    return tb - ta;
  });
}

async function recalcProductRating(productId) {
  const product = await Product.findById(productId);
  if (!product) return { rating: 0, reviewCount: 0 };
  if (product.ratingLocked) {
    return { rating: product.rating, reviewCount: product.reviewCount };
  }
  const reviews = await Review.find({ product: productId, isApproved: true });
  const reviewCount = reviews.length;
  const rating =
    reviewCount === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10;
  await Product.findByIdAndUpdate(productId, { rating, reviewCount });
  return { rating, reviewCount };
}

router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true,
    });
    res.json({ reviews: sortReviewsByDate(reviews) });
  }),
);

router.post(
  "/",
  optionalUser,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "videos", maxCount: 2 },
  ]),
  asyncHandler(async (req, res) => {
    const { productId, slug, rating, title, body, author, authorImage } = req.body;
    if (!rating || !body?.trim()) {
      return res.status(400).json({ message: "Rating and review text are required" });
    }

    let product = null;
    if (productId) product = await Product.findById(productId);
    else if (slug) product = await Product.findOne({ slug });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];
    const uploadedImages = await Promise.all(
      imageFiles.map((f) => persistFileUrl(f, req, { folder: "reviews" })),
    );
    const uploadedVideos = await Promise.all(
      videoFiles.map((f) => persistFileUrl(f, req, { folder: "reviews" })),
    );
    const images = [
      ...(Array.isArray(req.body.imageUrls) ? req.body.imageUrls : []),
      ...uploadedImages,
    ];
    const videos = [
      ...(Array.isArray(req.body.videoUrls) ? req.body.videoUrls : []),
      ...uploadedVideos,
    ];

    const name = author?.trim() || req.user?.name || defaultReviewerName();

    const review = await Review.create({
      product: product._id,
      user: req.user?._id,
      author: name,
      authorImage: authorImage || req.user?.avatar || "",
      email: req.user?.email || req.body.email || "",
      rating: Math.min(5, Math.max(1, Number(rating))),
      title: title || "",
      body: body.trim(),
      images,
      videos,
      isApproved: true,
    });

    const stats = await recalcProductRating(product._id);
    res.status(201).json({ review, ...stats });
  }),
);

/** Logged-in user: update their own review */
router.patch(
  "/mine/:id",
  requireUser,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "videos", maxCount: 2 },
  ]),
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.user || String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own review" });
    }

    if (req.body.rating !== undefined) {
      review.rating = Math.min(5, Math.max(1, Number(req.body.rating)));
    }
    if (req.body.body !== undefined) {
      if (!String(req.body.body).trim()) {
        return res.status(400).json({ message: "Review text is required" });
      }
      review.body = String(req.body.body).trim();
    }

    // Existing media URLs the client wants to keep (JSON string or array)
    let keepImages = review.images || [];
    let keepVideos = review.videos || [];
    if (req.body.keepImages !== undefined) {
      try {
        keepImages = typeof req.body.keepImages === "string"
          ? JSON.parse(req.body.keepImages)
          : req.body.keepImages;
      } catch {
        keepImages = [];
      }
    }
    if (req.body.keepVideos !== undefined) {
      try {
        keepVideos = typeof req.body.keepVideos === "string"
          ? JSON.parse(req.body.keepVideos)
          : req.body.keepVideos;
      } catch {
        keepVideos = [];
      }
    }

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];
    const uploadedImages = await Promise.all(
      imageFiles.map((f) => persistFileUrl(f, req, { folder: "reviews" })),
    );
    const uploadedVideos = await Promise.all(
      videoFiles.map((f) => persistFileUrl(f, req, { folder: "reviews" })),
    );
    review.images = [
      ...(Array.isArray(keepImages) ? keepImages : []),
      ...uploadedImages,
    ].slice(0, 6);
    review.videos = [
      ...(Array.isArray(keepVideos) ? keepVideos : []),
      ...uploadedVideos,
    ].slice(0, 2);

    // Keep author in sync with profile
    review.author = req.user.name || review.author;
    review.authorImage = req.user.avatar || review.authorImage;

    await review.save();
    const stats = await recalcProductRating(review.product);
    res.json({ review, ...stats });
  }),
);

/** Logged-in user: delete their own review */
router.delete(
  "/mine/:id",
  requireUser,
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.user || String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own review" });
    }
    const productId = review.product;
    await review.deleteOne();
    const stats = await recalcProductRating(productId);
    res.json({ message: "Deleted", ...stats });
  }),
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("product", "name slug images categorySlug categorySlugs categories");
    res.json({
      reviews: sortReviewsByDate(reviews).map((r) => {
        const obj = r.toObject ? r.toObject() : r;
        return {
          ...obj,
          date: formatReviewDate(obj),
        };
      }),
    });
  }),
);

router.post(
  "/admin",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      productId,
      author,
      authorImage,
      rating,
      title,
      body,
      images,
      videos,
      isApproved,
      date,
      createdAt,
    } = req.body;
    if (!productId || !rating || !body) {
      return res.status(400).json({ message: "productId, rating and body are required" });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviewDate = parseReviewDate(date || createdAt);
    const review = await Review.create({
      product: productId,
      author: author?.trim() || defaultReviewerName(),
      authorImage: authorImage || "",
      rating: Number(rating),
      title: title || "",
      body,
      images: images || [],
      videos: videos || [],
      isApproved: isApproved !== false,
      createdByAdmin: true,
      ...(reviewDate ? { date: reviewDate, createdAt: reviewDate } : { date: new Date() }),
    });
    // Ensure createdAt sticks (mongoose timestamps can ignore overrides on create in some versions).
    if (reviewDate) {
      await Review.collection.updateOne(
        { _id: review._id },
        { $set: { date: reviewDate, createdAt: reviewDate } },
      );
      review.date = reviewDate;
      review.createdAt = reviewDate;
    }
    const stats = await recalcProductRating(productId);
    res.status(201).json({ review, ...stats });
  }),
);

router.put(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (payload.productId) {
      payload.product = payload.productId;
      delete payload.productId;
    }
    // Prevent wiping protected flags accidentally with empty strings
    delete payload._id;
    delete payload.id;
    delete payload.__v;
    delete payload.updatedAt;

    // Admin-editable display date (also syncs createdAt for sorting).
    let reviewDate = null;
    if (payload.date !== undefined || payload.createdAt !== undefined) {
      const raw = payload.date ?? payload.createdAt;
      reviewDate = parseReviewDate(raw);
    }
    delete payload.date;
    delete payload.createdAt;

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    Object.assign(review, payload);
    if (reviewDate) {
      review.date = reviewDate;
    }
    await review.save();

    if (reviewDate) {
      // Native update — mongoose timestamps often refuse to change createdAt via save().
      await Review.collection.updateOne(
        { _id: review._id },
        { $set: { date: reviewDate, createdAt: reviewDate } },
      );
      review.date = reviewDate;
      review.createdAt = reviewDate;
    }

    await recalcProductRating(review.product);
    res.json({ review });
  }),
);

router.delete(
  "/admin/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    await recalcProductRating(review.product);
    res.json({ message: "Deleted" });
  }),
);

export default router;
