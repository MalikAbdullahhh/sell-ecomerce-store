/** Shared storefront types — live data comes from the API, not local seed data. */

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
