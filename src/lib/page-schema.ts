/**
 * Content model for the admin "Website" module.
 *
 * Every editable page section is described here once: the admin renders a form
 * from this description, and the storefront merges saved values over empty
 * field defaults (no seed marketing copy). Adding a field here makes it
 * editable in admin and available to the page with no other wiring.
 */

export type CmsFieldType = "text" | "textarea" | "image" | "number" | "boolean" | "select";

export type CmsField = {
  key: string;
  label: string;
  type: CmsFieldType;
  default: string | number | boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
};

export type CmsList = {
  key: string;
  label: string;
  itemLabel: string;
  max?: number;
  fields: CmsField[];
  default: Record<string, string | number | boolean>[];
};

export type CmsSection = {
  key: string;
  label: string;
  description?: string;
  fields?: CmsField[];
  lists?: CmsList[];
};

export type CmsPage = {
  key: string;
  label: string;
  description?: string;
  sections: CmsSection[];
};

export const ICON_OPTIONS = [
  { value: "truck", label: "Truck (shipping)" },
  { value: "package", label: "Package" },
  { value: "return", label: "Return / refresh" },
  { value: "shield", label: "Shield (warranty)" },
  { value: "mail", label: "Mail" },
  { value: "phone", label: "Phone" },
  { value: "clock", label: "Clock" },
  { value: "pin", label: "Map pin" },
  { value: "star", label: "Star" },
  { value: "instagram", label: "Instagram" },
];

const visibleField = (label = "Show this section"): CmsField => ({
  key: "visible",
  label,
  type: "boolean",
  default: true,
});

