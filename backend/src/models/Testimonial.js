import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    handle: { type: String, default: "" },
    email: { type: String, default: "" },
    role: { type: String, default: "" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    quote: { type: String, required: true },
    image: { type: String, default: "" },
    platform: {
      type: String,
      enum: ["instagram", "facebook", "twitter", "x", "other"],
      default: "instagram",
    },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    layout: { type: String, enum: ["meta-top", "meta-bottom"], default: "meta-bottom" },
    dateAdded: { type: Date, default: Date.now },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    row: { type: Number, enum: [1, 2], default: 1 },
  },
  { timestamps: true },
);

export default mongoose.model("Testimonial", testimonialSchema);
