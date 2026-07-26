import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    source: { type: String, default: "website" },
  },
  { timestamps: true },
);

const newsletterCampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    sentCount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "sent", "failed"], default: "draft" },
    sentAt: Date,
  },
  { timestamps: true },
);

export const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSchema);
export const NewsletterCampaign = mongoose.model("NewsletterCampaign", newsletterCampaignSchema);
