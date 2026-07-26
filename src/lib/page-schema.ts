/**
 * Content model for the admin "Website" module.
 *
 * Every editable page section is described here once: the admin renders a form
 * from this description, and the storefront merges saved values over the same
 * defaults. Adding a field in this file makes it editable in admin and
 * available to the page with no other wiring.
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
            default: [
              {
                image:
                  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=2000&q=80",
                eyebrow: "Wireless audio",
                title: "Noise cancelled.\nClarity unlocked.",
                subtitle:
                  "Premium earbuds and headphones with adaptive ANC, long battery life, and studio-grade drivers.",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2000&q=80",
                eyebrow: "Smart wearables",
                title: "Your day,\non your wrist.",
                subtitle:
                  "Smartwatches and fitness trackers that track health, stay connected, and last for days.",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=2000&q=80",
                eyebrow: "Gadgets & gear",
                title: "Tech that\nearns its place.",
                subtitle:
                  "From smart home to desk essentials — devices built for people who care how things work.",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=2000&q=80",
                eyebrow: "Desk setup",
                title: "Power your\nworkspace.",
                subtitle:
                  "Monitors, keyboards, docks and peripherals designed for focus and long sessions.",
              },
            ],
          },
        ],
      },
      {
        key: "flashSale",
        label: "Flash sale bar",
        description: "The black strip with the countdown.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "Limited run · 200 units" },
          { key: "title", label: "Offer text", type: "text", default: "Gen 2 stock clearing at −20%" },
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
          { key: "eyebrow", label: "Small label", type: "text", default: "Moving fastest this week" },
          { key: "title", label: "Heading", type: "text", default: "Trending now" },
          { key: "actionLabel", label: "Link text", type: "text", default: "View all" },
        ],
      },
      {
        key: "categories",
        label: "Shop by category grid",
        description: "Category tiles use images set in the Categories module.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "Six disciplines" },
          { key: "title", label: "Heading", type: "text", default: "Shop by category" },
        ],
      },
      {
        key: "arrivals",
        label: "New arrivals grid",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "Latest into the catalogue" },
          { key: "title", label: "Heading", type: "text", default: "New arrivals" },
          { key: "actionLabel", label: "Link text", type: "text", default: "View all" },
        ],
      },
      {
        key: "brandStory",
        label: "Brand story",
        description: "Image and text block linking to the About page.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "Est. 2019 · Rotterdam" },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "Precision is a number you can check.",
          },
          {
            key: "body",
            label: "Paragraph",
            type: "textarea",
            default:
              "We publish tolerances, measured curves and battery figures taken under load, not under ideal conditions. Every product ships with the datasheet it was tested against.",
          },
          { key: "linkLabel", label: "Link text", type: "text", default: "Read the full story" },
          {
            key: "image",
            label: "Photo",
            type: "image",
            default:
              "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80",
          },
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
            default: [
              { icon: "truck", title: "Free shipping", subtitle: "Orders over {freeShipping}" },
              { icon: "package", title: "Cash on Delivery", subtitle: "Domestic orders" },
              { icon: "return", title: "30-day returns", subtitle: "We cover faults" },
              { icon: "shield", title: "1-year warranty", subtitle: "3 years if registered" },
            ],
          },
        ],
      },
      {
        key: "ugc",
        label: "Instagram grid",
        description: "Photos come from Settings → Instagram shots.",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "@aperture.instruments" },
          { key: "title", label: "Heading", type: "text", default: "In the field" },
        ],
      },
      {
        key: "rating",
        label: "Average rating band",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "Rated by owners" },
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
          { key: "eyebrow", label: "Small label", type: "text", default: "Est. 2019 · Rotterdam" },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "We started because nobody would publish their numbers.",
          },
          {
            key: "image",
            label: "Photo",
            type: "image",
            default:
              "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=80",
          },
        ],
        lists: [
          {
            key: "paragraphs",
            label: "Paragraphs",
            itemLabel: "Paragraph",
            fields: [{ key: "text", label: "Text", type: "textarea", default: "" }],
            default: [
              {
                text: "Aperture began in a rented unit behind a shipyard, with a borrowed anechoic chamber and a disagreement about whether a battery figure measured at 50% volume means anything.",
              },
              {
                text: "Precision, to us, is not a texture. It is a number you can check against the product in your hand. Every device ships with the measured curve it was tested against, the tolerance it was machined to, and the cycle count at which its cell drops below 84% capacity.",
              },
              {
                text: "We run small batches — usually 500 to 2,000 units — because that is the largest quantity we can test individually without outsourcing the part of the job we care most about.",
              },
            ],
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
            default: [
              {
                number: "01",
                title: "Measure first",
                body: "No product enters the catalogue before its datasheet is written and independently checked.",
              },
              {
                number: "02",
                title: "Fasteners, not glue",
                body: "Structural adhesive is a decision to make a product disposable. We use threads wherever sealing allows.",
              },
              {
                number: "03",
                title: "Five years of spares",
                body: "Pads, cells, cables and clamps stay stocked for five years after a product is discontinued.",
              },
            ],
          },
        ],
      },
      {
        key: "team",
        label: "Team gallery",
        fields: [
          visibleField(),
          { key: "eyebrow", label: "Small label", type: "text", default: "The bench" },
          { key: "title", label: "Heading", type: "text", default: "Fourteen people, one building" },
        ],
        lists: [
          {
            key: "photos",
            label: "Photos",
            itemLabel: "Photo",
            max: 12,
            fields: [{ key: "image", label: "Photo", type: "image", default: "" }],
            default: [
              {
                image:
                  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=700&q=80",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=80",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=80",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
              },
            ],
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
            default: "Support · Mon–Fri 09:00–17:30 CET",
          },
          {
            key: "title",
            label: "Heading",
            type: "text",
            default: "Every message gets a reply within one working day.",
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
            default: [
              { icon: "mail", label: "Email", value: "support@aperture.tech" },
              { icon: "phone", label: "Phone", value: "+31 10 555 0142" },
              { icon: "clock", label: "Hours", value: "Mon–Fri, 09:00–17:30 CET" },
              { icon: "pin", label: "Workshop", value: "Scheepsbouwkade 14, Rotterdam" },
            ],
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
          { key: "name", label: "Brand name", type: "text", default: "APERTURE" },
          {
            key: "blurb",
            label: "Short description",
            type: "textarea",
            default: "Precision consumer electronics, made in small runs and documented in full.",
          },
          { key: "copyright", label: "Bottom left text", type: "text", default: "© 2026 Aperture Instruments" },
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

/** Default values for one section, used as the fallback everywhere. */
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
