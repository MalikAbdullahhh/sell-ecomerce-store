const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000";

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  // Absolute CDN / external URLs (Cloudinary, Unsplash, etc.)
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("//")) return `https:${path}`;
  // Legacy local uploads stored as /uploads/...
  if (path.startsWith("/uploads")) return `${UPLOADS_URL}${path}`;
  if (path.startsWith("/")) return `${UPLOADS_URL}${path}`;
  // Bare filename from older local uploads
  return `${UPLOADS_URL}/uploads/${path}`;
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  formData?: FormData;
  admin?: boolean;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken(admin?: boolean) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(admin ? "aperture-admin-token" : "aperture-user-token");
}

export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = opts.token ?? getToken(opts.admin);
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || (opts.body || opts.formData ? "POST" : "GET"),
    headers,
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { message?: string }).message || res.statusText, res.status, data);
  }
  return data as T;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api<{ token: string; user: UserSafe }>("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    api<{ token: string; user: UserSafe }>("/auth/login", { method: "POST", body }),
  me: () => api<{ user: UserSafe }>("/auth/me", { token: getToken() }),
  updateMe: (body: Partial<UserSafe> & { addresses?: UserAddress[] }) =>
    api<{ user: UserSafe }>("/auth/me", { method: "PATCH", body }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<{ message: string }>("/auth/me/password", { method: "POST", body }),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ user: UserSafe; url: string }>("/upload/avatar", { method: "POST", formData: fd });
  },
  adminLogin: (body: { email: string; password: string }) =>
    api<{ token: string; admin: AdminSafe }>("/auth/admin/login", { method: "POST", body }),
  adminMe: () => api<{ admin: AdminSafe }>("/auth/admin/me", { admin: true }),
};

export const catalogApi = {
  categories: () => api<{ categories: CategoryDoc[] }>("/categories"),
  products: (params?: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    const qs = q.toString();
    return api<{ products: ProductDoc[]; total: number }>(`/products${qs ? `?${qs}` : ""}`);
  },
  product: (slug: string) => api<{ product: ProductDoc }>(`/products/slug/${slug}`),
  journals: () => api<{ posts: JournalDoc[] }>("/journals"),
  journal: (slug: string) => api<{ post: JournalDoc }>(`/journals/slug/${slug}`),
};

export const cmsApi = {
  site: () => api<{ settings: SiteSettings }>("/cms/site"),
  page: (page: string) => api<{ page: PageDoc }>(`/cms/pages/${page}`),
  faqs: () =>
    api<{ faqs: { group: string; items: { q: string; a: string; id: string }[] }[] }>("/cms/faqs"),
  testimonials: () => api<{ testimonials: TestimonialDoc[] }>("/cms/testimonials"),
  legalList: () =>
    api<{ docs: { slug: string; title: string; summary: string; updated?: string }[] }>(
      "/cms/legal",
    ),
  legal: (slug: string) => api<{ doc: LegalDocApi }>(`/cms/legal/${slug}`),
};

export const orderApi = {
  create: (body: OrderPayload) => api<OrderResponse>("/orders", { method: "POST", body }),
  mine: () => api<{ orders: OrderDoc[] }>("/orders/mine"),
  one: (orderNumber: string) => api<{ order: OrderDoc }>(`/orders/mine/${orderNumber}`),
  uploadPaymentProof: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ url: string }>("/upload/payment-proof", { method: "POST", formData: fd });
  },
};

export const discountApi = {
  validate: (body: { code: string; subtotal: number }) =>
    api<{
      valid: true;
      code: string;
      type: "percent" | "flat";
      value: number;
      discountAmount: number;
      discountedSubtotal: number;
      maxUses: number;
      usedUses: number;
      remainingUses: number;
    }>("/discounts/validate", { method: "POST", body }),
};

export const newsletterApi = {
  subscribe: (body: { email: string; name?: string }) =>
    api<{ message: string }>("/newsletter/subscribe", { method: "POST", body }),
};

export const reviewApi = {
  create: (formData: FormData) => api("/reviews", { method: "POST", formData }),
  updateMine: (id: string, formData: FormData) =>
    api(`/reviews/mine/${id}`, { method: "PATCH", formData }),
  deleteMine: (id: string) => api(`/reviews/mine/${id}`, { method: "DELETE" }),
};

