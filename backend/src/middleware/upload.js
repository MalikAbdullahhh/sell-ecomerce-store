import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";
import {
  cloudinaryEnabled,
  cloudinaryFolder,
  uploadBufferToCloudinary,
} from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/** Local disk fallback when Cloudinary credentials are missing. */
export const uploadsDir = isServerless
  ? path.join(os.tmpdir(), "aperture-uploads")
  : path.join(__dirname, "..", "uploads");

if (!cloudinaryEnabled && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/**
 * Memory storage for Cloudinary (buffer → upload_stream).
 * Disk storage for local/dev fallback.
 */
const storage = cloudinaryEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
      },
    });

export const upload = multer({
  storage,
  limits: {
    // 0 or unset = no per-file size cap (admin may upload large product videos).
    ...(Number(process.env.UPLOAD_MAX_MB) > 0
      ? { fileSize: Number(process.env.UPLOAD_MAX_MB) * 1024 * 1024 }
      : {}),
    files: 100,
  },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

export const storageProvider = cloudinaryEnabled ? "cloudinary" : "local";

function localPublicUrl(req, filename) {
  return `/uploads/${filename}`;
}

function localAbsoluteUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

/**
 * Persist one Multer file and return a stable public URL payload.
 * Prefer Cloudinary when configured; otherwise write under /uploads.
 *
 * @param {Express.Multer.File} file
 * @param {import('express').Request} req
 * @param {{ folder?: string }} [opts]
 */
export async function persistFile(file, req, opts = {}) {
  if (!file) throw new Error("No file provided");

  if (cloudinaryEnabled) {
    const folder = cloudinaryFolder(opts.folder || "uploads");
    const result = await uploadBufferToCloudinary(file, { folder });
    return {
      filename: result.public_id,
      publicId: result.public_id,
      url: result.secure_url,
      absoluteUrl: result.secure_url,
      mimetype: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      resourceType: result.resource_type,
      provider: "cloudinary",
      width: result.width,
      height: result.height,
    };
  }

  // Local disk: multer already wrote the file
  const filename = file.filename;
  return {
    filename,
    publicId: filename,
    url: localPublicUrl(req, filename),
    absoluteUrl: localAbsoluteUrl(req, filename),
    mimetype: file.mimetype,
    size: file.size,
    originalName: file.originalname,
    resourceType: String(file.mimetype || "").startsWith("video/") ? "video" : "image",
    provider: "local",
  };
}

/** Persist many files; returns array in the same order. */
export async function persistFiles(files, req, opts = {}) {
  const list = Array.isArray(files) ? files : [];
  return Promise.all(list.map((f) => persistFile(f, req, opts)));
}

/** Just the public URL string — useful for reviews/avatars. */
export async function persistFileUrl(file, req, opts = {}) {
  const saved = await persistFile(file, req, opts);
  return saved.url;
}

export function fileUrl(req, filename) {
  if (!filename) return "";
  if (/^https?:\/\//i.test(filename)) return filename;
  if (filename.startsWith("/uploads/")) return filename;
  return localPublicUrl(req, filename);
}
