import { Router } from "express";
import path from "path";
import { requireAdmin, requireUser } from "../middleware/auth.js";
import { upload, uploadsDir } from "../middleware/upload.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

router.post(
  "/",
  requireAdmin,
  upload.array("files", 20),
  asyncHandler(async (req, res) => {
    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      absoluteUrl: `${req.protocol}://${req.get("host")}/uploads/${f.filename}`,
      mimetype: f.mimetype,
      size: f.size,
      originalName: f.originalname,
    }));
    res.status(201).json({ files });
  }),
);

router.post(
  "/single",
  requireAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const f = req.file;
    res.status(201).json({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      absoluteUrl: `${req.protocol}://${req.get("host")}/uploads/${f.filename}`,
      mimetype: f.mimetype,
      size: f.size,
    });
  }),
);

/** Public review media upload (images/videos on product reviews) */
router.post(
  "/review",
  upload.array("files", 8),
  asyncHandler(async (req, res) => {
    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      absoluteUrl: `${req.protocol}://${req.get("host")}/uploads/${f.filename}`,
      mimetype: f.mimetype,
    }));
    res.status(201).json({ files });
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
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({
      filename: req.file.filename,
      url,
      absoluteUrl: `${req.protocol}://${req.get("host")}${url}`,
    });
  }),
);

router.post(
  "/avatar",
  requireUser,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    req.user.avatar = url;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON(), url });
  }),
);

export default router;
export { uploadsDir, path };
