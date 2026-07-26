import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { retitleWithBrand } from "@/lib/brand";
import { useBrand } from "@/lib/store";

/** Keeps document.title in sync with the permanent brand name. */
export function BrandMetaSync() {
  const { name, tagline } = useBrand();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let next = retitleWithBrand(document.title, name);
    if (pathname === "/" && tagline) {
      next = `${name} — ${tagline}`;
    }
    if (next !== document.title) document.title = next;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      const content = ogTitle.getAttribute("content") || "";
      const updated =
        pathname === "/" && tagline ? `${name} — ${tagline}` : retitleWithBrand(content, name);
      if (updated !== content) ogTitle.setAttribute("content", updated);
    }
  }, [name, tagline, pathname]);

  return null;
}
