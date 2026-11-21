"use client";

import { useSyncExternalStore } from "react";

// Узкий экран приложения. Порог живёт в CSS-токене `--mobile` на `:root`
// (src/app/styles.css), а не в TypeScript: правило одно на JS и на стили.
// До монтирования и без окна `matches` = false — это ПК.

const TOKEN = "--mobile";
let warned = false;
let cachedQuery: string | null = null;
let cachedMedia: MediaQueryList | null = null;

function readMobileQuery(): string | null {
  if (typeof document === "undefined") return null;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(TOKEN)
    .trim();
  const query = raw.replace(/^["']|["']$/g, "");

  if (!query) {
    if (import.meta.env.DEV && !warned) {
      warned = true;
      console.warn(`[mobile] нет ${TOKEN} на :root`);
    }
    return null;
  }

  return query;
}

function media(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  const query = readMobileQuery();
  if (!query) return null;
  if (cachedQuery === query && cachedMedia) return cachedMedia;

  cachedQuery = query;
  cachedMedia = window.matchMedia(query);
  return cachedMedia;
}

const getSnapshot = (): boolean => media()?.matches ?? false;

function subscribe(listener: () => void): () => void {
  const query = media();
  if (!query) return () => {};
  query.addEventListener("change", listener);
  return () => {
    query.removeEventListener("change", listener);
  };
}

/** Единственное правило «узкий экран»: компоненты спрашивают его, а не ширину. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}