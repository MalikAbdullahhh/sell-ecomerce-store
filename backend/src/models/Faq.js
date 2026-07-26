import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    group: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Faq", faqSchema);
