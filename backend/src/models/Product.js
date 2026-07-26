import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ["color", "size", "material", "other"], default: "color" },
    value: { type: String, default: "" },
    image: { type: String, default: "" },
    sku: { type: String, default: "" },
    priceDelta: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, default: "APERTURE" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    categorySlug: { type: String, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAt: { type: Number },
    saleDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: "PKR" },
    short: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    videos: [{ type: String }],
    specs: [specSchema],
    colors: [variantSchema],
    sizes: [variantSchema],
    variants: [variantSchema],
    stock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    inStock: { type: Boolean, default: true },
    flags: [{ type: String, enum: ["new", "hot", "sale"] }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    /** When true, admin-set rating/reviewCount are not overwritten by live reviews */
    ratingLocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true },
);

productSchema.index({ name: "text", short: "text", description: "text", brand: "text" });

export default mongoose.model("Product", productSchema);
