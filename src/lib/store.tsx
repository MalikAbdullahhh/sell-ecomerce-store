import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as fallbackProducts, type Product } from "@/data/catalog";
import {
  catalogApi,
  cmsApi,
  mediaUrl,
  type CategoryDoc,
  type ProductDoc,
  type SiteSettings,
} from "@/lib/api";
import {
  resolveBrand,
  SITE_SETTINGS_UPDATED_EVENT,
  type BrandInfo,
} from "@/lib/brand";

export type CartLine = {
  id: string;
  slug: string;
  color: string;
  size?: string;
  qty: number;
  gift: boolean;
  giftMessage?: string;
};

export const GIFT_FEE = 500;
export const FREE_SHIPPING_THRESHOLD = 20000;
export const SHIPPING_FLAT = 250;

type StoreValue = {
  lines: CartLine[];
  wishlist: string[];
  compare: string[];
  cartOpen: boolean;
  products: Product[];
  categories: CategoryDoc[];
  settings: SiteSettings | null;
  catalogLoading: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (input: {
    slug: string;
    color?: string;
    size?: string;
    qty?: number;
    gift?: boolean;
    giftMessage?: string;
  }) => void;
  setQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  toggleGift: (id: string) => void;
  setGift: (id: string, gift: boolean) => void;
  setGiftMessage: (id: string, message: string) => void;
  clearCart: () => void;
  refreshSettings: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  toggleWishlist: (slug: string) => void;
  toggleCompare: (slug: string) => void;
  count: number;
  subtotal: number;
  giftTotal: number;
  shipping: number;
  charges: { label: string; amount: number }[];
  chargesTotal: number;
  total: number;
  lineProduct: (line: CartLine) => Product | undefined;
};

const StoreContext = createContext<StoreValue | null>(null);

