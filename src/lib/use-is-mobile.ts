"use client";

import { useSyncExternalStore } from "react";

import { isMobileViewport, subscribeViewport } from "./viewport";

/**
 * Хук задаёт правило «мобильный экран». Все остальные места спрашивают его
 * (или `isMobileViewport()` вне React), а не считают ширину самостоятельно.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    () => false,
  );
}