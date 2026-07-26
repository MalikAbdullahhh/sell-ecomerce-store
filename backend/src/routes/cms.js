import { Router } from "express";
import SiteSettings from "../models/SiteSettings.js";
import PageContent from "../models/PageContent.js";
import Faq from "../models/Faq.js";
import Testimonial from "../models/Testimonial.js";
import LegalDocument from "../models/LegalDocument.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

async function ensureSettings() {
  let s = await SiteSettings.findOne({ key: "main" });
  if (!s) s = await SiteSettings.create({ key: "main" });
  // Migrate older documents that predate extraCharges.
  if (!Array.isArray(s.extraCharges)) {
    s.extraCharges = [];
    await s.save();
  }
  return s;
}

router.get(
  "/site",
  asyncHandler(async (_req, res) => {
    const settings = await ensureSettings();
    const doc = settings.toObject();
    if (!Array.isArray(doc.extraCharges)) {
      doc.extraCharges = [];
    }
    res.json({ settings: doc });
  }),
);

router.put(
  "/site",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const settings = await ensureSettings();
    const allowed = [
      "brandName",
      "tagline",
      "announcement",
      "announcementEmojis",
      "announcementSpeed",
      "contact",
      "social",
      "payment",
      "shipping",
      "help",
      "newsletter",
      "testimonialsSection",
      "extraCharges",
      "instagramShots",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === "object" && !Array.isArray(req.body[key])) {
          settings[key] = {
            ...(settings[key]?.toObject?.() || settings[key] || {}),
            ...req.body[key],
          };
        } else {
          settings[key] = req.body[key];
        }
      }
    }
    await settings.save();
    res.json({ settings });
  }),
);

router.get(
  "/pages",
  asyncHandler(async (_req, res) => {
    const pages = await PageContent.find({ isPublished: true });
    res.json({ pages });
  }),
);

router.get(
  "/pages/:page",
  asyncHandler(async (req, res) => {
    const page = await PageContent.findOne({ page: req.params.page });
    // An unedited page is a valid state: the storefront falls back to defaults.
    if (!page) {
      return res.json({ page: { page: req.params.page, title: "", blocks: [], sections: {} } });
    }
    res.json({ page });
  }),
);

router.put(
  "/pages/:page",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const update = {
      page: req.params.page,
      title: req.body.title ?? "",
      isPublished: req.body.isPublished !== false,
    };
    if (req.body.blocks !== undefined) update.blocks = req.body.blocks;
    if (req.body.sections !== undefined) update.sections = req.body.sections;

    const page = await PageContent.findOneAndUpdate({ page: req.params.page }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json({ page });
  }),
);

router.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    const faqs = await Faq.find({ isActive: true }).sort({ sortOrder: 1 });
    const grouped = {};
    for (const f of faqs) {
      if (!grouped[f.group]) grouped[f.group] = [];
      grouped[f.group].push({ q: f.question, a: f.answer, id: f._id });
    }
    res.json({
      faqs: Object.entries(grouped).map(([group, items]) => ({ group, items })),
      flat: faqs,
    });
  }),
);

router.get(
  "/faqs/admin",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const faqs = await Faq.find().sort({ sortOrder: 1 });
    res.json({ faqs });
  }),
);

router.post(
  "/faqs",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const faq = await Faq.create(req.body);
    res.status(201).json({ faq });
  }),
);

router.put(
  "/faqs/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return res.status(404).json({ message: "Not found" });
    res.json({ faq });
  }),
);

router.delete(
  "/faqs/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  }),
);

// Admin list MUST be registered before any /testimonials/:param routes.
router.get(
  "/testimonials/admin",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const testimonials = await Testimonial.find().sort({ sortOrder: 1, dateAdded: -1 });
    res.json({ testimonials });
  }),
);

router.get(
  "/testimonials",
  asyncHandler(async (_req, res) => {
    const testimonials = await Testimonial.find({ isActive: true }).sort({
      sortOrder: 1,
      dateAdded: -1,
    });
    res.json({ testimonials });
  }),
);

router.post(
  "/testimonials",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const t = await Testimonial.create(req.body);
    res.status(201).json({ testimonial: t });
  }),
);

