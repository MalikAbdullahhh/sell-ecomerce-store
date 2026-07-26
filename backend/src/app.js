import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { cloudinaryEnabled } from "./config/cloudinary.js";
import { storageProvider, uploadsDir } from "./middleware/upload.js";
import { ensureAdminFromEnv } from "./bootstrap/ensureAdmin.js";

import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import reviewRoutes from "./routes/reviews.js";
import journalRoutes from "./routes/journals.js";
import cmsRoutes from "./routes/cms.js";
import adminRoutes from "./routes/admin.js";
import newsletterRoutes from "./routes/newsletter.js";

const app = express();

const allowed = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  ...(process.env.EXTRA_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
].filter(Boolean);

function originAllowed(origin) {
  if (!origin) return true;
  if (allowed.includes(origin)) return true;
  // Preview deployments on Vercel
  if (/\.vercel\.app$/i.test(origin)) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, cb) {
      if (originAllowed(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Local disk fallback only — Cloudinary URLs are absolute CDN links.
if (!cloudinaryEnabled) {
  app.use("/uploads", express.static(uploadsDir));
}

/** Ensure DB is ready before any API handler (important on serverless). */
let bootstrapped = false;
app.use(async (_req, _res, next) => {
  try {
    await connectDB(process.env.MONGODB_URI);
    if (!bootstrapped) {
      await ensureAdminFromEnv();
      bootstrapped = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aperture-api",
    currency: "PKR",
    storage: storageProvider,
    cloudinary: cloudinaryEnabled,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.name === "ValidationError" ? 400 : 500;
  res.status(typeof status === "number" ? status : 500).json({
    message: err.message || "Server error",
  });
});

export default app;
