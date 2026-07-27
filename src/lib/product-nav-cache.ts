import type { Product } from "@/data/catalog";

/** Last product the user clicked — lets the PDP paint instantly without waiting on the network. */
let primed: Product | null = null;

export function primeProductNav(product: Product) {
  primed = product;
}

export function consumePrimedProduct(slug: string): Product | null {
  if (primed && primed.slug === slug) {
    const next = primed;
    primed = null;
    return next;
  }
  return null;
}

export function peekPrimedProduct(slug: string): Product | null {
  return primed && primed.slug === slug ? primed : null;
}
