import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true, trim: true },
    authorImage: { type: String, default: "" },
    email: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    images: [{ type: String }],
    videos: [{ type: String }],
    isApproved: { type: Boolean, default: true },
    createdByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Review", reviewSchema);
