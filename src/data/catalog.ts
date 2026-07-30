/** Shared storefront types and rich fallback data when API is loading or offline. */

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
  videos?: string[];
  /** Ordered gallery (images + videos). Prefer this on PDP when present. */
  gallery?: { url: string; type: "image" | "video" }[];
  /** Mobile-only preview clip below description. */
  previewVideo?: string;
  /** Shipping & returns copy. Empty hides the section. */
  shippingInfo?: string;
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

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const pkr = (usd: number) => Math.round(usd * 280);

export const sampleVideos = {
  headphones: "https://assets.mixkit.co/videos/preview/mixkit-headphones-on-a-table-41584-large.mp4",
  smartwatch: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-smartwatch-display-43403-large.mp4",
  keyboard: "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-mechanical-keyboard-41589-large.mp4",
  camera: "https://assets.mixkit.co/videos/preview/mixkit-camera-lens-zooming-in-41583-large.mp4",
  studio: "https://assets.mixkit.co/videos/preview/mixkit-recording-studio-soundboard-41586-large.mp4",
};

export const FALLBACK_CATEGORIES: Category[] = [
  {
    slug: "audio",
    name: "Audio",
    blurb: "Reference headphones, ANC earbuds, wireless monitors",
    image: u("1505740420928-5e560c06d30e", 900),
  },
  {
    slug: "wearables",
    name: "Wearables",
    blurb: "Titanium smartwatches and biometrics rings",
    image: u("1523275335684-37898b6baf30", 900),
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    blurb: "Tunable lighting, environmental sensors, hubs",
    image: u("1558089687-f282ffcbc126", 900),
  },
  {
    slug: "desk",
    name: "Desk Setup",
    blurb: "Custom mechanical keyboards, precision mice, mounts",
    image: u("1587829741301-dc798b83add3", 900),
  },
  {
    slug: "cameras",
    name: "Optics & Capture",
    blurb: "Mobile lens mounts, anamorphic optics, accessories",
    image: u("1516035069371-29a1b244cc32", 900),
  },
  {
    slug: "accessories",
    name: "Power & Carry",
    blurb: "GaN fast chargers, EVA moulded cases, cables",
    image: u("1585298723682-7115561c51b7", 900),
  },
];

