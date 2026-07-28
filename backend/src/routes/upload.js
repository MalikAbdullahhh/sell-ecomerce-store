import { Router } from "express";
import { requireAdmin, requireUser } from "../middleware/auth.js";
import { persistFile, persistFiles, storageProvider, upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

router.post(
  "/",
  requireAdmin,
  upload.array("files", 100),
  asyncHandler(async (req, res) => {
    const files = await persistFiles(req.files || [], req, { folder: "media" });
    res.status(201).json({ files, provider: storageProvider });
  }),
);

router.post(
  "/single",
  requireAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const saved = await persistFile(req.file, req, { folder: "media" });
    res.status(201).json({ ...saved, provider: storageProvider });
  }),
);

/** Public review media upload (images/videos on product reviews) */
router.post(
  "/review",
  upload.array("files", 8),
  asyncHandler(async (req, res) => {
    const files = await persistFiles(req.files || [], req, { folder: "reviews" });
    res.status(201).json({ files, provider: storageProvider });
  }),
);

/** Optional payment proof image for online transfers (checkout) */
router.post(
  "/payment-proof",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!String(req.file.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ message: "Payment proof must be an image" });
    }
    const saved = await persistFile(req.file, req, { folder: "payment-proofs" });
    res.status(201).json({
      filename: saved.filename,
      url: saved.url,
      absoluteUrl: saved.absoluteUrl,
      provider: storageProvider,
    });
  }),
);

router.post(
  "/avatar",
  requireUser,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const saved = await persistFile(req.file, req, { folder: "avatars" });
    req.user.avatar = saved.url;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON(), url: saved.url, provider: storageProvider });
  }),
);

export default router;