const KEY = "aperture-store-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([catalogApi.products(), catalogApi.categories(), cmsApi.site()])
      .then(([productResult, categoryResult, siteResult]) => {
        if (!active) return;
        if (productResult.status === "fulfilled") {
          setProducts(productResult.value.products.map(apiProductToProduct));
        }
        if (categoryResult.status === "fulfilled") {
          setCategories(categoryResult.value.categories);
        }
        if (siteResult.status === "fulfilled") {
          setSettings(siteResult.value.settings);
        }
      })
      .finally(() => active && setCatalogLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setLines(parsed.lines ?? []);
      setWishlist(parsed.wishlist ?? []);
      setCompare(parsed.compare ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ lines, wishlist, compare }));
    } catch {
      /* ignore */
    }
  }, [lines, wishlist, compare]);

  const addToCart: StoreValue["addToCart"] = useCallback(
    (input) => {
      const product = products.find((p) => p.slug === input.slug);
      if (!product) return;
      const color = input.color ?? product.colors[0]?.label ?? "Default";
      const size = input.size ?? product.sizes?.[0]?.label;
      const id = [input.slug, color, size ?? "-"].join("::");
      setLines((prev) => {
        const existing = prev.find((l) => l.id === id);
        if (existing) {
          return prev.map((l) =>
            l.id === id
              ? {
                  ...l,
                  qty: l.qty + (input.qty ?? 1),
                  // Explicit gift flag from PDP wins; otherwise keep existing.
                  gift: input.gift !== undefined ? Boolean(input.gift) : l.gift,
                  giftMessage: input.giftMessage !== undefined ? input.giftMessage : l.giftMessage,
                }
              : l,
          );
        }
        return [
          ...prev,
          {
            id,
            slug: input.slug,
            color,
            size,
            qty: input.qty ?? 1,
            gift: Boolean(input.gift),
            giftMessage: input.giftMessage || "",
          },
        ];
      });
    },
    [products],
  );

  const refreshSettings = useCallback(async () => {
    try {
      const siteData = await cmsApi.site();
      setSettings(siteData.settings);
    } catch {
      /* keep cached settings */
    }
  }, []);

  useEffect(() => {
    const onUpdate = () => {
      void refreshSettings();
    };
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, onUpdate);
  }, [refreshSettings]);

  const refreshCatalog = useCallback(async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        catalogApi.products(),
        catalogApi.categories(),
      ]);
      setProducts(productData.products.map(apiProductToProduct));
      setCategories(categoryData.categories);
    } catch {
      /* keep cached catalogue */
    }
  }, []);

  const value = useMemo<StoreValue>(() => {
    const giftFee = Number(settings?.shipping?.giftFee ?? GIFT_FEE) || 0;
    const freeThreshold = Number(settings?.shipping?.freeThreshold ?? FREE_SHIPPING_THRESHOLD) || 0;
    const flatFee = Number(settings?.shipping?.flatFee ?? SHIPPING_FLAT) || 0;
    const lineProduct = (line: CartLine) => products.find((p) => p.slug === line.slug);
    const subtotal = lines.reduce((sum, l) => sum + (lineProduct(l)?.price ?? 0) * l.qty, 0);
    // One gift wrap fee per cart line that has gift enabled (admin-managed amount).
    const giftTotal = lines.reduce((sum, l) => sum + (l.gift ? giftFee : 0), 0);
    const shipping = subtotal === 0 || subtotal >= freeThreshold ? 0 : flatFee;
    const charges =
      subtotal === 0
        ? []
        : (settings?.extraCharges || [])
            .filter((c) => c && c.enabled !== false && c.label && Number(c.value) > 0)
            .map((c) => ({
              label: c.label,
              amount:
                c.type === "percent"
                  ? Math.round((subtotal * (Number(c.value) || 0)) / 100)
                  : Number(c.value) || 0,
            }))
            .filter((c) => c.amount > 0);
    const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
    return {
      lines,
      wishlist,
      compare,
      cartOpen,
      products,
      categories,
      settings,
      catalogLoading,
      setCartOpen,
      addToCart,
      setQty: (id, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      removeLine: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      toggleGift: (id) =>
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, gift: !l.gift } : l))),
      setGift: (id, gift) =>
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, gift } : l))),
      setGiftMessage: (id, message) =>
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, giftMessage: message } : l))),
      clearCart: () => setLines([]),
      refreshSettings,
      refreshCatalog,
      toggleWishlist: (slug) =>
        setWishlist((prev) =>
          prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
        ),
      toggleCompare: (slug) =>
        setCompare((prev) =>
          prev.includes(slug)
            ? prev.filter((s) => s !== slug)
            : prev.length >= 3
              ? prev
              : [...prev, slug],
        ),
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      giftTotal,
      shipping,
      charges,
      chargesTotal,
      total: subtotal + giftTotal + shipping + chargesTotal,
      lineProduct,
    };
  }, [
    lines,
    wishlist,
    compare,
    cartOpen,
    addToCart,
    refreshSettings,
    refreshCatalog,
    products,
    categories,
    settings,
    catalogLoading,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Brand name/tagline from settings, with defaults when the API fails. */
export function useBrand(): BrandInfo {
  const { settings } = useStore();
  return resolveBrand(settings);
}

export const money = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export function apiProductToProduct(p: ProductDoc): Product {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.categorySlug || p.category,
    price: p.price,
    compareAt: p.compareAt,
    rating: p.rating,
    reviewCount: p.reviewCount,
    images: (p.images || []).map(mediaUrl),
    short: p.short,
    description: p.description,
    specs: p.specs || [],
    colors: (p.colors || []).map((v, i) => ({
      id: v._id || `color-${i}`,
      label: v.label,
      type: "color" as const,
      value: v.value,
      image: v.image ? mediaUrl(v.image) : undefined,
    })),
    sizes: (p.sizes || []).map((v, i) => ({
      id: v._id || `size-${i}`,
      label: v.label,
      type: "size" as const,
      image: v.image ? mediaUrl(v.image) : undefined,
    })),
    inStock: p.inStock,
    stock: p.stock,
    soldCount: p.soldCount ?? 0,
    flags: p.flags.filter((f): f is "new" | "hot" => f === "new" || f === "hot"),
    reviews: (p.reviews || []).map((r, i) => ({
      id: r.id || r._id || `review-${i}`,
      userId: (r as { userId?: string | null }).userId ?? null,
      author: r.author,
      rating: r.rating,
      date: r.date || r.createdAt?.slice(0, 10) || "",
      title: r.title || "",
      body: r.body,
      authorImage: r.authorImage ? mediaUrl(r.authorImage) : undefined,
      images: (r.images || []).map(mediaUrl),
      videos: (r.videos || []).map(mediaUrl),
    })),
  };
}
