import type { SiteSettings } from "@/lib/api";

/** Shown when settings are missing or the API is offline. */
export const DEFAULT_BRAND_NAME = "APERTURE";
export const DEFAULT_TAGLINE = "Precision Tech, Monochrome";

export type BrandInfo = {
  name: string;
  tagline: string;
};

export function resolveBrand(settings?: Partial<SiteSettings> | null): BrandInfo {
  const name = (settings?.brandName || "").trim() || DEFAULT_BRAND_NAME;
  const tagline = (settings?.tagline || "").trim() || DEFAULT_TAGLINE;
  return { name, tagline };
}

/** Rewrite static route titles that were authored with the default brand. */
export function retitleWithBrand(title: string, brandName: string): string {
  const b = (brandName || "").trim() || DEFAULT_BRAND_NAME;
  if (!title) return title;
  return title
    .replace(/Aperture Admin/g, `${b} Admin`)
    .replace(/Aperture Account/g, `${b} Account`)
    .replace(/Aperture Journal/g, `${b} Journal`)
    .replace(/APERTURE Admin/g, `${b} Admin`)
    .replace(/ — Aperture$/g, ` — ${b}`)
    .replace(/ \| Aperture$/g, ` | ${b}`)
    .replace(/ — APERTURE$/g, ` — ${b}`)
    .replace(/ \| APERTURE$/g, ` | ${b}`)
    .replace(/^Aperture — /g, `${b} — `)
    .replace(/^APERTURE — /g, `${b} — `)
    .replace(/^Contact Aperture/g, `Contact ${b}`)
    .replace(/^About Aperture/g, `About ${b}`)
    .replace(/Notes from the Aperture Bench/g, `Notes from the ${b} Bench`)
    .replace(/Aperture · Admin/g, `${b} · Admin`)
    .replace(/APERTURE · Admin/g, `${b} · Admin`);
}

export const SITE_SETTINGS_UPDATED_EVENT = "site-settings-updated";

export function notifySiteSettingsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
}