const colorSet = (a: string, b: string): Variant[] => [
  { id: `c1-${a}`, label: a, type: "color", value: a },
  { id: `c2-${b}`, label: b, type: "color", value: b },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    slug: "aperture-one-earbuds",
    name: "Aperture One ANC Earbuds",
    brand: "APERTURE",
    category: "audio",
    categories: ["audio"],
    price: pkr(249),
    compareAt: pkr(299),
    rating: 4.9,
    reviewCount: 5,
    images: [
      u("1590658268037-6bf12165a8df"),
      u("1606220945770-b5b6c2c55bf1"),
      u("1572569511254-d8f925fe2cbb"),
      u("1505740420928-5e560c06d30e"),
    ],
    videos: [sampleVideos.headphones],
    previewVideo: sampleVideos.headphones,
    gallery: [
      { url: u("1590658268037-6bf12165a8df"), type: "image" },
      { url: sampleVideos.headphones, type: "video" },
      { url: u("1606220945770-b5b6c2c55bf1"), type: "image" },
      { url: u("1572569511254-d8f925fe2cbb"), type: "image" },
    ],
    short: "Adaptive ANC earbuds with a 12mm graphene driver and 32h case runtime.",
    description:
      "Aperture One is engineered in an acoustically treated studio environment. A 12mm custom graphene diaphragm delivers deep, controlled sub-bass without sacrificing midrange clarity. Active Noise Cancellation neutralizes low-frequency ambient noise down to -42dB.",
    shippingInfo:
      "Free express delivery across Pakistan in 2–3 business days. Includes 30-day trial and 1-year studio replacement warranty.",
    specs: [
      { label: "Driver size", value: "12mm Graphene Diaphragm" },
      { label: "ANC Depth", value: "-42dB Adaptive Active Noise Cancellation" },
      { label: "Battery Life", value: "8h earbuds + 24h charging case (32h total)" },
      { label: "Bluetooth", value: "v5.4 / LE Audio / AAC / aptX Adaptive" },
      { label: "Water Resistance", value: "IPX5 Splashproof" },
    ],
    flags: ["hot"],
    inStock: true,
    stock: 35,
    soldCount: 120,
    colors: colorSet("Matte Black", "Chalk White"),
    reviews: [
      {
        id: "r1",
        author: "Tariq Malik",
        rating: 5,
        date: "2026-07-25",
        title: "Phenomenal build quality & sound accuracy",
        body: "Purchased Aperture One after reading the specifications online. Delivery to Lahore took just 2 days. The unboxing experience felt like opening a precision instrument. Sound and finish exceed expectations.",
        images: [u("1590658268037-6bf12165a8df")],
        videos: [sampleVideos.headphones],
      },
      {
        id: "r2",
        author: "Zainab Ahmed",
        rating: 5,
        date: "2026-07-20",
        title: "True to advertised specs",
        body: "Rarely do tech products match their claimed battery and material specs. This one actually delivers. Extremely comfortable for daily long hours.",
        images: [u("1606220945770-b5b6c2c55bf1")],
      },
      {
        id: "r3",
        author: "Hamza Raza",
        rating: 5,
        date: "2026-07-15",
        title: "Sleek monochrome aesthetic",
        body: "Looks stunning on my desk. Premium tactile feedback and build. Cash on Delivery was smooth and fast.",
      },
    ],
  },
  {
    slug: "field-over-ear",
    name: "Field 02 Reference Headphones",
    brand: "APERTURE",
    category: "audio",
    categories: ["audio"],
    price: pkr(429),
    compareAt: pkr(489),
    rating: 4.8,
    reviewCount: 4,
    images: [
      u("1583394838336-acd977736f90"),
      u("1618366712010-f4ae9c647dcb"),
      u("1546435770-a3e426bf472b"),
    ],
    videos: [sampleVideos.headphones],
    previewVideo: sampleVideos.headphones,
    gallery: [
      { url: u("1583394838336-acd977736f90"), type: "image" },
      { url: sampleVideos.headphones, type: "video" },
      { url: u("1618366712010-f4ae9c647dcb"), type: "image" },
    ],
    short: "Closed-back studio reference headphones with 60h runtime and replaceable memory foam pads.",
    description:
      "Field 02 is built for audio professionals and audiophiles who demand true flat response on the move. Featuring 40mm beryllium-coated drivers and memory foam acoustic seals wrapped in breathable microfiber fabric.",
    shippingInfo:
      "Ships same business day. Free express courier delivery with tracking across Pakistan. 1-year local warranty included.",
    specs: [
      { label: "Driver", value: "40mm Beryllium-coated dynamic driver" },
      { label: "Battery", value: "60 Hours (ANC On)" },
      { label: "Weight", value: "268g lightweight aluminium" },
      { label: "Cable", value: "3.5mm coiled studio cable included" },
    ],
    sizes: [
      { id: "s1", label: "Standard Pad", type: "size" },
      { id: "s2", label: "Plush Velvet Pad", type: "size" },
    ],
    flags: ["new"],
    inStock: true,
    stock: 30,
    soldCount: 85,
    colors: colorSet("Graphite Grey", "Starlight Silver"),
    reviews: [
      {
        id: "r4",
        author: "Rina Alvarez",
        rating: 5,
        date: "2026-07-22",
        title: "The ultimate traveling monitor",
        body: "The Field 02 is the first closed-back I've trusted for rough mixes on the road. The acoustic seal and detail retreival are outstanding.",
        images: [u("1583394838336-acd977736f90")],
      },
    ],
  },
  {
    slug: "signal-watch",
    name: "Signal Watch Series 02",
    brand: "APERTURE",
    category: "wearables",
    categories: ["wearables"],
    price: pkr(379),
    compareAt: pkr(449),
    rating: 4.9,
    reviewCount: 6,
    images: [
      u("1523275335684-37898b6baf30"),
      u("1508685096489-7aacd43bd3b1"),
      u("1434493789847-2f02dc6ca35d"),
    ],
    videos: [sampleVideos.smartwatch],
    previewVideo: sampleVideos.smartwatch,
    gallery: [
      { url: u("1523275335684-37898b6baf30"), type: "image" },
      { url: sampleVideos.smartwatch, type: "video" },
      { url: u("1508685096489-7aacd43bd3b1"), type: "image" },
    ],
    short: "Titanium smartwatch with a 14-day battery duty cycle and transflective sapphire display.",
    description:
      "Crafted from Grade-5 aerospace titanium and sapphire crystal glass. Features always-on transflective display technology legible in direct sunlight, 100m water resistance, multi-band GPS, and comprehensive biometric tracking.",
    shippingInfo: "Dispatched via insured express shipping. Cash on Delivery supported.",
    specs: [
      { label: "Case Material", value: "Grade-5 Aerospace Titanium" },
      { label: "Display", value: "1.4” Transflective Sapphire Crystal" },
      { label: "Battery Life", value: "14 Days typical usage" },
      { label: "Water Rating", value: "10 ATM (100 Meters)" },
    ],
    sizes: [
      { id: "w1", label: "40mm Titanium Case", type: "size" },
      { id: "w2", label: "44mm Titanium Case", type: "size" },
    ],
    flags: ["hot"],
    inStock: true,
    stock: 35,
    soldCount: 140,
    colors: colorSet("Graphite Titanium", "Raw Titanium"),
    reviews: [
      {
        id: "r5",
        author: "Priya Nandakumar",
        rating: 5,
        date: "2026-07-24",
        title: "14 days battery life is real!",
        body: "Fourteen days on the Signal Watch is not a marketing figure. I've measured it twice on mountain expeditions.",
        images: [u("1523275335684-37898b6baf30")],
      },
    ],
  },
  {
    slug: "trace-ring",
    name: "Trace Biometric Smart Ring",
    brand: "APERTURE",
    category: "wearables",
    categories: ["wearables"],
    price: pkr(289),
    rating: 4.7,
    reviewCount: 4,
    images: [
      u("1611591437281-460bfbe1220a"),
      u("1602173574767-37ac01994b2a"),
      u("1515562141207-7a88fb7ce338"),
    ],
    videos: [sampleVideos.smartwatch],
    previewVideo: sampleVideos.smartwatch,
    gallery: [
      { url: u("1611591437281-460bfbe1220a"), type: "image" },
      { url: sampleVideos.smartwatch, type: "video" },
    ],
    short: "Continuous sleep, HRV, and recovery tracking inside 3.4g of zirconia ceramic.",
    description:
      "No screen, no intrusive vibrations. Trace Ring discreetly records heart rate variability, skin temperature drift, and sleep architecture in a scratch-resistant zirconia ceramic chassis.",
    shippingInfo: "Includes complimentary sizing kit before final ring dispatch.",
    specs: [
      { label: "Chassis", value: "Zirconia Ceramic with Titanium Inner Lining" },
      { label: "Weight", value: "3.4 grams" },
      { label: "Battery Life", value: "7 Days on single charge" },
    ],
    sizes: [
      { id: "tr8", label: "Size 8", type: "size" },
      { id: "tr10", label: "Size 10", type: "size" },
      { id: "tr12", label: "Size 12", type: "size" },
    ],
    flags: ["new"],
    inStock: true,
    stock: 30,
    soldCount: 65,
    colors: colorSet("Ceramic Black", "Stealth Grey"),
    reviews: [],
  },
  {
    slug: "halo-lamp",
    name: "Halo Smart Desk Lamp",
    brand: "APERTURE",
    category: "smart-home",
    categories: ["smart-home"],
    price: pkr(199),
    compareAt: pkr(229),
    rating: 4.8,
    reviewCount: 4,
    images: [
      u("1507473885765-e6ed057f782c"),
      u("1524758631624-e2822e304c36"),
      u("1513506003901-1e6a229e2d15"),
    ],
    videos: [sampleVideos.studio],
    previewVideo: sampleVideos.studio,
    gallery: [
      { url: u("1507473885765-e6ed057f782c"), type: "image" },
      { url: sampleVideos.studio, type: "video" },
    ],
    short: "Tunable 2200K–6500K desk light with CRI 97 rating and physical knurled dimmer ring.",
    description:
      "Halo Lamp reproduces natural sunlight to eliminate eye fatigue during long desk sessions. Knurled aluminum dial for instant tactile brightness and color temperature adjustment.",
    specs: [
      { label: "Color Rendering Index", value: "CRI 97 High Spectrum" },
      { label: "Color Temp", value: "2200K Warm – 6500K Daylight" },
      { label: "Connectivity", value: "Matter over Thread & HomeKit" },
    ],
    flags: [],
    inStock: true,
    stock: 40,
    soldCount: 90,
    colors: colorSet("Anodized Black", "Silver Aluminium"),
    reviews: [],
  },
  {
    slug: "index-keyboard",
    name: "Index 65 Mechanical Keyboard",
    brand: "APERTURE",
    category: "desk",
    categories: ["desk"],
    price: pkr(219),
    rating: 4.9,
    reviewCount: 7,
    images: [
      u("1587829741301-dc798b83add3"),
      u("1595225476474-87563907a212"),
      u("1618384887929-16ec33fab9ef"),
    ],
    videos: [sampleVideos.keyboard],
    previewVideo: sampleVideos.keyboard,
    gallery: [
      { url: u("1587829741301-dc798b83add3"), type: "image" },
      { url: sampleVideos.keyboard, type: "video" },
      { url: u("1595225476474-87563907a212"), type: "image" },
    ],
    short: "Gasket-mounted 65% mechanical keyboard with hot-swappable switches and PBT keycaps.",
    description:
      "Full CNC aluminum body featuring a leaf-spring gasket system, multi-layer acoustic PORON dampening foam, hot-swappable PCB, and tactile rotary volume dial.",
    shippingInfo: "Free shipping across Pakistan. Factory lubricated switches included.",
    specs: [
      { label: "Layout", value: "65% Compact (68 Keys)" },
      { label: "Mounting Style", value: "PORON Leaf-Spring Gasket" },
      { label: "Body", value: "Full CNC Machined Aluminium 1.1kg" },
      { label: "Switch Compatibility", value: "3-pin / 5-pin Hot-Swappable" },
    ],
    flags: ["hot"],
    inStock: true,
    stock: 30,
    soldCount: 160,
    colors: colorSet("Stealth Black", "Moon White"),
    reviews: [
      {
        id: "r6",
        author: "Kamran Siddiqui",
        rating: 5,
        date: "2026-07-21",
        title: "Best typing experience I have owned",
        body: "The gasket bounce and acoustic dampening make every keystroke feel sublime. Arrived in 2 days via COD.",
        images: [u("1587829741301-dc798b83add3")],
        videos: [sampleVideos.keyboard],
      },
    ],
  },
  {
    slug: "pivot-mouse",
    name: "Pivot Wireless Precision Mouse",
    brand: "APERTURE",
    category: "desk",
    categories: ["desk"],
    price: pkr(129),
    compareAt: pkr(149),
    rating: 4.7,
    reviewCount: 3,
    images: [
      u("1527864550417-7fd91fc51a46"),
      u("1615663245857-ac93bb7c39e7"),
      u("1563297007-0686b7003af7"),
    ],
    videos: [sampleVideos.keyboard],
    previewVideo: sampleVideos.keyboard,
    gallery: [
      { url: u("1527864550417-7fd91fc51a46"), type: "image" },
      { url: sampleVideos.keyboard, type: "video" },
    ],
    short: "26,000 DPI sensor, ultralight 58g body, magnetic fast charging puck.",
    description:
      "Low-latency wireless performance engineered for productivity and high-precision task execution. Ultra-lightweight shell and optical switches rated for 90 million clicks.",
    specs: [
      { label: "Sensor", value: "26,000 DPI Optical Sensor" },
      { label: "Weight", value: "58 grams" },
      { label: "Polling Rate", value: "1000Hz / 4000Hz supported" },
    ],
    flags: [],
    inStock: true,
    stock: 45,
    soldCount: 110,
    colors: colorSet("Matte Black", "Chalk White"),
    reviews: [],
  },
  {
    slug: "lens-35",
    name: "Prime 35 Anamorphic Lens",
    brand: "APERTURE",
    category: "cameras",
    categories: ["cameras"],
    price: pkr(349),
    rating: 4.9,
    reviewCount: 5,
    images: [
      u("1516035069371-29a1b244cc32"),
      u("1502920917128-1aa500764cbd"),
      u("1510127034890-ba27508e9f1c"),
    ],
    videos: [sampleVideos.camera],
    previewVideo: sampleVideos.camera,
    gallery: [
      { url: u("1516035069371-29a1b244cc32"), type: "image" },
      { url: sampleVideos.camera, type: "video" },
    ],
    short: "Machined phone lens adapter with true 35mm multi-coated optical elements.",
    description:
      "Transform mobile video capture with organic flare, cinematic 1.33x anamorphic squeeze, and pin-sharp edge-to-edge resolution housed in aviation aluminium.",
    specs: [
      { label: "Focal Equivalent", value: "35mm Anamorphic" },
      { label: "Glass Construction", value: "6 Multicoated Glass Elements in 4 Groups" },
      { label: "Mount", value: "Universal Machined Aluminium Clamp" },
    ],
    flags: ["new"],
    inStock: true,
    stock: 25,
    soldCount: 75,
    colors: colorSet("Black Aluminium", "Raw Silver"),
    reviews: [],
  },
  {
    slug: "power-brick",
    name: "Cell 100W GaN Fast Charger",
    brand: "APERTURE",
    category: "accessories",
    categories: ["accessories"],
    price: pkr(79),
    compareAt: pkr(99),
    rating: 4.8,
    reviewCount: 4,
    images: [
      u("1583863788434-e58a36330cf0"),
      u("1618410320928-25228d811631"),
      u("1600490036275-35f5f1656861"),
    ],
    videos: [sampleVideos.studio],
    previewVideo: sampleVideos.studio,
    gallery: [
      { url: u("1583863788434-e58a36330cf0"), type: "image" },
      { url: sampleVideos.studio, type: "video" },
    ],
    short: "Gallium Nitride 100W power delivery charger with 4 intelligent power ports.",
    description:
      "Ultra-compact GaN charger capable of powering a laptop, phone, watch, and earbuds simultaneously with dynamic power allocation.",
    specs: [
      { label: "Max Output", value: "100W Total Output" },
      { label: "Ports", value: "2x USB-C Power Delivery, 2x USB-A QC 3.0" },
      { label: "Technology", value: "GaN III (Gallium Nitride)" },
    ],
    flags: ["hot"],
    inStock: true,
    stock: 50,
    soldCount: 210,
    colors: colorSet("Dark Charcoal", "Matte White"),
    reviews: [],
  },
  {
    slug: "carry-case",
    name: "Carry Case 03 Tech Pouch",
    brand: "APERTURE",
    category: "accessories",
    categories: ["accessories"],
    price: pkr(59),
    rating: 4.6,
    reviewCount: 3,
    images: [
      u("1585298723682-7115561c51b7"),
      u("1553062407-98eeb64c6a62"),
      u("1591561954557-26941169b49e"),
    ],
    short: "Weatherproof 600D molded EVA storage case for cables, power banks, and accessories.",
    description:
      "Internal custom dividers, elastic organizers, and weather-sealed YKK zippers keep tech gear organized and protected.",
    specs: [
      { label: "Outer Shell", value: "600D Water-Resistant Ballistic Nylon" },
      { label: "Inner Structure", value: "Molded EVA Protective Shell" },
      { label: "Zippers", value: "Weather-Sealed YKK #5" },
    ],
    flags: [],
    inStock: true,
    stock: 40,
    soldCount: 95,
    colors: colorSet("Midnight Black", "Heather Grey"),
    reviews: [],
  },
  {
    slug: "quiet-sensor",
    name: "Quiet Air Quality & Environment Sensor",
    brand: "APERTURE",
    category: "smart-home",
    categories: ["smart-home"],
    price: pkr(89),
    compareAt: pkr(109),
    rating: 4.6,
    reviewCount: 3,
    images: [
      u("1558089687-f282ffcbc126"),
      u("1585771724684-38269d6639fd"),
      u("1544428571-affb0ff33ca4"),
    ],
    short: "Real-time PM2.5, VOC, CO2, temperature and humidity monitoring block.",
    description:
      "Discreet matte block sensor tracking air purity metrics locally over Matter and Thread protocol.",
    specs: [
      { label: "Sensors", value: "PM2.5, VOCs, CO2, Humidity, Temp" },
      { label: "Protocol", value: "Matter over Thread & Bluetooth LE" },
    ],
    flags: [],
    inStock: true,
    stock: 20,
    soldCount: 50,
    colors: colorSet("Matte Slate", "Clean Chalk"),
    reviews: [],
  },
  {
    slug: "monitor-arm",
    name: "Arm 01 Heavy Duty Monitor Arm",
    brand: "APERTURE",
    category: "desk",
    categories: ["desk"],
    price: pkr(169),
    rating: 4.7,
    reviewCount: 4,
    images: [
      u("1527443224154-c4a3942d3acf"),
      u("1593642532744-d377ab507dc8"),
      u("1547082299-de196ea013d6"),
    ],
    short: "Gas-spring desk mount supporting up to 9kg with internal cable routing channels.",
    description:
      "Cold-rolled steel arm built to support ultrawide monitors. Counterbalanced gas spring mechanism guarantees smooth, effortless motion.",
    specs: [
      { label: "Weight Support", value: "3kg to 9kg" },
      { label: "Maximum Reach", value: "620mm reach, 450mm height adjust" },
      { label: "VESA Mount", value: "75x75mm & 100x100mm Compatible" },
    ],
    flags: [],
    inStock: true,
    stock: 25,
    soldCount: 70,
    colors: colorSet("Stealth Black", "Silver Anodized"),
    reviews: [],
  },
];

