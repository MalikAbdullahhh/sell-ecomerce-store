import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    slug: String,
    name: String,
    image: String,
    color: String,
    size: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    gift: { type: Boolean, default: false },
    giftFee: { type: Number, default: 0 },
    giftMessage: { type: String, default: "" },
  },
  { _id: false },
);

const shippingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guest: { type: Boolean, default: true },
    items: [orderItemSchema],
    shipping: shippingSchema,
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "awaiting_transfer", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentProofNote: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    paymentProof: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    subtotal: { type: Number, required: true },
    giftTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    charges: {
      type: [
        {
          label: String,
          amount: Number,
          _id: false,
        },
      ],
      default: [],
    },
    chargesTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    notes: { type: String, default: "" },
    estimatedDelivery: String,
    statusHistory: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    emailSent: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
