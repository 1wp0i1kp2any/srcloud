/**
 * Единственное определение «мобильный экран» в приложении.
 * Компоненты и не-React код читают правило отсюда, а не считают ширину сами.
 */

export const MOBILE_BREAKPOINT = 768;

export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const media = (): MediaQueryList | undefined =>
  typeof window === "undefined" ? undefined : window.matchMedia(MOBILE_QUERY);

/** Текущее состояние для кода вне React: обработчиков ошибок, стора, адаптеров. */
export function isMobileViewport(): boolean {
  return media()?.matches ?? false;
}

export function subscribeViewport(listener: () => void): () => void {
  const query = media();
  if (!query) return () => {};
  query.addEventListener("change", listener);
  return () => {
    query.removeEventListener("change", listener);
  };
}