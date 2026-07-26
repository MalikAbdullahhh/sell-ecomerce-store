import mongoose from "mongoose";

const legalSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    contentHtml: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("LegalDocument", legalSchema);