export const adminApi = {
  dashboard: () => api<DashboardData>("/admin/dashboard", { admin: true }),
  users: () => api<{ users: AdminUserDoc[] }>("/admin/users", { admin: true }),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    isActive?: boolean;
  }) => api<{ user: AdminUserDoc }>("/admin/users", { method: "POST", body, admin: true }),
  updateUser: (
    id: string,
    body: Partial<{
      isActive: boolean;
      name: string;
      email: string;
      phone: string;
      password: string;
    }>,
  ) => api<{ user: AdminUserDoc }>(`/admin/users/${id}`, { method: "PATCH", body, admin: true }),
  deleteUser: (id: string) =>
    api<{ message: string }>(`/admin/users/${id}`, { method: "DELETE", admin: true }),
  categories: () => api<{ categories: CategoryDoc[] }>("/categories/admin/all", { admin: true }),
  saveCategory: (body: Partial<CategoryDoc> & { name: string }, id?: string) =>
    id
      ? api(`/categories/${id}`, { method: "PUT", body, admin: true })
      : api("/categories", { method: "POST", body, admin: true }),
  deleteCategory: (id: string) => api(`/categories/${id}`, { method: "DELETE", admin: true }),
  products: () => api<{ products: ProductDoc[] }>("/products/admin/all", { admin: true }),
  saveProduct: (body: Record<string, unknown>, id?: string) =>
    id
      ? api(`/products/${id}`, { method: "PUT", body, admin: true })
      : api("/products", { method: "POST", body, admin: true }),
  deleteProduct: (id: string) => api(`/products/${id}`, { method: "DELETE", admin: true }),
  orders: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return api<{ orders: OrderDoc[]; unreadCount: number }>(
      `/orders/admin/all${q ? `?${q}` : ""}`,
      { admin: true },
    );
  },
  unreadOrders: () => api<{ count: number }>("/orders/admin/unread-count", { admin: true }),
  markOrderRead: (id: string) =>
    api<{ order: OrderDoc; unreadCount: number }>(`/orders/admin/${id}/read`, {
      method: "POST",
      admin: true,
    }),
  markAllOrdersRead: () =>
    api<{ unreadCount: number }>("/orders/admin/mark-all-read", { method: "POST", admin: true }),
  createOrder: (body: Record<string, unknown>) =>
    api<{ order: OrderDoc }>("/orders/admin", { method: "POST", body, admin: true }),
  updateOrder: (id: string, body: Record<string, unknown>) =>
    api<{ order: OrderDoc }>(`/orders/admin/${id}`, { method: "PATCH", body, admin: true }),
  deleteOrder: (id: string, opts?: { restoreStock?: boolean }) => {
    const q = opts?.restoreStock === false ? "?restoreStock=false" : "";
    return api<{ message: string }>(`/orders/admin/${id}${q}`, { method: "DELETE", admin: true });
  },
  getOrder: (id: string) => api<{ order: OrderDoc }>(`/orders/admin/${id}`, { admin: true }),
  testimonials: () =>
    api<{ testimonials: TestimonialDoc[] }>("/cms/testimonials/admin", { admin: true }),
  saveTestimonial: (body: Partial<TestimonialDoc>, id?: string) =>
    id
      ? api(`/cms/testimonials/${id}`, { method: "PUT", body, admin: true })
      : api("/cms/testimonials", { method: "POST", body, admin: true }),
  deleteTestimonial: (id: string) =>
    api(`/cms/testimonials/${id}`, { method: "DELETE", admin: true }),
  newsletterSubscribers: () =>
    api<{ subscribers: NewsletterSubscriber[] }>("/newsletter/subscribers", { admin: true }),
  deleteSubscriber: (id: string) =>
    api(`/newsletter/subscribers/${id}`, { method: "DELETE", admin: true }),
  newsletterCampaigns: () =>
    api<{ campaigns: NewsletterCampaign[] }>("/newsletter/campaigns", { admin: true }),
  sendNewsletter: (body: { subject: string; bodyHtml: string }) =>
    api<{ message: string; campaign: NewsletterCampaign }>("/newsletter/send", {
      method: "POST",
      body,
      admin: true,
    }),
  reviews: () => api<{ reviews: ReviewDoc[] }>("/reviews/admin/all", { admin: true }),
  saveReview: (body: Record<string, unknown>, id?: string) =>
    id
      ? api(`/reviews/admin/${id}`, { method: "PUT", body, admin: true })
      : api("/reviews/admin", { method: "POST", body, admin: true }),
  deleteReview: (id: string) => api(`/reviews/admin/${id}`, { method: "DELETE", admin: true }),
  journals: () => api<{ posts: JournalDoc[] }>("/journals/admin/all", { admin: true }),
  saveJournal: (body: Record<string, unknown>, id?: string) =>
    id
      ? api(`/journals/${id}`, { method: "PUT", body, admin: true })
      : api("/journals", { method: "POST", body, admin: true }),
  deleteJournal: (id: string) => api(`/journals/${id}`, { method: "DELETE", admin: true }),
  site: () => api<{ settings: SiteSettings }>("/cms/site", { admin: true }),
  saveSite: (body: Partial<SiteSettings>) => api("/cms/site", { method: "PUT", body, admin: true }),
  page: (page: string) => api<{ page: PageDoc }>(`/cms/pages/${page}`, { admin: true }),
  savePage: (page: string, body: Partial<PageDoc>) =>
    api(`/cms/pages/${page}`, { method: "PUT", body, admin: true }),
  faqs: () => api<{ faqs: FaqDoc[] }>("/cms/faqs/admin", { admin: true }),
  saveFaq: (body: Partial<FaqDoc>, id?: string) =>
    id
      ? api(`/cms/faqs/${id}`, { method: "PUT", body, admin: true })
      : api("/cms/faqs", { method: "POST", body, admin: true }),
  deleteFaq: (id: string) => api(`/cms/faqs/${id}`, { method: "DELETE", admin: true }),
  legalDocs: () => api<{ docs: LegalDocApi[] }>("/cms/legal/admin", { admin: true }),
  saveLegal: (slug: string, body: Partial<LegalDocApi>) =>
    api<{ doc: LegalDocApi }>(`/cms/legal/${slug}`, { method: "PUT", body, admin: true }),
  createLegal: (body: Partial<LegalDocApi> & { slug: string; title: string }) =>
    api<{ doc: LegalDocApi }>("/cms/legal", { method: "POST", body, admin: true }),
  deleteLegal: (slug: string) => api(`/cms/legal/${slug}`, { method: "DELETE", admin: true }),
  upload: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return api<{ files: { url: string; absoluteUrl: string }[] }>("/upload", {
      method: "POST",
      formData: fd,
      admin: true,
    });
  },
};

