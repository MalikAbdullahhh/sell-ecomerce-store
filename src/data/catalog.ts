export type Category = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
};

export type Variant = {
  id: string;
  label: string;
  type: "color" | "size";
  value?: string;
  image?: string;
};

export type Review = {
  id: string;
  userId?: string | null;
  author: string;
  authorImage?: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  images?: string[];
  videos?: string[];
};

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  /** All category slugs (includes primary `category`). */
  categories?: string[];
  price: number;
  compareAt?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  short: string;
  description: string;
  specs: { label: string; value: string }[];
  colors: Variant[];
  sizes?: Variant[];
  inStock: boolean;
  stock: number;
  soldCount?: number;
  flags: ("new" | "hot")[];
  reviews: Review[];
};

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories: Category[] = [
  {
    slug: "audio",
    name: "Audio",
    blurb: "Headphones, earbuds, speakers",
    image: u("1505740420928-5e560c06d30e", 900),
  },
  {
    slug: "wearables",
    name: "Wearables",
    blurb: "Watches and rings",
    image: u("1523275335684-37898b6baf30", 900),
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    blurb: "Light, sound, sensing",
    image: u("1558089687-f282ffcbc126", 900),
  },
  {
    slug: "accessories",
    name: "Accessories",
    blurb: "Cables, cases, power",
    image: u("1585298723682-7115561c51b7", 900),
  },
  {
    slug: "cameras",
    name: "Optics",
    blurb: "Lenses and capture",
    image: u("1516035069371-29a1b244cc32", 900),
  },
  {
    slug: "desk",
    name: "Desk",
    blurb: "Keys, mice, mounts",
    image: u("1587829741301-dc798b83add3", 900),
  },
];

const colorSet = (a: string, b: string): Variant[] => [
  { id: "ink", label: a, type: "color" },
  { id: "paper", label: b, type: "color" },
];

const baseReviews = (name: string): Review[] => [
  {
    id: "r1",
    author: "M. Halden",
    rating: 5,
    date: "2026-05-12",
    title: "Exactly as specified",
    body: `${name} arrived boxed like an instrument. Tolerances feel machined, not moulded.`,
  },
  {
    id: "r2",
    author: "J. Okafor",
    rating: 4,
    date: "2026-04-28",
    title: "Strong, one nitpick",
    body: "Build and sound are excellent. The carry case could be a touch slimmer for a jacket pocket.",
  },
  {
    id: "r3",
    author: "S. Lindqvist",
    rating: 5,
    date: "2026-03-02",
    title: "Replaced two devices",
    body: "Battery figures match the datasheet, which is rarer than it should be.",
  },
];

function make(
  p: Omit<Product, "colors" | "reviews" | "inStock" | "flags" | "stock"> &
    Partial<Pick<Product, "colors" | "reviews" | "inStock" | "flags" | "stock">>,
): Product {
  return {
    colors: colorSet("Graphite", "Chalk"),
    reviews: baseReviews(p.name),
    inStock: true,
    stock: 24,
    flags: [],
    ...p,
  } as Product;
}