export const FALLBACK_TESTIMONIALS = [
  {
    _id: "t1",
    name: "Rina Alvarez",
    role: "Lead Audio Producer",
    rating: 5,
    quote: "The Field 02 headphones are the first closed-backs I genuinely trust for final mixing sessions on tour.",
    image: u("1534528741775-53994a69daeb", 300),
    row: 1,
  },
  {
    _id: "t2",
    name: "Tomas Berg",
    role: "Industrial Hardware Engineer",
    rating: 5,
    quote: "Every edge and chamfer is intentional. You can instantly feel the precision CNC machining quality.",
    image: u("1507003211169-0a1dd7228f2d", 300),
    row: 1,
  },
  {
    _id: "t3",
    name: "Priya Nandakumar",
    role: "Endurance Athlete & Creator",
    rating: 5,
    quote: "14 days battery life on the Signal Watch is not marketing fluff. It survived two weeks in the mountains effortlessly.",
    image: u("1573496359142-b8d87734a5a2", 300),
    row: 1,
  },
  {
    _id: "t4",
    name: "Kamran Siddiqui",
    role: "Senior Software Architect",
    rating: 5,
    quote: "The Index 65 keyboard acoustics and typing feel are unbelievable. Fast delivery in Lahore via COD!",
    image: u("1500648767791-00dcc994a43e", 300),
    row: 2,
  },
  {
    _id: "t5",
    name: "Ayesha Malik",
    role: "Creative Director",
    rating: 5,
    quote: "Clean, minimal aesthetic with zero cheap plastic. Tech Gadgets PK is my go-to for desk gear.",
    image: u("1534528741775-53994a69daeb", 300),
    row: 2,
  },
  {
    _id: "t6",
    name: "Shahid Khan",
    role: "Cinematographer",
    rating: 5,
    quote: "The Prime 35 lens adapter produces incredible anamorphic flares on mobile shoots. Super impressive glass.",
    image: u("1507003211169-0a1dd7228f2d", 300),
    row: 2,
  },
];