router.put(
  "/testimonials/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json({ testimonial: t });
  }),
);

router.delete(
  "/testimonials/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  }),
);

const DEFAULT_LEGAL = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What Aperture collects, why it is collected, and how long it is kept.",
    sortOrder: 1,
    contentHtml: `<h2>What we collect</h2><p>We collect the name, email address, delivery address and phone number you provide at checkout, plus the order contents and payment status returned by our processor.</p><h2>Why we collect it</h2><p>To fulfil and deliver orders, handle returns and warranty claims, and meet accounting obligations.</p><h2>Your rights</h2><p>You may request a copy, correction or deletion of your data at support@aperture.tech.</p>`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The agreement covering purchases made through the Aperture store.",
    sortOrder: 2,
    contentHtml: `<h2>Orders</h2><p>An order is an offer to buy. The contract forms when we send the dispatch confirmation.</p><h2>Pricing</h2><p>Prices are in PKR and include applicable taxes unless stated otherwise.</p><h2>Warranty</h2><p>Products carry a one-year warranty covering defects in materials and workmanship.</p>`,
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    summary: "Delivery windows, costs, and Cash on Delivery rules.",
    sortOrder: 3,
    contentHtml: `<h2>Delivery</h2><p>Standard delivery is 2–4 business days domestically. Shipping is free above the store threshold.</p><h2>Cash on Delivery</h2><p>COD is available on eligible domestic orders.</p>`,
  },
  {
    slug: "returns",
    title: "Returns & Refunds",
    summary: "How the 30-day return window and refunds work.",
    sortOrder: 4,
    contentHtml: `<h2>Returns</h2><p>You have 30 days from delivery to return an unused product in original packaging.</p><h2>Refunds</h2><p>Refunds are issued to the original payment method within three business days of warehouse scan.</p>`,
  },
];

async function ensureLegalDocs() {
  const count = await LegalDocument.countDocuments();
  if (count === 0) {
    await LegalDocument.insertMany(DEFAULT_LEGAL);
  }
  return LegalDocument.find().sort({ sortOrder: 1, title: 1 });
}

router.get(
  "/legal",
  asyncHandler(async (_req, res) => {
    const docs = await ensureLegalDocs();
    res.json({
      docs: docs
        .filter((d) => d.isPublished)
        .map((d) => ({
          slug: d.slug,
          title: d.title,
          summary: d.summary,
          updated: d.updatedAt,
        })),
    });
  }),
);

router.get(
  "/legal/admin",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const docs = await ensureLegalDocs();
    res.json({ docs });
  }),
);

router.get(
  "/legal/:slug",
  asyncHandler(async (req, res) => {
    await ensureLegalDocs();
    const doc = await LegalDocument.findOne({ slug: req.params.slug, isPublished: true });
    if (!doc) return res.status(404).json({ message: "Policy not found" });
    res.json({ doc });
  }),
);

router.put(
  "/legal/:slug",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const slug = req.params.slug.toLowerCase().trim();
    const doc = await LegalDocument.findOneAndUpdate(
      { slug },
      {
        slug,
        title: req.body.title ?? slug,
        summary: req.body.summary ?? "",
        contentHtml: req.body.contentHtml ?? "",
        sortOrder: Number(req.body.sortOrder) || 0,
        isPublished: req.body.isPublished !== false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ doc });
  }),
);

router.post(
  "/legal",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const slug = String(req.body.slug || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-");
    if (!slug || !req.body.title) {
      return res.status(400).json({ message: "Slug and title are required" });
    }
    const exists = await LegalDocument.findOne({ slug });
    if (exists) return res.status(409).json({ message: "A policy with this slug already exists" });
    const doc = await LegalDocument.create({
      slug,
      title: req.body.title,
      summary: req.body.summary || "",
      contentHtml: req.body.contentHtml || "",
      sortOrder: Number(req.body.sortOrder) || 0,
      isPublished: req.body.isPublished !== false,
    });
    res.status(201).json({ doc });
  }),
);

router.delete(
  "/legal/:slug",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await LegalDocument.findOneAndDelete({ slug: req.params.slug });
    res.json({ message: "Deleted" });
  }),
);

export default router;
