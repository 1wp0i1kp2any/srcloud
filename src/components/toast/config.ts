/**
 * Настройка уведомлений: одна точка, которую можно менять на лету.
 * Сами тосты живут в клиентском компоненте; этот модуль — только данные.
 */

export type ToastPosition = "top-center" | "bottom-center";

export interface ToastPreset {
  readonly position: ToastPosition;
  readonly duration: number;
  readonly max: number;
}

export interface ToastConfig {
  readonly enabled: boolean;
  readonly desktop: ToastPreset;
  readonly mobile: ToastPreset;
}

const initial: ToastConfig = {
  enabled: true,
  desktop: { position: "bottom-center", duration: 4000, max: 3 },
  mobile: { position: "top-center", duration: 3000, max: 2 },
};

let current = initial;
const listeners = new Set<() => void>();

/** Частичное обновление на лету: например, после загрузки пользовательских настроек. */
export function configureToasts(next: {
  enabled?: boolean;
  desktop?: Partial<ToastPreset>;
  mobile?: Partial<ToastPreset>;
}): void {
  current = {
    ...current,
    ...(next.enabled === undefined ? {} : { enabled: next.enabled }),
    desktop: { ...current.desktop, ...next.desktop },
    mobile: { ...current.mobile, ...next.mobile },
  };
  for (const listener of listeners) listener();
}

export function getToastConfig(): ToastConfig {
  return current;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const MOBILE_QUERY = "(max-width: 640px)";

/** Пресет для текущего экрана: мобильное поведение отличается от десктопного. */
export function presetForViewport(): ToastPreset {
  const mobile =
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_QUERY).matches;
  return mobile ? current.mobile : current.desktop;
}

export { MOBILE_QUERY };