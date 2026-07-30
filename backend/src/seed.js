import "dotenv/config";
import { connectDB } from "./config/db.js";
import Admin from "./models/Admin.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Review from "./models/Review.js";
import Journal from "./models/Journal.js";
import SiteSettings from "./models/SiteSettings.js";
import PageContent from "./models/PageContent.js";
import Faq from "./models/Faq.js";
import Testimonial from "./models/Testimonial.js";

const u = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const pkr = (usd) => Math.round(usd * 280);

const sampleVideos = {
  headphones: "https://assets.mixkit.co/videos/preview/mixkit-headphones-on-a-table-41584-large.mp4",
  smartwatch: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-smartwatch-display-43403-large.mp4",
  keyboard: "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-mechanical-keyboard-41589-large.mp4",
  camera: "https://assets.mixkit.co/videos/preview/mixkit-camera-lens-zooming-in-41583-large.mp4",
  studio: "https://assets.mixkit.co/videos/preview/mixkit-recording-studio-soundboard-41586-large.mp4",
};

async function seed() {
  await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/focus-frame-store");

  console.log("Clearing existing database collections...");
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Journal.deleteMany({}),
    Faq.deleteMany({}),
    Testimonial.deleteMany({}),
    PageContent.deleteMany({}),
    SiteSettings.deleteMany({}),
  ]);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@aperture.tech";
  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    admin = await Admin.create({
      name: process.env.ADMIN_NAME || "Aperture Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "Admin@12345",
      role: "superadmin",
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Admin exists: ${adminEmail}`);
  }

  const trendingSlugs = [
    "aperture-one-earbuds",
    "field-over-ear",
    "signal-watch",
    "index-keyboard",
    "lens-35",
    "halo-lamp",
  ];

  await SiteSettings.create({
    key: "main",
    brandName: "Tech Gadgets PK",
    tagline: "Precision Tech, Strictly Monochrome",
    announcement: "Free express shipping over Rs 20,000 · Cash on Delivery available across Pakistan",
    contact: {
      email: "support@aperture.tech",
      phone: "+92 300 1234567",
      whatsapp: "+92 300 1234567",
      hours: "Mon–Fri, 09:00–17:30 PKT",
      address: "MM Alam Road, Gulberg III, Lahore, Pakistan",
    },
    social: {
      instagram: "https://instagram.com/aperture",
      facebook: "https://facebook.com/aperture",
      twitter: "https://x.com/aperture",
      youtube: "https://youtube.com/@aperture",
      tiktok: "https://tiktok.com/@aperture",
      linkedin: "https://linkedin.com/company/aperture",
    },
    payment: {
      codEnabled: true,
      onlineEnabled: true,
      online: {
        accountName: "Tech Gadgets PK",
        accountNumber: "0123456789",
        bankName: "Habib Bank Limited (HBL)",
        iban: "PK00HABB0000001234567890",
        instructions:
          "Transfer the total amount to our HBL account or scan the QR code. Mention your order number in reference.",
        qrImage: u("1583863788434-e58a36330cf0", 600),
      },
    },
    shipping: {
      freeThreshold: 20000,
      flatFee: 250,
      giftFee: 500,
      currency: "PKR",
    },
    help: {
      callLabel: "Call us",
      whatsappLabel: "WhatsApp Support",
      helpText:
        "Need instant help with your order? Call us directly or message our WhatsApp support line — available Mon–Fri, 9am–5:30pm PKT.",
    },
    trendingProductSlugs: trendingSlugs,
    instagramShots: [
      u("1505740420928-5e560c06d30e", 600),
      u("1523275335684-37898b6baf30", 600),
      u("1587829741301-dc798b83add3", 600),
      u("1516035069371-29a1b244cc32", 600),
      u("1583394838336-acd977736f90", 600),
      u("1507473885765-e6ed057f782c", 600),
      u("1611591437281-460bfbe1220a", 600),
      u("1585298723682-7115561c51b7", 600),
    ],
  });

  const catData = [
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
  const categories = await Category.insertMany(catData.map((c, i) => ({ ...c, sortOrder: i })));
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const colorSet = (a, b) => [
    { label: a, type: "color", value: a, stock: 25 },
    { label: b, type: "color", value: b, stock: 25 },
  ];

  const productsRaw = [
    {
      slug: "aperture-one-earbuds",
      name: "Aperture One ANC Earbuds",
      brand: "APERTURE",
      category: "audio",
      price: pkr(249),
      compareAt: pkr(299),
      saleDiscountPercent: 17,
      rating: 4.9,
      reviewCount: 5,
      images: [
        u("1590658268037-6bf12165a8df"),
        u("1606220945770-b5b6c2c55bf1"),
        u("1572569511254-d8f925fe2cbb"),
        u("1505740420928-5e560c06d30e"),
      ],
      video: sampleVideos.headphones,
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
      flags: ["hot", "sale"],
      stock: 35,
      colors: colorSet("Matte Black", "Chalk White"),
    },
    {
      slug: "field-over-ear",
      name: "Field 02 Reference Headphones",
      brand: "APERTURE",
      category: "audio",
      price: pkr(429),
      compareAt: pkr(489),
      saleDiscountPercent: 12,
      rating: 4.8,
      reviewCount: 4,
      images: [
        u("1583394838336-acd977736f90"),
        u("1618366712010-f4ae9c647dcb"),
        u("1546435770-a3e426bf472b"),
      ],
      video: sampleVideos.headphones,
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
        { label: "Standard Pad", type: "size", stock: 20 },
        { label: "Plush Velvet Pad", type: "size", stock: 15 },
      ],
      flags: ["new"],
      stock: 35,
      colors: colorSet("Graphite Grey", "Starlight Silver"),
    },
    {
      slug: "signal-watch",
      name: "Signal Watch Series 02",
      brand: "APERTURE",
      category: "wearables",
      price: pkr(379),
      compareAt: pkr(449),
      saleDiscountPercent: 16,
      rating: 4.9,
      reviewCount: 6,
      images: [
        u("1523275335684-37898b6baf30"),
        u("1508685096489-7aacd43bd3b1"),
        u("1434493789847-2f02dc6ca35d"),
      ],
      video: sampleVideos.smartwatch,
      short: "Titanium smartwatch with a 14-day battery duty cycle and transflective sapphire display.",
      description:
        "Crafted from Grade-5 aerospace titanium and sapphire crystal glass. Features always-on transflective display technology legible in direct sunlight, 100m water resistance, multi-band GPS, and comprehensive biometric tracking.",
      shippingInfo:
        "Dispatched via insured express shipping. Cash on Delivery supported.",
      specs: [
        { label: "Case Material", value: "Grade-5 Aerospace Titanium" },
        { label: "Display", value: "1.4” Transflective Sapphire Crystal" },
        { label: "Battery Life", value: "14 Days typical usage" },
        { label: "Water Rating", value: "10 ATM (100 Meters)" },
      ],
      sizes: [
        { label: "40mm Titanium Case", type: "size", stock: 15 },
        { label: "44mm Titanium Case", type: "size", stock: 20 },
      ],
      flags: ["hot", "sale"],
      stock: 35,
      colors: colorSet("Graphite Titanium", "Raw Titanium"),
    },
    {
      slug: "trace-ring",
      name: "Trace Biometric Smart Ring",
      brand: "APERTURE",
      category: "wearables",
      price: pkr(289),
      rating: 4.7,
      reviewCount: 4,
      images: [
        u("1611591437281-460bfbe1220a"),
        u("1602173574767-37ac01994b2a"),
        u("1515562141207-7a88fb7ce338"),
      ],
      video: sampleVideos.smartwatch,
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
        { label: "Size 8", type: "size", stock: 10 },
        { label: "Size 10", type: "size", stock: 10 },
        { label: "Size 12", type: "size", stock: 10 },
      ],
      flags: ["new"],
      stock: 30,
      colors: colorSet("Ceramic Black", "Stealth Grey"),
    },
    {
      slug: "halo-lamp",
      name: "Halo Smart Desk Lamp",
      brand: "APERTURE",
      category: "smart-home",
      price: pkr(199),
      compareAt: pkr(229),
      saleDiscountPercent: 13,
      rating: 4.8,
      reviewCount: 4,
      images: [
        u("1507473885765-e6ed057f782c"),
        u("1524758631624-e2822e304c36"),
        u("1513506003901-1e6a229e2d15"),
      ],
      video: sampleVideos.studio,
      short: "Tunable 2200K–6500K desk light with CRI 97 rating and physical knurled dimmer ring.",
      description:
        "Halo Lamp reproduces natural sunlight to eliminate eye fatigue during long desk sessions. Knurled aluminum dial for instant tactile brightness and color temperature adjustment.",
      specs: [
        { label: "Color Rendering Index", value: "CRI 97 High Spectrum" },
        { label: "Color Temp", value: "2200K Warm – 6500K Daylight" },
        { label: "Connectivity", value: "Matter over Thread & HomeKit" },
      ],
      flags: ["sale"],
      stock: 40,
      colors: colorSet("Anodized Black", "Silver Aluminium"),
    },
    {
      slug: "index-keyboard",
      name: "Index 65 Mechanical Keyboard",
      brand: "APERTURE",
      category: "desk",
      price: pkr(219),
      rating: 4.9,
      reviewCount: 7,
      images: [
        u("1587829741301-dc798b83add3"),
        u("1595225476474-87563907a212"),
        u("1618384887929-16ec33fab9ef"),
      ],
      video: sampleVideos.keyboard,
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
      stock: 30,
      colors: colorSet("Stealth Black", "Moon White"),
    },
    {
      slug: "pivot-mouse",
      name: "Pivot Wireless Precision Mouse",
      brand: "APERTURE",
      category: "desk",
      price: pkr(129),
      compareAt: pkr(149),
      saleDiscountPercent: 13,
      rating: 4.7,
      reviewCount: 3,
      images: [
        u("1527864550417-7fd91fc51a46"),
        u("1615663245857-ac93bb7c39e7"),
        u("1563297007-0686b7003af7"),
      ],
      video: sampleVideos.keyboard,
      short: "26,000 DPI sensor, ultralight 58g body, magnetic fast charging puck.",
      description:
        "Low-latency wireless performance engineered for productivity and high-precision task execution. Ultra-lightweight shell and optical switches rated for 90 million clicks.",
      specs: [
        { label: "Sensor", value: "26,000 DPI Optical Sensor" },
        { label: "Weight", value: "58 grams" },
        { label: "Polling Rate", value: "1000Hz / 4000Hz supported" },
      ],
      flags: ["sale"],
      stock: 45,
      colors: colorSet("Matte Black", "Chalk White"),
    },
    {
      slug: "lens-35",
      name: "Prime 35 Anamorphic Lens",
      brand: "APERTURE",
      category: "cameras",
      price: pkr(349),
      rating: 4.9,
      reviewCount: 5,
      images: [
        u("1516035069371-29a1b244cc32"),
        u("1502920917128-1aa500764cbd"),
        u("1510127034890-ba27508e9f1c"),
      ],
      video: sampleVideos.camera,
      short: "Machined phone lens adapter with true 35mm multi-coated optical elements.",
      description:
        "Transform mobile video capture with organic flare, cinematic 1.33x anamorphic squeeze, and pin-sharp edge-to-edge resolution housed in aviation aluminium.",
      specs: [
        { label: "Focal Equivalent", value: "35mm Anamorphic" },
        { label: "Glass Construction", value: "6 Multicoated Glass Elements in 4 Groups" },
        { label: "Mount", value: "Universal Machined Aluminium Clamp" },
      ],
      flags: ["new"],
      stock: 25,
      colors: colorSet("Black Aluminium", "Raw Silver"),
    },
    {
      slug: "power-brick",
      name: "Cell 100W GaN Fast Charger",
      brand: "APERTURE",
      category: "accessories",
      price: pkr(79),
      compareAt: pkr(99),
      saleDiscountPercent: 20,
      rating: 4.8,
      reviewCount: 4,
      images: [
        u("1583863788434-e58a36330cf0"),
        u("1618410320928-25228d811631"),
        u("1600490036275-35f5f1656861"),
      ],
      video: sampleVideos.studio,
      short: "Gallium Nitride 100W power delivery charger with 4 intelligent power ports.",
      description:
        "Ultra-compact GaN charger capable of powering a laptop, phone, watch, and earbuds simultaneously with dynamic power allocation.",
      specs: [
        { label: "Max Output", value: "100W Total Output" },
        { label: "Ports", value: "2x USB-C Power Delivery, 2x USB-A QC 3.0" },
        { label: "Technology", value: "GaN III (Gallium Nitride)" },
      ],
      flags: ["hot", "sale"],
      stock: 50,
      colors: colorSet("Dark Charcoal", "Matte White"),
    },
    {
      slug: "carry-case",
      name: "Carry Case 03 Tech Pouch",
      brand: "APERTURE",
      category: "accessories",
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
      stock: 40,
      colors: colorSet("Midnight Black", "Heather Grey"),
    },
    {
      slug: "quiet-sensor",
      name: "Quiet Air Quality & Environment Sensor",
      brand: "APERTURE",
      category: "smart-home",
      price: pkr(89),
      compareAt: pkr(109),
      saleDiscountPercent: 18,
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
      flags: ["sale"],
      stock: 20,
      colors: colorSet("Matte Slate", "Clean Chalk"),
    },
    {
      slug: "monitor-arm",
      name: "Arm 01 Heavy Duty Monitor Arm",
      brand: "APERTURE",
      category: "desk",
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
      stock: 25,
      colors: colorSet("Stealth Black", "Silver Anodized"),
    },
  ];

  const products = [];
  for (const p of productsRaw) {
    const cat = bySlug[p.category];
    const galleryItems = (p.images || []).map((url) => ({ url, type: "image" }));
    if (p.video) {
      galleryItems.splice(1, 0, { url: p.video, type: "video" });
    }

    const doc = await Product.create({
      ...p,
      category: cat._id,
      categorySlug: cat.slug,
      categories: [cat._id],
      categorySlugs: [cat.slug],
      currency: "PKR",
      inStock: p.inStock !== false && (p.stock || 0) > 0,
      videos: p.video ? [p.video] : [],
      previewVideo: p.video || "",
      gallery: galleryItems,
      variants: [],
      ratingLocked: true,
    });
    products.push(doc);

    const sampleReviews = [
      {
        author: "Tariq Malik",
        rating: 5,
        title: "Phenomenal build quality & sound accuracy",
        body: `Purchased ${p.name} after reading the specifications online. Delivery to Lahore took just 2 days. The unboxing experience felt like opening a precision medical instrument. Sound and finish exceed expectations.`,
        images: [p.images[0]],
        videos: p.video ? [p.video] : [],
      },
      {
        author: "Zainab Ahmed",
        rating: 5,
        title: "True to advertised specs",
        body: "Rarely do tech products match their claimed battery and material specs. This one actually delivers. Extremely comfortable for daily long hours.",
        images: [p.images[1] || p.images[0]],
      },
      {
        author: "Hamza Raza",
        rating: 4,
        title: "Sleek monochrome aesthetic",
        body: "Looks stunning on my desk. Premium tactile feedback and build. Cash on Delivery was smooth and fast.",
        images: [],
      },
      {
        author: "Bilal Chaudhry",
        rating: 5,
        title: "Exceeded expectations!",
        body: "Great customer support on WhatsApp and rock solid performance. Highly recommended!",
        images: [],
      },
    ];

    for (const r of sampleReviews) {
      await Review.create({
        product: doc._id,
        ...r,
        isApproved: true,
        createdByAdmin: true,
        date: new Date(),
      });
    }
  }

  await Journal.insertMany([
    {
      slug: "why-we-tune-in-a-treated-room",
      title: "Why we tune every driver in an acoustically treated room",
      category: "Engineering",
      readTime: "6 min read",
      date: new Date("2026-06-18"),
      image: u("1478737270239-2f02b77fc618"),
      excerpt:
        "Most consumer audio products are voiced on laptops in open-plan offices. Here is what changes when sound design happens in calibrated space.",
      body: [
        "A room is a filter. Before a driver reaches a listener, the acoustic environment it was voiced in has already dictated its character.",
        "Our acoustics lab in Lahore is treated to an RT60 of 0.18 seconds across the vocal band with custom corner bass traps.",
      ],
      contentHtml: `<p>A room is a filter. Before a driver reaches a listener, the acoustic environment it was voiced in has already dictated its character.</p><p>Our acoustics lab is treated to an RT60 of 0.18 seconds across the vocal band with custom corner bass traps.</p>`,
    },
    {
      slug: "the-case-against-accent-colours",
      title: "The case for monochrome industrial design",
      category: "Design Philosophy",
      readTime: "4 min read",
      date: new Date("2026-05-30"),
      image: u("1517420704952-d9f39e95b43e"),
      excerpt:
        "Color is the easiest way to attract attention, but contrast, texture, and weight endure far longer.",
      body: ["Every accent hue is a new visual rule the viewer must process."],
      contentHtml: `<p>Every accent hue is a new visual rule the viewer must process. By focusing exclusively on anodized textures, matte surfaces, and precise geometry, our hardware remains timeless.</p>`,
    },
    {
      slug: "battery-numbers-that-mean-something",
      title: "Realistic battery benchmarks vs laboratory marketing",
      category: "Testing",
      readTime: "8 min read",
      date: new Date("2026-04-14"),
      image: u("1609091839311-d5365f9ff1c5"),
      excerpt:
        "Most advertised battery runtimes use 20% volume with all features disabled. We benchmark at 50% volume with Active Noise Cancellation enabled.",
      body: ["There is no single legal standard for measuring headphone battery endurance."],
      contentHtml: `<p>There is no single legal standard for measuring headphone battery endurance, leading to inflated claims across the industry.</p>`,
    },
  ]);

  const faqSeed = [
    {
      group: "Orders & Shipping",
      question: "How long does delivery take across Pakistan?",
      answer: "Orders are processed within 24 hours. Delivery takes 2–3 business days across Karachi, Lahore, Islamabad, Rawalpindi, and other major cities.",
    },
    {
      group: "Orders & Shipping",
      question: "Is shipping free?",
      answer: "Express shipping is completely FREE on all orders over Rs 20,000. Orders below Rs 20,000 carry a flat Rs 250 shipping fee.",
    },
    {
      group: "Orders & Shipping",
      question: "Do you offer Cash on Delivery (COD)?",
      answer: "Yes! Cash on Delivery is available nationwide across Pakistan. You can pay the courier rider upon package delivery.",
    },
    {
      group: "Returns & Warranty",
      question: "What is your return policy?",
      answer: "We offer a 30-day risk-free return window for unused products in original condition and packaging.",
    },
    {
      group: "Returns & Warranty",
      question: "What warranty comes with the hardware?",
      answer: "Every item includes a 1-Year Official Studio Warranty covering hardware manufacturing faults.",
    },
    {
      group: "Payments",
      question: "Which payment methods are accepted?",
      answer: "We accept Cash on Delivery (COD), Online Bank Transfers (HBL), and QR payments.",
    },
  ];
  await Faq.insertMany(faqSeed.map((f, i) => ({ ...f, sortOrder: i })));

  await Testimonial.insertMany([
    {
      name: "Rina Alvarez",
      role: "Lead Audio Producer",
      rating: 5,
      quote: "The Field 02 headphones are the first closed-backs I genuinely trust for final mixing sessions on tour.",
      image: u("1534528741775-53994a69daeb", 300),
      row: 1,
    },
    {
      name: "Tomas Berg",
      role: "Industrial Hardware Engineer",
      rating: 5,
      quote: "Every edge and chamfer is intentional. You can instantly feel the precision CNC machining quality.",
      image: u("1507003211169-0a1dd7228f2d", 300),
      row: 1,
    },
    {
      name: "Priya Nandakumar",
      role: "Endurance Athlete & Creator",
      rating: 5,
      quote: "14 days battery life on the Signal Watch is not marketing fluff. It survived two weeks in the mountains effortlessly.",
      image: u("1573496359142-b8d87734a5a2", 300),
      row: 1,
    },
    {
      name: "Kamran Siddiqui",
      role: "Senior Software Architect",
      rating: 5,
      quote: "The Index 65 keyboard acoustics and typing feel are unbelievable. Fast delivery in Lahore via COD!",
      image: u("1500648767791-00dcc994a43e", 300),
      row: 2,
    },
    {
      name: "Ayesha Malik",
      role: "Creative Director",
      rating: 5,
      quote: "Clean, minimal aesthetic with zero cheap plastic. Tech Gadgets PK is my go-to for desk gear.",
      image: u("1534528741775-53994a69daeb", 300),
      row: 2,
    },
    {
      name: "Shahid Khan",
      role: "Cinematographer",
      rating: 5,
      quote: "The Prime 35 lens adapter produces incredible anamorphic flares on mobile shoots. Super impressive glass.",
      image: u("1507003211169-0a1dd7228f2d", 300),
      row: 2,
    },
  ]);

  await PageContent.insertMany([
    {
      page: "home",
      title: "Home",
      sections: {
        hero: {
          autoplaySeconds: 5,
          slides: [
            {
              image: u("1505740420928-5e560c06d30e", 2000),
              eyebrow: "ACOUSTIC PRECISION",
              title: "Built to disappear into the work.",
              subtitle: "Audio, wearables, and desk hardware documented in full — priced in PKR.",
              linkUrl: "/shop?category=audio",
              linkText: "Shop Audio",
              theme: "dark",
            },
            {
              image: u("1523275335684-37898b6baf30", 2000),
              eyebrow: "TITANIUM WEARABLES",
              title: "Signal Watch Series 02",
              subtitle: "Grade-5 Titanium case, sapphire crystal, and 14-day duty cycle.",
              linkUrl: "/shop?category=wearables",
              linkText: "Explore Wearables",
              theme: "dark",
            },
            {
              image: u("1587829741301-dc798b83add3", 2000),
              eyebrow: "DESK ARCHITECTURE",
              title: "Index 65 Gasket Keyboard",
              subtitle: "Machined aluminium shell, hot-swappable gasket mount with dye-sub keycaps.",
              linkUrl: "/shop?category=desk",
              linkText: "Shop Desk Hardware",
              theme: "dark",
            },
            {
              image: u("1516035069371-29a1b244cc32", 2000),
              eyebrow: "CINEMATIC OPTICS",
              title: "Prime 35 Anamorphic Lens",
              subtitle: "Machined phone lens mount with true 35mm multicoated glass element.",
              linkUrl: "/shop?category=cameras",
              linkText: "View Optics",
              theme: "dark",
            },
          ],
        },
        flashSale: {
          visible: true,
          eyebrow: "LIMITED RELEASE FLASH SALE",
          title: "Up to 20% Off Flagship Products · Free Express Shipping Across Pakistan",
          showCountdown: true,
          countdownHours: 9.5,
        },
        trending: {
          visible: true,
          eyebrow: "CURATED SELECTION",
          title: "Trending now",
          actionLabel: "View all",
        },
        categories: {
          visible: true,
          eyebrow: "COLLECTIONS",
          title: "Shop by category",
        },
        arrivals: {
          visible: true,
          eyebrow: "JUST RELEASED",
          title: "New arrivals",
          actionLabel: "View all",
        },
        brandStory: {
          visible: true,
          eyebrow: "STUDIO PHILOSOPHY",
          title: "Precision electronics built for performance and durability.",
          body: "Every component we ship undergoes acoustic calibration, thermal verification, and rigorous stress testing. We publish full engineering datasheets so you know exactly what you are paying for.",
          linkLabel: "Read the full story",
          image: u("1517420704952-d9f39e95b43e", 1200),
        },
        valueStrip: {
          visible: true,
          items: [
            { icon: "truck", title: "Free Express Shipping", subtitle: "On all Pakistan orders over Rs 20,000" },
            { icon: "package", title: "Cash on Delivery", subtitle: "Pay conveniently upon doorstep delivery" },
            { icon: "shield", title: "1-Year Studio Warranty", subtitle: "Full replacement guarantee on manufacturing defects" },
            { icon: "return", title: "30-Day Money Back", subtitle: "Hassle-free return policy if unsatisfied" },
          ],
        },
        ugc: {
          visible: true,
          eyebrow: "@TECHGADGETSPK",
          title: "Follow our studio in Lahore",
        },
        rating: {
          visible: true,
          eyebrow: "AVERAGE STORE RATING 4.9 / 5.0",
          reviewsLabel: "verified reviews",
        },
      },
    },
    {
      page: "about",
      title: "About",
      sections: {
        intro: {
          eyebrow: "OUR STORY",
          title: "We make instruments for people who notice.",
          image: u("1517420704952-d9f39e95b43e", 1200),
          paragraphs: [
            { text: "Tech Gadgets PK is a boutique electronics laboratory. We build hardware in small batches and publish raw measurements rather than hyperbole." },
            { text: "Our designs eliminate unnecessary plastic, flashy LEDs, and subscription paywalls in favor of anodized aluminium, tactile mechanical controls, and enduring utility." },
          ],
        },
        values: {
          visible: true,
          items: [
            { number: "01", title: "Published Tolerances", body: "Every frequency response curve and battery runtime benchmark is published raw from our sound booth." },
            { number: "02", title: "Monochrome Aesthetics", body: "We believe functional tools shouldn't fight for visual attention on your desk." },
            { number: "03", title: "Repairable Engineering", body: "Modular components, standard fasteners, and replaceable ear pads extend lifecycle by design." },
          ],
        },
        team: {
          visible: true,
          eyebrow: "OUR TEAM",
          title: "Engineers & Designers",
          photos: [
            { image: u("1534528741775-53994a69daeb", 600) },
            { image: u("1507003211169-0a1dd7228f2d", 600) },
            { image: u("1500648767791-00dcc994a43e", 600) },
            { image: u("1573496359142-b8d87734a5a2", 600) },
          ],
        },
      },
    },
    {
      page: "contact",
      title: "Contact",
      sections: {
        intro: {
          eyebrow: "CUSTOMER SUPPORT",
          title: "Every message gets a reply within one working day.",
        },
        form: {
          namePlaceholder: "Your full name",
          emailPlaceholder: "Your email address",
          phonePlaceholder: "Phone number (+92...)",
          orderPlaceholder: "Order number (optional)",
          messagePlaceholder: "How can we help you today?",
          buttonLabel: "Send Message",
          successMessage: "Thank you! Your message has been sent. We will respond within 24 hours.",
        },
        cards: {
          visible: true,
          items: [
            { icon: "mail", label: "Email Support", value: "support@aperture.tech" },
            { icon: "phone", label: "Phone & WhatsApp", value: "+92 300 1234567" },
            { icon: "clock", label: "Working Hours", value: "Mon–Fri, 09:00–17:30 PKT" },
            { icon: "pin", label: "Studio Location", value: "MM Alam Road, Gulberg III, Lahore, Pakistan" },
          ],
        },
      },
    },
    {
      page: "shop",
      title: "Shop",
      sections: {
        header: {
          title: "Everything we make",
          countSuffix: "precision products in focus",
          emptyText: "No products match these filters — try resetting your filter criteria.",
        },
      },
    },
    {
      page: "faq",
      title: "FAQ",
      sections: {
        header: {
          eyebrow: "SUPPORT CENTER",
          title: "Frequently asked questions",
          searchPlaceholder: "Search delivery, warranty, payments...",
          emptyText: "No matching FAQs found. Contact our support team via WhatsApp for help.",
        },
      },
    },
    {
      page: "footer",
      title: "Footer",
      sections: {
        brand: {
          name: "Tech Gadgets PK",
          blurb: "Precision consumer electronics and acoustic hardware built in small runs.",
          copyright: "© 2026 Tech Gadgets PK. All rights reserved.",
          paymentsText: "Cash on Delivery · Online Bank Transfer · Debit / Credit Card",
        },
      },
    },
  ]);

  console.log(`Seeded ${products.length} products with video & image galleries, ${categories.length} categories.`);
  console.log("Seeding process completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
