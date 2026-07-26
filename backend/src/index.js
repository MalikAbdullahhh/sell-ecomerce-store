import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { uploadsDir } from "./middleware/upload.js";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/focus-frame-store");

const allowed = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
].filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin) || process.env.NODE_ENV !== "production") {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "aperture-api", currency: "PKR" });
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

app.listen(PORT, () => {
  console.log(`Aperture API listening on http://localhost:${PORT}`);
});
