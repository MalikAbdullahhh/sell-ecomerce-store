import type { SiteSettings } from "@/lib/api";

/** Permanent store brand — used everywhere, no settings fetch required. */
export const DEFAULT_BRAND_NAME = "Tech Gadgets PK";
export const DEFAULT_TAGLINE = "Precision Tech, Monochrome";

const SETTINGS_CACHE_KEY = "aperture-site-settings-v2";

export type BrandInfo = {
  name: string;
  tagline: string;
  ready: boolean;
};

/** Always returns the permanent brand name immediately. */
export function resolveBrand(settings?: Partial<SiteSettings> | null): BrandInfo {
  const tagline = (settings?.tagline || "").trim() || DEFAULT_TAGLINE;
  return {
    name: DEFAULT_BRAND_NAME,
    tagline,
    ready: true,
  };
}

export function readCachedSiteSettings(): SiteSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteSettings;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedSiteSettings(settings: SiteSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Rewrite static route titles that were authored with the default brand. */
export function retitleWithBrand(title: string, brandName: string = DEFAULT_BRAND_NAME): string {
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