export const PAGE_SCHEMA: CmsPage[] = [
  {
    key: "home",
    label: "Home",
    description: "Every band on the homepage, top to bottom.",
    sections: [
      {
        key: "hero",
        label: "Hero carousel",
        description:
          "Full-screen cinematic slider. Each slide fades in with animated text over a slow-zooming photo.",
        fields: [
          {
            key: "autoplaySeconds",
            label: "Seconds per slide",
            type: "number",
            default: 5,
            help: "How long each slide stays before auto-advancing.",
          },
        ],
        lists: [
          {
            key: "slides",
            label: "Slides",
            itemLabel: "Slide",
            max: 8,
            fields: [
              {
                key: "image",
                label: "Background image",
                type: "image",
                default: "",
                help: "Wide landscape photos look best (16:9).",
              },
              { key: "eyebrow", label: "Small label above title", type: "text", default: "" },
              {
                key: "title",
                label: "Big title",
                type: "textarea",
                default: "",
                help: "Each word animates in. Press Enter for a line break.",
              },
              { key: "subtitle", label: "Subtitle", type: "textarea", default: "" },
            ],
            default: [],
          },
        ],
      },
      {
        key: "flashSale",
        label: "Flash sale bar",
        description: "The black strip with the countdown.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Offer text", type: "text", default: "" },
          { key: "showCountdown", label: "Show countdown timer", type: "boolean", default: true },
          {
            key: "countdownHours",
            label: "Countdown length (hours)",
            type: "number",
            default: 9.5,
            help: "Restarts whenever the page is loaded.",
          },
        ],
      },
      {
        key: "trending",
        label: "Trending products row",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Heading", type: "text", default: "" },
          { key: "actionLabel", label: "Link text", type: "text", default: "View all" },
        ],
      },
      {
        key: "categories",
        label: "Shop by category grid",
        description: "Category tiles use images set in the Categories module.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Heading", type: "text", default: "" },
        ],
      },
      {
        key: "arrivals",
        label: "New arrivals grid",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Heading", type: "text", default: "" },
          { key: "actionLabel", label: "Link text", type: "text", default: "View all" },
        ],
      },
      {
        key: "brandStory",
        label: "Brand story",
        description: "Image and text block linking to the About page.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "",
          },
          { key: "body", label: "Paragraph", type: "textarea", default: "" },
          { key: "linkLabel", label: "Link text", type: "text", default: "Read the full story" },
          { key: "image", label: "Photo", type: "image", default: "" },
        ],
      },
      {
        key: "valueStrip",
        label: "Promise strip",
        description: "The four icons with shipping, returns and warranty promises.",
        fields: [visibleField()],
        lists: [
          {
            key: "items",
            label: "Promises",
            itemLabel: "Promise",
            max: 6,
            fields: [
              { key: "icon", label: "Icon", type: "select", default: "truck", options: ICON_OPTIONS },
              { key: "title", label: "Title", type: "text", default: "" },
              { key: "subtitle", label: "Subtitle", type: "text", default: "" },
            ],
            default: [],
          },
        ],
      },
      {
        key: "ugc",
        label: "Instagram grid",
        description: "Photos come from Settings → Instagram shots.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Heading", type: "text", default: "" },
        ],
      },
      {
        key: "rating",
        label: "Average rating band",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "reviewsLabel", label: "Word after review count", type: "text", default: "reviews" },
        ],
      },
    ],
  },
  {
    key: "about",
    label: "About",
    sections: [
      {
        key: "intro",
        label: "Intro",
        fields: [
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "",
          },
          { key: "image", label: "Photo", type: "image", default: "" },
        ],
        lists: [
          {
            key: "paragraphs",
            label: "Paragraphs",
            itemLabel: "Paragraph",
            fields: [{ key: "text", label: "Text", type: "textarea", default: "" }],
            default: [],
          },
        ],
      },
      {
        key: "values",
        label: "Principles",
        fields: [visibleField()],
        lists: [
          {
            key: "items",
            label: "Principles",
            itemLabel: "Principle",
            fields: [
              { key: "number", label: "Number", type: "text", default: "" },
              { key: "title", label: "Title", type: "text", default: "" },
              { key: "body", label: "Description", type: "textarea", default: "" },
            ],
            default: [],
          },
        ],
      },
      {
        key: "team",
        label: "Team gallery",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "" },
          { key: "title", label: "Heading", type: "text", default: "" },
        ],
        lists: [
          {
            key: "photos",
            label: "Photos",
            itemLabel: "Photo",
            max: 12,
            fields: [{ key: "image", label: "Photo", type: "image", default: "" }],
            default: [],
          },
        ],
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    sections: [
      {
        key: "intro",
        label: "Intro",
        fields: [
          {
            key: "eyebrow",
            label: "Small label",
            type: "text",
            default: "",
          },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "",
          },
        ],
      },
      {
        key: "form",
        label: "Contact form",
        fields: [
          { key: "namePlaceholder", label: "Name field placeholder", type: "text", default: "Name" },
          { key: "emailPlaceholder", label: "Email field placeholder", type: "text", default: "Email" },
          {
            key: "phonePlaceholder",
            label: "Phone field placeholder",
            type: "text",
            default: "Phone",
          },
          {
            key: "orderPlaceholder",
            label: "Order field placeholder",
            type: "text",
            default: "Order number (optional)",
          },
          {
            key: "messagePlaceholder",
            label: "Message field placeholder",
            type: "text",
            default: "What can we help with?",
          },
          { key: "buttonLabel", label: "Button text", type: "text", default: "Send message" },
          {
            key: "successMessage",
            label: "Message after sending",
            type: "text",
            default: "Message sent — expect a reply within one working day.",
          },
        ],
      },
      {
        key: "cards",
        label: "Contact details",
        fields: [visibleField()],
        lists: [
          {
            key: "items",
            label: "Details",
            itemLabel: "Detail",
            fields: [
              { key: "icon", label: "Icon", type: "select", default: "mail", options: ICON_OPTIONS },
              { key: "label", label: "Label", type: "text", default: "" },
              { key: "value", label: "Value", type: "text", default: "" },
            ],
            default: [],
          },
        ],
      },
    ],
  },
  {
    key: "shop",
    label: "Shop",
    sections: [
      {
        key: "header",
        label: "Page header",
        fields: [
          { key: "title", label: "Heading when no filter is active", type: "text", default: "Everything we make" },
          {
            key: "countSuffix",
            label: "Text after the product count",
            type: "text",
            default: "products in focus",
          },
          {
            key: "emptyText",
            label: "Text when nothing matches",
            type: "text",
            default: "No products match these filters — try widening your price range.",
          },
        ],
      },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Questions themselves are managed in the FAQs tab.",
    sections: [
      {
        key: "header",
        label: "Page header",
        fields: [
          { key: "eyebrow", label: "Small label", type: "text", default: "Support" },
          { key: "title", label: "Heading", type: "text", default: "Frequently asked" },
          { key: "searchPlaceholder", label: "Search placeholder", type: "text", default: "Search the FAQ" },
          {
            key: "emptyText",
            label: "Text when nothing matches",
            type: "text",
            default: 'No answers match that. Try "delivery", "refund" or "warranty".',
          },
        ],
      },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    sections: [
      {
        key: "brand",
        label: "Brand column",
        fields: [
          { key: "name", label: "Brand name", type: "text", default: "Genz Gadgets PK" },
          {
            key: "blurb",
            label: "Short description",
            type: "textarea",
            default: "",
          },
          { key: "copyright", label: "Bottom left text", type: "text", default: "" },
          {
            key: "paymentsText",
            label: "Bottom right text",
            type: "text",
            default: "Visa · Mastercard · Amex · Apple Pay · Cash on Delivery",
          },
        ],
      },
      {
        key: "links",
        label: "Footer links",
        description: "Group links by typing the same column name.",
        lists: [
          {
            key: "items",
            label: "Links",
            itemLabel: "Link",
            max: 24,
            fields: [
              { key: "column", label: "Column", type: "text", default: "" },
              { key: "label", label: "Link text", type: "text", default: "" },
              { key: "href", label: "Path", type: "text", default: "/", placeholder: "/shop" },
            ],
            default: [
              { column: "Shop", label: "All products", href: "/shop" },
              { column: "Shop", label: "Compare", href: "/compare" },
              { column: "Shop", label: "Wishlist", href: "/wishlist" },
              { column: "Company", label: "About", href: "/about" },
              { column: "Company", label: "Journal", href: "/journal" },
              { column: "Company", label: "Contact", href: "/contact" },
              { column: "Support", label: "FAQ", href: "/faq" },
              { column: "Support", label: "Orders", href: "/account/orders" },
              { column: "Support", label: "Shipping policy", href: "/legal/shipping" },
              { column: "Legal", label: "Terms of service", href: "/legal/terms" },
              { column: "Legal", label: "Privacy policy", href: "/legal/privacy" },
              { column: "Legal", label: "Returns & refunds", href: "/legal/returns" },
            ],
          },
        ],
      },
    ],
  },
];

export type SectionValues = Record<string, unknown>;

export const getPageSchema = (page: string) => PAGE_SCHEMA.find((p) => p.key === page);

export const getSectionSchema = (page: string, section: string) =>
  getPageSchema(page)?.sections.find((s) => s.key === section);

/** Empty / structural defaults for one section (no seed copy or images). */
export function sectionDefaults(page: string, section: string): SectionValues {
  const schema = getSectionSchema(page, section);
  if (!schema) return {};
  const out: SectionValues = {};
  for (const field of schema.fields || []) out[field.key] = field.default;
  for (const list of schema.lists || []) out[list.key] = list.default.map((item) => ({ ...item }));
  return out;
}

export function pageDefaults(page: string): Record<string, SectionValues> {
  const schema = getPageSchema(page);
  if (!schema) return {};
  return Object.fromEntries(schema.sections.map((s) => [s.key, sectionDefaults(page, s.key)]));
}

/**
 * Saved values win field-by-field; anything the admin never touched keeps its
 * default, so adding a new field to the schema never blanks a live page.
 */
export function mergeSection(
  page: string,
  section: string,
  saved: SectionValues | undefined,
): SectionValues {
  const defaults = sectionDefaults(page, section);
  if (!saved) return defaults;
  const merged: SectionValues = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined || value === null) continue;
    merged[key] = value;
  }
  return merged;
}

/** Replaces {freeShipping}-style tokens admins can leave inside copy. */
export function fillTokens(text: string, tokens: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => tokens[key] ?? match);
}
