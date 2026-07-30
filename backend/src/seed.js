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
// iuhyghjklkjh
const u = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const pkr = (usd) => Math.round(usd * 280);

async function seed() {
  await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/focus-frame-store");

  console.log("Clearing collections…");
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

  await SiteSettings.create({
    key: "main",
    brandName: "Tech Gadgets PK",
    tagline: "Precision Tech, Monochrome",
    announcement: "Free shipping over Rs 20,000 · Cash on Delivery available",
    contact: {
      email: "support@aperture.tech",
      phone: "+92 300 1234567",
      whatsapp: "+92 300 1234567",
      hours: "Mon–Fri, 09:00–17:30 PKT",
      address: "MM Alam Road, Lahore, Pakistan",
    },
    social: {
      instagram: "https://instagram.com/aperture",
      facebook: "https://facebook.com/aperture",
      twitter: "https://x.com/aperture",
      youtube: "https://youtube.com/@aperture",
      tiktok: "",
      linkedin: "",
    },
    payment: {
      codEnabled: true,
      onlineEnabled: true,
      online: {
        accountName: "Aperture Instruments",
        accountNumber: "0123456789",
        bankName: "HBL",
        iban: "PK00HABB0000001234567890",
        instructions:
          "Scan the QR or transfer the exact total. Use your order number as the reference.",
        qrImage: "",
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
      whatsappLabel: "WhatsApp",
      helpText:
        "Need help with your order? Reach us by call or WhatsApp — we reply within one working day.",
    },
    instagramShots: [
      u("1484704849700-f032a568e944", 600),
      u("1546435770-a3e426bf472b", 600),
      u("1511707171634-5f897ff02aa9", 600),
      u("1600294037681-c80b4cb5b434", 600),
      u("1524678606370-a47ad25cb82a", 600),
      u("1517336714731-489689fd1ca8", 600),
      u("1526170375885-4d8ecf77b99f", 600),
      u("1542751371-adc38448a05e", 600),
    ],
  });

  const catData = [
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
  const categories = await Category.insertMany(catData.map((c, i) => ({ ...c, sortOrder: i })));
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const colorSet = (a, b) => [
    { label: a, type: "color", value: a, stock: 20 },
    { label: b, type: "color", value: b, stock: 20 },
  ];

  const productsRaw = [
    {
      slug: "aperture-one-earbuds",
      name: "Aperture One",
      brand: "APERTURE",
      category: "audio",
      price: pkr(249),
      compareAt: pkr(299),
      saleDiscountPercent: 17,
      rating: 4.8,
      reviewCount: 3,
      images: [
        u("1590658268037-6bf12165a8df"),
        u("1606220945770-b5b6c2c55bf1"),
        u("1572569511254-d8f925fe2cbb"),
      ],
      short: "Adaptive ANC earbuds with a 12mm graphene driver and 32h of case runtime.",
      description:
        "Aperture One is a two-way earbud tuned in a treated room, not a marketing meeting. A 12mm graphene diaphragm handles low end without smearing midrange detail.",
      specs: [
        { label: "Driver", value: "12mm graphene" },
        { label: "ANC depth", value: "-42dB" },
        { label: "Battery (case)", value: "32h" },
        { label: "Bluetooth", value: "5.4 / LE Audio" },
      ],
      flags: ["hot", "sale"],
      stock: 6,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "field-over-ear",
      name: "Field 02 Over-Ear",
      brand: "APERTURE",
      category: "audio",
      price: pkr(429),
      rating: 4.7,
      reviewCount: 3,
      images: [
        u("1583394838336-acd977736f90"),
        u("1618366712010-f4ae9c647dcb"),
        u("1546435770-a3e426bf472b"),
      ],
      short: "Closed-back reference headphones with 60h runtime and a replaceable pad system.",
      description:
        "A closed-back monitor for people who mix on trains. Field 02 uses a 40mm beryllium-coated driver.",
      specs: [
        { label: "Driver", value: "40mm beryllium-coated" },
        { label: "Battery", value: "60h ANC on" },
        { label: "Weight", value: "268g" },
      ],
      sizes: [
        { label: "Standard", type: "size", stock: 12 },
        { label: "Wide band", type: "size", stock: 8 },
      ],
      flags: ["new"],
      stock: 24,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "signal-watch",
      name: "Signal Watch",
      brand: "APERTURE",
      category: "wearables",
      price: pkr(379),
      compareAt: pkr(449),
      saleDiscountPercent: 16,
      rating: 4.9,
      reviewCount: 3,
      images: [
        u("1523275335684-37898b6baf30"),
        u("1508685096489-7aacd43bd3b1"),
        u("1434493789847-2f02dc6ca35d"),
      ],
      short: "Titanium smartwatch with a 14-day duty cycle and a sapphire face.",
      description:
        "Grade-5 titanium case, sapphire crystal, and a transflective display you can actually read outdoors.",
      specs: [
        { label: "Case", value: "Grade-5 titanium" },
        { label: "Battery", value: "14 days typical" },
        { label: "Water rating", value: "10 ATM" },
      ],
      sizes: [
        { label: "40mm", type: "size", stock: 10 },
        { label: "44mm", type: "size", stock: 10 },
      ],
      flags: ["hot", "sale"],
      stock: 20,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "trace-ring",
      name: "Trace Ring",
      brand: "APERTURE",
      category: "wearables",
      price: pkr(289),
      rating: 4.4,
      reviewCount: 3,
      images: [
        u("1611591437281-460bfbe1220a"),
        u("1602173574767-37ac01994b2a"),
        u("1515562141207-7a88fb7ce338"),
      ],
      short: "Sleep and recovery tracking in 3.4 grams of zirconia ceramic.",
      description:
        "No screen, no notifications. Trace measures sleep staging, temperature drift and HRV.",
      specs: [
        { label: "Material", value: "Zirconia ceramic" },
        { label: "Weight", value: "3.4g" },
        { label: "Battery", value: "7 days" },
      ],
      sizes: [
        { label: "Size 8", type: "size", stock: 5 },
        { label: "Size 10", type: "size", stock: 5 },
        { label: "Size 12", type: "size", stock: 5 },
      ],
      flags: ["new"],
      stock: 15,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "halo-lamp",
      name: "Halo Lamp",
      brand: "APERTURE",
      category: "smart-home",
      price: pkr(199),
      rating: 4.5,
      reviewCount: 3,
      images: [
        u("1507473885765-e6ed057f782c"),
        u("1524758631624-e2822e304c36"),
        u("1513506003901-1e6a229e2d15"),
      ],
      short: "Tunable 2200–6500K desk light with a physical dimmer ring.",
      description:
        "Full-spectrum LED with CRI 97 and a knurled aluminium ring that dims without an app.",
      specs: [
        { label: "CRI", value: "97" },
        { label: "Temperature", value: "2200K – 6500K" },
        { label: "Protocol", value: "Matter over Thread" },
      ],
      stock: 24,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "quiet-sensor",
      name: "Quiet Sensor",
      brand: "APERTURE",
      category: "smart-home",
      price: pkr(89),
      compareAt: pkr(109),
      saleDiscountPercent: 18,
      rating: 4.2,
      reviewCount: 3,
      images: [
        u("1558089687-f282ffcbc126"),
        u("1585771724684-38269d6639fd"),
        u("1544428571-affb0ff33ca4"),
      ],
      short: "Air quality, temperature and presence in one matte block.",
      description: "Measures PM2.5, VOC, CO2, humidity and presence. Local-first.",
      specs: [
        { label: "Sensors", value: "PM2.5, VOC, CO2, RH" },
        { label: "Radio", value: "Thread + BLE" },
      ],
      flags: ["sale"],
      stock: 4,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "index-keyboard",
      name: "Index 65",
      brand: "APERTURE",
      category: "desk",
      price: pkr(219),
      rating: 4.9,
      reviewCount: 3,
      images: [
        u("1587829741301-dc798b83add3"),
        u("1595225476474-87563907a212"),
        u("1618384887929-16ec33fab9ef"),
      ],
      short: "Gasket-mounted 65% keyboard, hot-swap, PBT dye-sub caps.",
      description:
        "An aluminium 65% with a proper gasket mount, silicone dampening and a rotary encoder.",
      specs: [
        { label: "Layout", value: "65% / 68 keys" },
        { label: "Mount", value: "Gasket" },
        { label: "Weight", value: "1.1kg" },
      ],
      flags: ["hot"],
      stock: 24,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "pivot-mouse",
      name: "Pivot Mouse",
      brand: "APERTURE",
      category: "desk",
      price: pkr(129),
      rating: 4.3,
      reviewCount: 3,
      images: [
        u("1527864550417-7fd91fc51a46"),
        u("1615663245857-ac93bb7c39e7"),
        u("1563297007-0686b7003af7"),
      ],
      short: "26,000 DPI sensor, 58g shell, magnetic charging puck.",
      description: "Low-latency wireless with a 1000Hz polling rate.",
      specs: [
        { label: "Sensor", value: "26,000 DPI optical" },
        { label: "Weight", value: "58g" },
      ],
      stock: 24,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "carry-case",
      name: "Carry Case 03",
      brand: "APERTURE",
      category: "accessories",
      price: pkr(59),
      rating: 4.1,
      reviewCount: 3,
      images: [
        u("1585298723682-7115561c51b7"),
        u("1553062407-98eeb64c6a62"),
        u("1591561954557-26941169b49e"),
      ],
      short: "Moulded EVA case with a die-cut insert for buds, cable and dongle.",
      description: "Water-resistant 600D shell over EVA, YKK zip.",
      specs: [
        { label: "Shell", value: "600D water-resistant" },
        { label: "Zip", value: "YKK #5" },
      ],
      stock: 40,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "power-brick",
      name: "Cell 100W",
      brand: "APERTURE",
      category: "accessories",
      price: pkr(79),
      compareAt: pkr(99),
      saleDiscountPercent: 20,
      rating: 4.8,
      reviewCount: 3,
      images: [
        u("1583863788434-e58a36330cf0"),
        u("1618410320928-25228d811631"),
        u("1600490036275-35f5f1656861"),
      ],
      short: "GaN charger, four ports, 100W total with per-port negotiation.",
      description: "Gallium-nitride internals keep it cool at full load.",
      specs: [
        { label: "Output", value: "100W total" },
        { label: "Ports", value: "2x USB-C, 2x USB-A" },
      ],
      flags: ["hot", "sale"],
      stock: 30,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "lens-35",
      name: "Prime 35 Adapter",
      brand: "APERTURE",
      category: "cameras",
      price: pkr(349),
      rating: 4.7,
      reviewCount: 3,
      images: [
        u("1516035069371-29a1b244cc32"),
        u("1502920917128-1aa500764cbd"),
        u("1510127034890-ba27508e9f1c"),
      ],
      short: "Machined phone lens mount with a true 35mm equivalent element.",
      description: "Aircraft aluminium mount, multicoated glass.",
      specs: [
        { label: "Focal length", value: "35mm equiv." },
        { label: "Elements", value: "6 in 4 groups" },
      ],
      flags: ["new"],
      stock: 18,
      colors: colorSet("Graphite", "Chalk"),
    },
    {
      slug: "monitor-arm",
      name: "Arm 01",
      brand: "APERTURE",
      category: "desk",
      price: pkr(169),
      rating: 4.4,
      reviewCount: 3,
      images: [
        u("1527443224154-c4a3942d3acf"),
        u("1593642532744-d377ab507dc8"),
        u("1547082299-de196ea013d6"),
      ],
      short: "Gas-spring monitor arm rated to 9kg with internal cable routing.",
      description:
        "Cold-rolled steel arm with a machined clamp and cable channels that close flush.",
      specs: [
        { label: "Load", value: "3 – 9kg" },
        { label: "Reach", value: "620mm" },
      ],
      stock: 0,
      inStock: false,
      colors: colorSet("Graphite", "Chalk"),
    },
  ];

  const products = [];
  for (const p of productsRaw) {
    const cat = bySlug[p.category];
    const doc = await Product.create({
      ...p,
      category: cat._id,
      categorySlug: cat.slug,
      currency: "PKR",
      inStock: p.inStock !== false && (p.stock || 0) > 0,
      videos: [],
      variants: [],
    });
    products.push(doc);

    const reviews = [
      {
        author: "M. Halden",
        rating: 5,
        title: "Exactly as specified",
        body: `${p.name} arrived boxed like an instrument. Tolerances feel machined, not moulded.`,
      },
      {
        author: "J. Okafor",
        rating: 4,
        title: "Strong, one nitpick",
        body: "Build and finish are excellent. Packaging could be a touch slimmer.",
      },
      {
        author: "S. Lindqvist",
        rating: 5,
        title: "Replaced two devices",
        body: "Battery figures match the datasheet, which is rarer than it should be.",
      },
    ];
    for (const r of reviews) {
      await Review.create({
        product: doc._id,
        ...r,
        images: [],
        videos: [],
        isApproved: true,
        createdByAdmin: true,
      });
    }
  }

  await Journal.insertMany([
    {
      slug: "why-we-tune-in-a-treated-room",
      title: "Why we tune every driver in a treated room",
      category: "Process",
      readTime: "6 min",
      date: new Date("2026-06-18"),
      image: u("1478737270239-2f02b77fc618"),
      excerpt:
        "Most consumer audio is voiced on a laptop in an open-plan office. Here's what changes when you stop doing that.",
      body: [
        "A room is a filter. Before a single driver reaches a listener, the space it was tuned in has already made most of the decisions.",
        "Our tuning room is 24 square metres, treated to an RT60 of 0.18 seconds across the vocal band.",
      ],
      contentHtml: `<p>A room is a filter. Before a single driver reaches a listener, the space it was tuned in has already made most of the decisions about how it sounds.</p><p>Our tuning room is 24 square metres, treated to an RT60 of 0.18 seconds across the vocal band, with bass traps in all four corners.</p>`,
    },
    {
      slug: "the-case-against-accent-colours",
      title: "The case against accent colours",
      category: "Design",
      readTime: "4 min",
      date: new Date("2026-05-30"),
      image: u("1517420704952-d9f39e95b43e"),
      excerpt:
        "Colour is the laziest way to signal hierarchy. Weight, scale and contrast do it better.",
      body: ["Colour is expensive. Not to print — to read."],
      contentHtml: `<p>Colour is expensive. Not to print — to read. Every accent hue you add is a new rule the reader has to learn and hold.</p>`,
    },
    {
      slug: "battery-numbers-that-mean-something",
      title: "Battery numbers that mean something",
      category: "Engineering",
      readTime: "8 min",
      date: new Date("2026-04-14"),
      image: u("1609091839311-d5365f9ff1c5"),
      excerpt:
        "Published runtime figures are usually best-case fiction. We publish ours at 50% volume with ANC on.",
      body: ["There is no legal standard for how a headphone manufacturer measures battery life."],
      contentHtml: `<p>There is no legal standard for how a headphone manufacturer measures battery life, which means every published figure is measured under whatever conditions flatter it most.</p>`,
    },
  ]);

  const faqSeed = [
    {
      group: "Orders & Shipping",
      question: "How long does delivery take?",
      answer: "Standard delivery is 2–4 business days domestically across Pakistan.",
    },
    {
      group: "Orders & Shipping",
      question: "Is shipping free?",
      answer:
        "Shipping is free on all orders over Rs 20,000. Below that, flat-rate shipping is Rs 250.",
    },
    {
      group: "Orders & Shipping",
      question: "Do you offer Cash on Delivery?",
      answer: "Yes. COD is available on domestic orders. A signature is required at handover.",
    },
    {
      group: "Returns",
      question: "What is the return window?",
      answer: "30 days from delivery, unused and in original packaging.",
    },
    {
      group: "Payments",
      question: "Which payment methods do you accept?",
      answer: "Cash on Delivery and online bank transfer / QR payment.",
    },
    {
      group: "Products",
      question: "What warranty do products carry?",
      answer: "One year as standard.",
    },
  ];
  await Faq.insertMany(faqSeed.map((f, i) => ({ ...f, sortOrder: i })));

  await Testimonial.insertMany([
    {
      name: "Rina Alvarez",
      role: "Sound designer",
      rating: 5,
      quote: "The Field 02 is the first closed-back I've trusted for rough mixes on the road.",
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
  ]);

  await PageContent.insertMany([
    {
      page: "home",
      title: "Home",
      blocks: [
        {
          key: "hero_eyebrow",
          type: "text",
          label: "Hero eyebrow",
          value: "Precision instruments",
        },
        {
          key: "hero_headline",
          type: "text",
          label: "Hero headline",
          value: "Built to disappear into the work.",
        },
        {
          key: "hero_sub",
          type: "text",
          label: "Hero supporting line",
          value: "Audio, wearables and desk hardware documented in full — priced in PKR.",
        },
        { key: "hero_cta", type: "text", label: "Hero CTA", value: "Shop the catalogue" },
        {
          key: "hero_image",
          type: "image",
          label: "Hero image",
          value: u("1505740420928-5e560c06d30e"),
        },
      ],
    },
    {
      page: "about",
      title: "About",
      blocks: [
        {
          key: "headline",
          type: "text",
          label: "Headline",
          value: "We make instruments for people who notice.",
        },
        {
          key: "body",
          type: "html",
          label: "Body",
          value:
            "<p>Aperture is a small-run electronics studio. We publish specs that match the box.</p>",
        },
        {
          key: "image",
          type: "image",
          label: "Feature image",
          value: u("1517420704952-d9f39e95b43e"),
        },
      ],
    },
    {
      page: "contact",
      title: "Contact",
      blocks: [
        {
          key: "headline",
          type: "text",
          label: "Headline",
          value: "Every message gets a reply within one working day.",
        },
        { key: "sub", type: "text", label: "Subcopy", value: "Support · Mon–Fri 09:00–17:30 PKT" },
      ],
    },
    {
      page: "footer",
      title: "Footer",
      blocks: [
        {
          key: "blurb",
          type: "text",
          label: "Footer blurb",
          value: "Precision consumer electronics, documented in full.",
        },
      ],
    },
  ]);

  console.log(`Seeded ${products.length} products, ${categories.length} categories.`);
  console.log("Done. Admin login:", adminEmail, "/", process.env.ADMIN_PASSWORD || "Admin@12345");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
