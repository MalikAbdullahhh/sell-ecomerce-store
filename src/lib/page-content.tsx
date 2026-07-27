import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api";
import { mergeSection, type SectionValues } from "@/lib/page-schema";

type PageSections = Record<string, SectionValues>;

/**
 * Content already fetched this session. Keeping it outside React means moving
 * between pages (or re-mounting on a route transition) never flashes defaults.
 */
const cache = new Map<string, PageSections>();
const inflight = new Map<string, Promise<PageSections>>();

function loadPage(page: string): Promise<PageSections> {
  const cached = inflight.get(page);
  if (cached) return cached;

  const request = cmsApi
    .page(page)
    .then((res) => {
      const sections = (res.page?.sections || {}) as PageSections;
      cache.set(page, sections);
      return sections;
    })
    .catch(() => {
      // Offline / missing page: empty sections — never invent marketing copy.
      cache.set(page, {});
      return {} as PageSections;
    })
    .finally(() => inflight.delete(page));

  inflight.set(page, request);
  return request;
}

export type SectionReader = <T = SectionValues>(section: string) => T;

/**
 * Reads admin-managed content for a page. Returns a `section()` accessor that
 * always yields a complete object: saved values merged over schema defaults.
 */
export function usePageContent(page: string): { section: SectionReader; loaded: boolean } {
  const [saved, setSaved] = useState<PageSections>(() => cache.get(page) || {});
  const [loaded, setLoaded] = useState(() => cache.has(page));

  useEffect(() => {
    let active = true;
    if (cache.has(page)) {
      setSaved(cache.get(page) || {});
      setLoaded(true);
      return;
    }
    void loadPage(page).then((sections) => {
      if (!active) return;
      setSaved(sections);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [page]);

  const section = (<T,>(key: string) => mergeSection(page, key, saved[key]) as T) as SectionReader;

  return { section, loaded };
}

/** Clears the cache so the storefront picks up a fresh save from admin. */
export function invalidatePageContent(page?: string) {
  if (page) cache.delete(page);
  else cache.clear();
}
