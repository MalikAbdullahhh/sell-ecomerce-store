import mongoose from "mongoose";

/**
 * Singleton site configuration — contact, socials, payment QR, shipping rules, etc.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    brandName: { type: String, default: "Genz Gadgets PK" },
    tagline: { type: String, default: "Precision Tech, Monochrome" },
    announcement: {
      type: String,
      default: "Free shipping over Rs 20,000 · Cash on Delivery available",
    },
    announcementEmojis: {
      type: [String],
      default: ["🎉", "😊", "✨"],
    },
    announcementSpeed: {
      type: Number,
      default: 28,
    },
    contact: {
      email: { type: String, default: "support@aperture.tech" },
      phone: { type: String, default: "+92 300 0000000" },
      whatsapp: { type: String, default: "+92 300 0000000" },
      hours: { type: String, default: "Mon–Fri, 09:00–17:30 PKT" },
      address: { type: String, default: "Lahore, Pakistan" },
      mapEmbedUrl: { type: String, default: "" },
    },
    social: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    payment: {
      codEnabled: { type: Boolean, default: true },
      onlineEnabled: { type: Boolean, default: true },
      online: {
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        bankName: { type: String, default: "" },
        iban: { type: String, default: "" },
        instructions: {
          type: String,
          default:
            "Transfer the exact order total, then place your order. We confirm once payment is verified.",
        },
        qrImage: { type: String, default: "" },
      },
    },
    shipping: {
      freeThreshold: { type: Number, default: 20000 },
      flatFee: { type: Number, default: 250 },
      giftFee: { type: Number, default: 500 },
      currency: { type: String, default: "PKR" },
    },
    // Admin-managed key/value charges (tax, delivery surcharge, handling, etc.)
    // that are applied on top of the cart at checkout.
    extraCharges: {
      type: [
        {
          label: { type: String, required: true },
          type: { type: String, enum: ["flat", "percent"], default: "flat" },
          value: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
          _id: false,
        },
      ],
      default: [{ label: "Tax", type: "percent", value: 0, enabled: false }],
    },
    // Admin-managed discount codes usable at checkout.
    // Stores remaining uses in-place (usedUses is incremented when orders are placed).
    discountCodes: {
      type: [
        {
          code: { type: String, required: true },
          type: { type: String, enum: ["percent", "flat"], default: "percent" },
          value: { type: Number, default: 0 },
          maxUses: { type: Number, default: 0 }, // total redemptions allowed
          usedUses: { type: Number, default: 0 }, // increments on successful order placement
          enabled: { type: Boolean, default: true },
          _id: false,
        },
      ],
      default: [],
    },
    help: {
      callLabel: { type: String, default: "Call us" },
      whatsappLabel: { type: String, default: "WhatsApp" },
      helpText: {
        type: String,
        default:
          "Need help with your order? Reach us by call or WhatsApp — we reply within one working day.",
      },
    },
    newsletter: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "10% off your first order" },
      headline: {
        type: String,
        default: "One email a month. Measurements, not marketing.",
      },
      buttonLabel: { type: String, default: "Subscribe" },
      successMessage: {
        type: String,
        default: "You're on the list — check your inbox shortly.",
      },
    },
    testimonialsSection: {
      eyebrow: { type: String, default: "Verified purchasers" },
      title: { type: String, default: "What customers report" },
    },
    instagramShots: [{ type: String }],
    // Ordered product slugs shown in the storefront "Trending" rail.
    trendingProductSlugs: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("SiteSettings", siteSettingsSchema);
