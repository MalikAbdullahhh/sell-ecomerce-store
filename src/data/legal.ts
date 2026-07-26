export type LegalDoc = {
  slug: string;
  title: string;
  updated: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "12 May 2026",
    summary: "What Aperture collects, why it is collected, and how long it is kept.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "We collect the name, email address, delivery address and phone number you provide at checkout, plus the order contents and payment status returned by our processor.",
          "We do not receive or store full card numbers. Payment credentials are tokenised by the processor and never reach our servers.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "To fulfil and deliver orders, handle returns and warranty claims, and meet accounting obligations.",
          "With your consent, to send the Journal newsletter. Consent can be withdrawn from any email in one click.",
        ],
      },
      {
        heading: "Retention",
        body: [
          "Order records are kept for seven years to satisfy tax law. Marketing data is deleted within 30 days of unsubscribing.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You may request a copy, correction or deletion of your data at support@aperture.tech. We respond within 30 days.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    updated: "12 May 2026",
    summary: "The agreement covering purchases made through the Aperture store.",
    sections: [
      {
        heading: "Orders",
        body: [
          "An order is an offer to buy. The contract forms when we send the dispatch confirmation. We may decline an order where stock, pricing or address verification fails.",
        ],
      },
      {
        heading: "Pricing",
        body: [
          "Prices include VAT where applicable and exclude duties on international shipments. If a price is listed in error we will contact you before charging.",
        ],
      },
      {
        heading: "Warranty",
        body: [
          "Products carry a one-year warranty, extendable to three years free of charge with registration within 30 days of delivery. The warranty covers defects in materials and workmanship, not accidental damage.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Nothing in these terms limits liability for death, personal injury or fraud. Otherwise our liability is limited to the value of the order.",
        ],
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping & Returns",
    updated: "12 May 2026",
    summary: "Delivery windows, costs, and how the 30-day return window works.",
    sections: [
      {
        heading: "Delivery",
        body: [
          "Standard delivery is 2–4 business days domestically and 5–9 days internationally. Orders placed before 14:00 CET ship the same working day.",
          "Shipping is free above $75. Below that a flat rate of $6.50 applies. Cash on Delivery is available domestically up to $600.",
        ],
      },
      {
        heading: "Returns",
        body: [
          "You have 30 days from delivery to return an unused product in original packaging. Opened audio products are accepted if hygiene seals are intact.",
          "We pay return shipping on faults and first exchanges. Change-of-mind returns cost $8, deducted from the refund.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Refunds are issued to the original payment method within three business days of the return being scanned at our warehouse.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    updated: "12 May 2026",
    summary: "The three cookie categories used on this store and how to control them.",
    sections: [
      {
        heading: "Essential",
        body: [
          "Cart contents, wishlist and session state are stored in your browser. These cannot be disabled without breaking checkout.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "Aggregated, IP-truncated page metrics help us find broken paths. No cross-site tracking and no advertising identifiers.",
        ],
      },
      {
        heading: "Preferences",
        body: [
          "Recently viewed products and dismissed banners. Clearing site data removes all of them immediately.",
        ],
      },
    ],
  },
];

export const getLegal = (slug: string) => legalDocs.find((d) => d.slug === slug);