/* ——— shared types ——— */

export type UserAddress = {
  label?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  isDefault?: boolean;
};

export type UserSafe = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses?: UserAddress[];
  createdAt?: string;
};

export type AdminUserDoc = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type AdminSafe = { id: string; name: string; email: string; role: string };

export type CategoryDoc = {
  _id: string;
  name: string;
  slug: string;
  blurb?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type VariantDoc = {
  _id?: string;
  label: string;
  type: "color" | "size" | "material" | "other";
  value?: string;
  image?: string;
  stock?: number;
  priceDelta?: number;
};

export type ReviewDoc = {
  _id?: string;
  id?: string;
  userId?: string | null;
  author: string;
  authorImage?: string;
  rating: number;
  date?: string;
  title?: string;
  body: string;
  images?: string[];
  videos?: string[];
  product?: { name?: string; slug?: string; images?: string[] } | string;
  isApproved?: boolean;
  createdAt?: string;
};

export type ProductDoc = {
  _id: string;
  id?: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug?: string;
  /** All category slugs for this product (includes primary). */
  categories?: string[];
  categorySlugs?: string[];
  price: number;
  compareAt?: number;
  saleDiscountPercent?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  videos?: string[];
  gallery?: { url: string; type: "image" | "video" }[];
  short: string;
  description: string;
  specs: { label: string; value: string }[];
  colors: VariantDoc[];
  sizes?: VariantDoc[];
  variants?: VariantDoc[];
  inStock: boolean;
  stock: number;
  soldCount?: number;
  ratingLocked?: boolean;
  flags: ("new" | "hot" | "sale")[];
  reviews?: ReviewDoc[];
  isActive?: boolean;
};

export type JournalDoc = {
  _id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  images?: string[];
  excerpt: string;
  body?: string[];
  contentHtml?: string;
  isPublished?: boolean;
};

export type SiteSettings = {
  brandName: string;
  tagline: string;
  announcement: string;
  announcementEmojis?: string[];
  announcementSpeed?: number;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    hours: string;
    address: string;
  };
  social: Record<string, string>;
  payment: {
    codEnabled: boolean;
    onlineEnabled: boolean;
    online: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      iban: string;
      instructions: string;
      qrImage: string;
    };
  };
  shipping: {
    freeThreshold: number;
    flatFee: number;
    giftFee: number;
    currency: string;
  };
  extraCharges?: ExtraCharge[];
  discountCodes?: {
    code: string;
    type: "percent" | "flat";
    value: number;
    maxUses: number;
    usedUses: number;
    enabled?: boolean;
  }[];
  help: {
    callLabel: string;
    whatsappLabel: string;
    helpText: string;
  };
  newsletter?: {
    enabled: boolean;
    eyebrow: string;
    headline: string;
    buttonLabel: string;
    successMessage: string;
  };
  testimonialsSection?: {
    eyebrow: string;
    title: string;
  };
  instagramShots?: string[];
  /** Ordered product slugs for the homepage Trending rail. */
  trendingProductSlugs?: string[];
};

