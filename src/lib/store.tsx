import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products, type Product } from "@/data/catalog";

export type CartLine = {
  id: string;
  slug: string;
  color: string;
  size?: string;
  qty: number;
  gift: boolean;
};

export const GIFT_FEE = 6;
export const FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_FLAT = 6.5;

type StoreValue = {
  lines: CartLine[];
  wishlist: string[];
  compare: string[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (input: { slug: string; color?: string; size?: string; qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  toggleGift: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  toggleCompare: (slug: string) => void;
  count: number;
  subtotal: number;
  giftTotal: number;
  shipping: number;
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

  const addToCart: StoreValue["addToCart"] = useCallback((input) => {
    const product = products.find((p) => p.slug === input.slug);
    if (!product) return;
    const color = input.color ?? product.colors[0]?.label ?? "Default";
    const size = input.size ?? product.sizes?.[0]?.label;
    const id = [input.slug, color, size ?? "-"].join("::");
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + (input.qty ?? 1) } : l));
      }
      return [...prev, { id, slug: input.slug, color, size, qty: input.qty ?? 1, gift: false }];
    });
  }, []);

  const value = useMemo<StoreValue>(() => {
    const lineProduct = (line: CartLine) => products.find((p) => p.slug === line.slug);
    const subtotal = lines.reduce((sum, l) => sum + (lineProduct(l)?.price ?? 0) * l.qty, 0);
    const giftTotal = lines.filter((l) => l.gift).length * GIFT_FEE;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    return {
      lines,
      wishlist,
      compare,
      cartOpen,
      setCartOpen,
      addToCart,
      setQty: (id, qty) =>
        setLines((prev) =>
          qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      removeLine: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      toggleGift: (id) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, gift: !l.gift } : l))),
      clearCart: () => setLines([]),
      toggleWishlist: (slug) =>
        setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
      toggleCompare: (slug) =>
        setCompare((prev) =>
          prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= 3 ? prev : [...prev, slug],
        ),
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      giftTotal,
      shipping,
      total: subtotal + giftTotal + shipping,
      lineProduct,
    };
  }, [lines, wishlist, compare, cartOpen, addToCart]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });