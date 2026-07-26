import mongoose from "mongoose";

/**
 * Page-wise CMS — homepage, about, FAQ, etc. Editable field-by-field from admin.
 */
const pageBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "html", "image", "video", "list", "json"],
      default: "text",
    },
    label: { type: String, default: "" },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { _id: false },
);

const pageContentSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "home",
        "about",
        "contact",
        "faq",
        "shop",
        "checkout",
        "footer",
        "header",
        "legal-privacy",
        "legal-terms",
        "legal-shipping",
        "legal-returns",
      ],
    },
    title: { type: String, default: "" },
    blocks: [pageBlockSchema],
    // Section-keyed content driven by the shared front-end page schema, e.g.
    // { hero: { title, image, … }, valueStrip: { items: [...] } }.
    sections: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("PageContent", pageContentSchema);