export const products: Product[] = [
  make({
    slug: "aperture-one-earbuds",
    name: "Aperture One",
    brand: "APERTURE",
    category: "audio",
    price: 249,
    compareAt: 299,
    rating: 4.8,
    reviewCount: 412,
    images: [
      u("1590658268037-6bf12165a8df"),
      u("1606220945770-b5b6c2c55bf1"),
      u("1572569511254-d8f925fe2cbb"),
    ],
    short: "Adaptive ANC earbuds with a 12mm graphene driver and 32h of case runtime.",
    description:
      "Aperture One is a two-way earbud tuned in a treated room, not a marketing meeting. A 12mm graphene diaphragm handles low end without smearing midrange detail, while a four-microphone array runs feed-forward and feed-back cancellation at 48kHz. The case is milled aluminium with a magnet-indexed lid.",
    specs: [
      { label: "Driver", value: "12mm graphene" },
      { label: "Frequency response", value: "20Hz – 22kHz" },
      { label: "ANC depth", value: "-42dB" },
      { label: "Battery (bud)", value: "8h" },
      { label: "Battery (case)", value: "32h" },
      { label: "Bluetooth", value: "5.4 / LE Audio" },
      { label: "Codecs", value: "LDAC, AAC, SBC" },
      { label: "Water rating", value: "IPX5" },
      { label: "Weight", value: "5.1g per bud" },
    ],
    flags: ["hot"],
    stock: 6,
  }),
  make({
    slug: "field-over-ear",
    name: "Field 02 Over-Ear",
    brand: "APERTURE",
    category: "audio",
    price: 429,
    rating: 4.7,
    reviewCount: 208,
    images: [
      u("1583394838336-acd977736f90"),
      u("1618366712010-f4ae9c647dcb"),
      u("1546435770-a3e426bf472b"),
    ],
    short: "Closed-back reference headphones with 60h runtime and a replaceable pad system.",
    description:
      "A closed-back monitor for people who mix on trains. Field 02 uses a 40mm beryllium-coated driver, a steel headband under leather, and pads you can replace with a coin.",
    specs: [
      { label: "Driver", value: "40mm beryllium-coated" },
      { label: "Impedance", value: "32Ω" },
      { label: "Battery", value: "60h ANC on" },
      { label: "Charge", value: "USB-C, 10m = 6h" },
      { label: "Weight", value: "268g" },
    ],
    sizes: [
      { id: "std", label: "Standard", type: "size" },
      { id: "wide", label: "Wide band", type: "size" },
    ],
    flags: ["new"],
  }),
  make({
    slug: "signal-watch",
    name: "Signal Watch",
    brand: "APERTURE",
    category: "wearables",
    price: 379,
    compareAt: 449,
    rating: 4.6,
    reviewCount: 331,
    images: [
      u("1523275335684-37898b6baf30"),
      u("1508685096489-7aacd43bd3b1"),
      u("1434493789847-2f02dc6ca35d"),
    ],
    short: "Titanium smartwatch with a 14-day duty cycle and a sapphire face.",
    description:
      "Grade-5 titanium case, sapphire crystal, and a transflective display you can actually read outdoors. Sensors sample continuously without draining the pack.",
    specs: [
      { label: "Case", value: "Grade-5 titanium" },
      { label: "Display", value: "1.4in transflective AMOLED" },
      { label: "Battery", value: "14 days typical" },
      { label: "Water rating", value: "10 ATM" },
      { label: "Sensors", value: "HR, SpO2, baro, GPS L1/L5" },
    ],
    sizes: [
      { id: "40", label: "40mm", type: "size" },
      { id: "44", label: "44mm", type: "size" },
    ],
    flags: ["hot"],
  }),
  make({
    slug: "trace-ring",
    name: "Trace Ring",
    brand: "APERTURE",
    category: "wearables",
    price: 289,
    rating: 4.4,
    reviewCount: 156,
    images: [
      u("1611591437281-460bfbe1220a"),
      u("1602173574767-37ac01994b2a"),
      u("1515562141207-7a88fb7ce338"),
    ],
    short: "Sleep and recovery tracking in 3.4 grams of zirconia ceramic.",
    description:
      "No screen, no notifications. Trace measures sleep staging, temperature drift and HRV, then gets out of the way.",
    specs: [
      { label: "Material", value: "Zirconia ceramic" },
      { label: "Weight", value: "3.4g" },
      { label: "Battery", value: "7 days" },
      { label: "Sizes", value: "US 6 – 13" },
    ],
    sizes: [
      { id: "s", label: "Size 8", type: "size" },
      { id: "m", label: "Size 10", type: "size" },
      { id: "l", label: "Size 12", type: "size" },
    ],
    flags: ["new"],
  }),
  make({
    slug: "halo-lamp",
    name: "Halo Lamp",
    brand: "APERTURE",
    category: "smart-home",
    price: 199,
    rating: 4.5,
    reviewCount: 98,
    images: [
      u("1507473885765-e6ed057f782c"),
      u("1524758631624-e2822e304c36"),
      u("1513506003901-1e6a229e2d15"),
    ],
    short: "Tunable 2200–6500K desk light with a physical dimmer ring.",
    description:
      "Full-spectrum LED with CRI 97 and a knurled aluminium ring that dims without an app. Matter-native if you want the app anyway.",
    specs: [
      { label: "CRI", value: "97" },
      { label: "Temperature", value: "2200K – 6500K" },
      { label: "Output", value: "1100 lumens" },
      { label: "Protocol", value: "Matter over Thread" },
    ],
    flags: [],
  }),
  make({
    slug: "quiet-sensor",
    name: "Quiet Sensor",
    brand: "APERTURE",
    category: "smart-home",
    price: 89,
    compareAt: 109,
    rating: 4.2,
    reviewCount: 74,
    images: [
      u("1558089687-f282ffcbc126"),
      u("1585771724684-38269d6639fd"),
      u("1544428571-affb0ff33ca4"),
    ],
    short: "Air quality, temperature and presence in one matte block.",
    description:
      "Measures PM2.5, VOC, CO2, humidity and presence. Local-first: readings stay on your network unless you say otherwise.",
    specs: [
      { label: "Sensors", value: "PM2.5, VOC, CO2, RH" },
      { label: "Sampling", value: "Every 10s" },
      { label: "Power", value: "USB-C, 5V 1A" },
      { label: "Radio", value: "Thread + BLE" },
    ],
    stock: 4,
  }),
  make({
    slug: "index-keyboard",
    name: "Index 65",
    brand: "APERTURE",
    category: "desk",
    price: 219,
    rating: 4.9,
    reviewCount: 512,
    images: [
      u("1587829741301-dc798b83add3"),
      u("1595225476474-87563907a212"),
      u("1618384887929-16ec33fab9ef"),
    ],
    short: "Gasket-mounted 65% keyboard, hot-swap, PBT dye-sub caps.",
    description:
      "An aluminium 65% with a proper gasket mount, silicone dampening and a rotary encoder. Hot-swap sockets take three- and five-pin switches.",
    specs: [
      { label: "Layout", value: "65% / 68 keys" },
      { label: "Mount", value: "Gasket" },
      { label: "Caps", value: "PBT dye-sublimated" },
      { label: "Connection", value: "USB-C / BLE / 2.4GHz" },
      { label: "Weight", value: "1.1kg" },
    ],
    flags: ["hot"],
  }),
  make({
    slug: "pivot-mouse",
    name: "Pivot Mouse",
    brand: "APERTURE",
    category: "desk",
    price: 129,
    rating: 4.3,
    reviewCount: 187,
    images: [
      u("1527864550417-7fd91fc51a46"),
      u("1615663245857-ac93bb7c39e7"),
      u("1563297007-0686b7003af7"),
    ],
    short: "26,000 DPI sensor, 58g shell, magnetic charging puck.",
    description:
      "Low-latency wireless with a 1000Hz polling rate and a shell that stops at 58 grams without feeling hollow.",
    specs: [
      { label: "Sensor", value: "26,000 DPI optical" },
      { label: "Polling", value: "1000Hz" },
      { label: "Weight", value: "58g" },
      { label: "Battery", value: "90h" },
    ],
  }),
  make({
    slug: "carry-case",
    name: "Carry Case 03",
    brand: "APERTURE",
    category: "accessories",
    price: 59,
    rating: 4.1,
    reviewCount: 63,
    images: [
      u("1585298723682-7115561c51b7"),
      u("1553062407-98eeb64c6a62"),
      u("1591561954557-26941169b49e"),
    ],
    short: "Moulded EVA case with a die-cut insert for buds, cable and dongle.",
    description:
      "Water-resistant 600D shell over EVA, YKK zip, and an insert that actually holds things still.",
    specs: [
      { label: "Shell", value: "600D water-resistant" },
      { label: "Zip", value: "YKK #5" },
      { label: "Dimensions", value: "180 x 90 x 45mm" },
    ],
  }),
  make({
    slug: "power-brick",
    name: "Cell 100W",
    brand: "APERTURE",
    category: "accessories",
    price: 79,
    compareAt: 99,
    rating: 4.6,
    reviewCount: 244,
    images: [
      u("1583863788434-e58a36330cf0"),
      u("1618410320928-25228d811631"),
      u("1600490036275-35f5f1656861"),
    ],
    short: "GaN charger, four ports, 100W total with per-port negotiation.",
    description:
      "Gallium-nitride internals keep it cool at full load. Two USB-C PD 3.1 ports, two USB-A.",
    specs: [
      { label: "Output", value: "100W total" },
      { label: "Ports", value: "2x USB-C, 2x USB-A" },
      { label: "Standard", value: "PD 3.1 / PPS" },
      { label: "Weight", value: "192g" },
    ],
    flags: ["hot"],
  }),
  make({
    slug: "lens-35",
    name: "Prime 35 Adapter",
    brand: "APERTURE",
    category: "cameras",
    price: 349,
    rating: 4.7,
    reviewCount: 89,
    images: [
      u("1516035069371-29a1b244cc32"),
      u("1502920917128-1aa500764cbd"),
      u("1510127034890-ba27508e9f1c"),
    ],
    short: "Machined phone lens mount with a true 35mm equivalent element.",
    description:
      "Aircraft aluminium mount, multicoated glass, and a clamp that grips without marking the case.",
    specs: [
      { label: "Focal length", value: "35mm equiv." },
      { label: "Elements", value: "6 in 4 groups" },
      { label: "Coating", value: "Multi-layer AR" },
      { label: "Thread", value: "M17 x 0.5" },
    ],
    flags: ["new"],
  }),
  make({
    slug: "monitor-arm",
    name: "Arm 01",
    brand: "APERTURE",
    category: "desk",
    price: 169,
    rating: 4.4,
    reviewCount: 121,
    images: [
      u("1527443224154-c4a3942d3acf"),
      u("1593642532744-d377ab507dc8"),
      u("1547082299-de196ea013d6"),
    ],
    short: "Gas-spring monitor arm rated to 9kg with internal cable routing.",
    description: "Cold-rolled steel arm with a machined clamp and cable channels that close flush.",
    specs: [
      { label: "Load", value: "3 – 9kg" },
      { label: "Reach", value: "620mm" },
      { label: "VESA", value: "75 / 100" },
    ],
    inStock: false,
    stock: 0,
  }),
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const brands = Array.from(new Set(products.map((p) => p.brand)));

export type Post = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  excerpt: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "why-we-tune-in-a-treated-room",
    title: "Why we tune every driver in a treated room",
    category: "Process",
    readTime: "6 min",
    date: "2026-06-18",
    image: u("1478737270239-2f02b77fc618"),
    excerpt:
      "Most consumer audio is voiced on a laptop in an open-plan office. Here's what changes when you stop doing that.",
    body: [
      "A room is a filter. Before a single driver reaches a listener, the space it was tuned in has already made most of the decisions about how it sounds.",
      "Our tuning room is 24 square metres, treated to an RT60 of 0.18 seconds across the vocal band, with bass traps in all four corners. It is a deliberately boring room, and that is the point: it adds as little of its own character as possible.",
      "We tune against a measured target curve, then validate by ear across six listeners with different ear geometries. When the measured and perceived results disagree, we investigate rather than pick a winner.",
    ],
  },
  {
    slug: "the-case-against-accent-colours",
    title: "The case against accent colours",
    category: "Design",
    readTime: "4 min",
    date: "2026-05-30",
    image: u("1517420704952-d9f39e95b43e"),
    excerpt:
      "Colour is the laziest way to signal hierarchy. Weight, scale and contrast do it better.",
    body: [
      "Colour is expensive. Not to print — to read. Every accent hue you add is a new rule the reader has to learn and hold.",
      "Remove colour and you are forced to build hierarchy out of the things that were always doing the work anyway: type weight, scale, spacing, and contrast.",
      "A sale tag rendered as inverted fill reads faster than a red badge, because inversion is a step change in luminance rather than a shift in hue that a third of readers perceive differently.",
    ],
  },
  {
    slug: "battery-numbers-that-mean-something",
    title: "Battery numbers that mean something",
    category: "Engineering",
    readTime: "8 min",
    date: "2026-04-14",
    image: u("1609091839311-d5365f9ff1c5"),
    excerpt:
      "Published runtime figures are usually best-case fiction. We publish ours at 50% volume with ANC on.",
    body: [
      "There is no legal standard for how a headphone manufacturer measures battery life, which means every published figure is measured under whatever conditions flatter it most.",
      "We publish two numbers: an idealised figure at 50% volume with ANC off, and a realistic figure at 70% volume with ANC on. The second is the one printed on the box.",
      "Cells degrade. At 500 cycles our packs retain 84% of rated capacity, and we will sell you a replacement cell rather than a replacement product.",
    ],
  },
  {
    slug: "packaging-without-the-theatre",
    title: "Packaging without the theatre",
    category: "Process",
    readTime: "5 min",
    date: "2026-03-22",
    image: u("1607083206968-13611e3d76db"),
    excerpt: "How we cut 62% of packaging mass without turning unboxing into an apology.",
    body: [
      "Unboxing theatre is a cost passed to the customer and to the landfill. But bad packaging damages product, which is worse.",
      "Our current boxes are moulded pulp with a printed sleeve, no plastic film, no foam. Mass is down 62% against our 2023 boxes and damage-in-transit is down slightly.",
      "The trade-off is that the box is less impressive on camera. We decided we could live with that.",
    ],
  },
  {
    slug: "repairability-scores",
    title: "What our repairability score actually measures",
    category: "Engineering",
    readTime: "7 min",
    date: "2026-02-09",
    image: u("1581092160562-40aa08e78837"),
    excerpt: "Screws instead of glue, published part numbers, and a five-year spares commitment.",
    body: [
      "Repairability is mostly a fastener decision made two years before a product ships.",
      "Every Aperture product uses threaded fasteners in place of structural adhesive wherever the sealing requirement allows it. Where we use adhesive, we publish the solvent and the temperature.",
      "We commit to stocking spares for five years after a product leaves the catalogue.",
    ],
  },
  {
    slug: "field-notes-tokyo",
    title: "Field notes: three days of listening in Tokyo",
    category: "Field",
    readTime: "9 min",
    date: "2026-01-17",
    image: u("1540959733332-eab4deabeeaf"),
    excerpt:
      "Testing cancellation performance against the Yamanote line, a konbini fridge, and a pachinko parlour.",
    body: [
      "Lab noise profiles are clean. Real noise is not. We took six pre-production units to Tokyo to find out where the cancellation model falls apart.",
      "The Yamanote line at rush hour produced the broadest low-frequency load. A pachinko parlour produced the hardest transients, and exposed a 40ms lag in our adaptive loop.",
      "That lag is now 11ms. The trip paid for itself in a single afternoon of recordings.",
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const testimonials = [
  {
    name: "Rina Alvarez",
    role: "Sound designer",
    rating: 5,
    quote:
      "The Field 02 is the first closed-back I've trusted for rough mixes on the road. Nothing is flattered.",
  },
  {
    name: "Tomas Berg",
    role: "Industrial designer",
    rating: 5,
    quote:
      "Every edge is intentional. You can feel where the machining stopped and the finishing began.",
  },
  {
    name: "Priya Nandakumar",
    role: "Endurance athlete",
    rating: 4,
    quote: "Fourteen days on the Signal Watch is not a marketing figure. I've measured it twice.",
  },
  {
    name: "Elias Fournier",
    role: "Photographer",
    rating: 5,
    quote: "The Prime 35 mount clamps hard enough that I stopped worrying about it mid-shoot.",
  },
  {
    name: "Wen Li",
    role: "Software engineer",
    rating: 5,
    quote: "Index 65 is the only board I've owned where the stock configuration needed no modding.",
  },
  {
    name: "Aoife Doherty",
    role: "Architect",
    rating: 4,
    quote: "Halo Lamp renders material samples honestly. CRI 97 is not a rounding error.",
  },
];

export const faqs = [
  {
    group: "Orders & Shipping",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery is 2–4 business days domestically and 5–9 days internationally. Orders placed before 14:00 ship the same day.",
      },
      {
        q: "Is shipping free?",
        a: "Shipping is free on all orders over $75. Below that, flat-rate shipping is $6.50.",
      },
      {
        q: "Can I change my address after ordering?",
        a: "Yes, until the order enters the Packed stage. Use the Track Order link in your confirmation email.",
      },
      {
        q: "Do you offer Cash on Delivery?",
        a: "Cash on Delivery is available on domestic orders up to $600. A signature is required at handover.",
      },
    ],
  },
  {
    group: "Returns",
    items: [
      {
        q: "What is the return window?",
        a: "30 days from delivery, unused and in original packaging. Opened audio products are accepted if hygiene seals are intact.",
      },
      {
        q: "Who pays return shipping?",
        a: "We do, for faults and for first exchanges. Change-of-mind returns are $8 deducted from the refund.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are issued within 3 business days of the return being scanned at our warehouse.",
      },
    ],
  },
  {
    group: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "Visa, Mastercard, Amex, Apple Pay, Google Pay, and Cash on Delivery on eligible orders.",
      },
      {
        q: "Can I pay in instalments?",
        a: "Three-payment instalments are available at checkout on orders between $150 and $2,000.",
      },
      {
        q: "Is my card stored?",
        a: "Card details never touch our servers. Tokenisation is handled by our payment processor.",
      },
    ],
  },
  {
    group: "Products",
    items: [
      {
        q: "What warranty do products carry?",
        a: "One year as standard, extendable to three years free of charge if you register within 30 days.",
      },
      {
        q: "Do you sell spare parts?",
        a: "Yes. Ear pads, cells, cables and clamps are stocked for five years after a product is discontinued.",
      },
      {
        q: "Are firmware updates required?",
        a: "No. Products are fully functional out of the box; updates are optional and reversible.",
      },
    ],
  },
];

export const instagramShots = [
  u("1484704849700-f032a568e944", 600),
  u("1546435770-a3e426bf472b", 600),
  u("1511707171634-5f897ff02aa9", 600),
  u("1600294037681-c80b4cb5b434", 600),
  u("1524678606370-a47ad25cb82a", 600),
  u("1517336714731-489689fd1ca8", 600),
  u("1526170375885-4d8ecf77b99f", 600),
  u("1542751371-adc38448a05e", 600),
];
