import mongoose from "mongoose";

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    orderNumber: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
      index: true,
    },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

contactInquirySchema.index({ createdAt: -1 });

export default mongoose.model("ContactInquiry", contactInquirySchema);
