import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, default: "Process" },
    readTime: { type: String, default: "5 min" },
    date: { type: Date, default: Date.now },
    image: { type: String, default: "" },
    images: [{ type: String }],
    excerpt: { type: String, default: "" },
    /** Rich HTML from admin editor */
    contentHtml: { type: String, default: "" },
    /** Legacy / plain paragraphs */
    body: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true },
);

export default mongoose.model("Journal", journalSchema);
