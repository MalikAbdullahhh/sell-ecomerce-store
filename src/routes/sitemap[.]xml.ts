import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { API_URL } from "@/lib/api";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [productsRes, journalsRes, legalRes] = await Promise.all([
          fetchJson<{ products: { slug: string }[] }>("/products?limit=500"),
          fetchJson<{ posts: { slug: string }[] }>("/journals"),
          fetchJson<{ docs: { slug: string }[] }>("/cms/legal"),
        ]);

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/compare", changefreq: "monthly", priority: "0.5" },
          { path: "/wishlist", changefreq: "monthly", priority: "0.4" },
          { path: "/search", changefreq: "monthly", priority: "0.4" },
          { path: "/cart", changefreq: "monthly", priority: "0.3" },
          { path: "/checkout", changefreq: "monthly", priority: "0.3" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/journal", changefreq: "weekly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/account", changefreq: "yearly", priority: "0.3" },
          { path: "/account/orders", changefreq: "yearly", priority: "0.3" },
          ...(productsRes?.products || []).map((p) => ({
            path: `/product/${p.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
          ...(journalsRes?.posts || []).map((p) => ({
            path: `/journal/${p.slug}`,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          ...(legalRes?.docs || []).map((d) => ({
            path: `/legal/${d.slug}`,
            changefreq: "yearly" as const,
            priority: "0.3",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