export type ExtraCharge = {
  label: string;
  type: "flat" | "percent";
  value: number;
  enabled?: boolean;
};

export type PageDoc = {
  page: string;
  title: string;
  blocks: { key: string; type: string; label: string; value: unknown }[];
  sections?: Record<string, Record<string, unknown>>;
  isPublished?: boolean;
};

export type TestimonialDoc = {
  _id: string;
  name: string;
  handle?: string;
  email?: string;
  role?: string;
  rating: number;
  quote: string;
  image?: string;
  platform?: "instagram" | "facebook" | "twitter" | "x" | "other";
  likes?: number;
  comments?: number;
  layout?: "meta-top" | "meta-bottom";
  dateAdded?: string;
  sortOrder?: number;
  isActive?: boolean;
  row?: 1 | 2;
};

export type NewsletterSubscriber = {
  _id: string;
  email: string;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type NewsletterCampaign = {
  _id: string;
  subject: string;
  bodyHtml: string;
  sentCount: number;
  status: string;
  sentAt?: string;
  createdAt?: string;
};

export type LegalDocApi = {
  _id?: string;
  slug: string;
  title: string;
  summary?: string;
  contentHtml?: string;
  sortOrder?: number;
  isPublished?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

export type FaqDoc = {
  _id: string;
  group: string;
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type OrderItem = {
  product?: string;
  slug: string;
  name: string;
  image?: string;
  color?: string;
  size?: string;
  qty: number;
  price: number;
  gift?: boolean;
  giftFee?: number;
  giftMessage?: string;
};

export type OrderDoc = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shipping: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  paymentMethod: "cod" | "online";
  paymentStatus: string;
  transactionId?: string;
  paymentProof?: string;
  status: string;
  subtotal: number;
  giftTotal: number;
  shippingFee: number;
  charges?: { label: string; amount: number }[];
  chargesTotal?: number;
  discount?: number;
  couponCode?: string;
  total: number;
  currency: string;
  notes?: string;
  estimatedDelivery?: string;
  createdAt: string;
  guest?: boolean;
  isRead?: boolean;
  statusHistory?: { status: string; note?: string; at?: string }[];
};

export type OrderPayload = {
  shipping: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  paymentMethod: "cod" | "online";
  items: {
    slug: string;
    color?: string;
    size?: string;
    qty: number;
    gift?: boolean;
    giftMessage?: string;
  }[];
  discountCode?: string;
  notes?: string;
  createAccount?: boolean;
  accountPassword?: string;
  transactionId?: string;
  paymentProof?: string;
};

export type OrderResponse = {
  order: OrderDoc;
  accountToken?: string;
  accountCreated?: boolean;
  emailSent?: boolean;
  settings: Pick<SiteSettings, "contact" | "help" | "payment">;
};

export type DashboardData = {
  stats: {
    orders: number;
    users: number;
    products: number;
    reviews: number;
    categories: number;
    journals: number;
    revenue: number;
    weekOrders: number;
    weekRevenue: number;
  };
  recentOrders: OrderDoc[];
  lowStock: ProductDoc[];
  statusBreakdown: { _id: string; count: number }[];
};

export { API_URL, UPLOADS_URL };
