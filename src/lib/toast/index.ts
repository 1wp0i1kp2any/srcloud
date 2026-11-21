/**
 * Точка доступа к уведомлениям: без React и без UI-библиотеки.
 * Приложение зовёт `notify` и `configureToasts` отсюда; конкретный
 * рендерер (sonner) подключается адаптером через `setToastSink`.
 */

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastKind = "success" | "error" | "info" | "warning" | "message";

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

export interface ToastInput {
  readonly message: string;
  readonly description?: string;
  /** Перебивает длительность пресета для одного сообщения. */
  readonly duration?: number;
  readonly id?: string;
}

/** Адаптер рендерера: получает вид, текст и пресет текущего экрана. */
export type ToastSink = (
  kind: ToastKind,
  input: ToastInput,
  preset: ToastPreset,
) => void;

const MOBILE_QUERY = "(max-width: 640px)";

export const initialToastConfig: ToastConfig = {
  enabled: true,
  desktop: { position: "bottom-center", duration: 4000, max: 3 },
  mobile: { position: "top-center", duration: 3000, max: 2 },
};

let config = initialToastConfig;
let sink: ToastSink | undefined;
let viewport: () => boolean = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
const listeners = new Set<() => void>();

const emitChange = () => {
  for (const listener of listeners) listener();
};

/** Подключает рендерер; `undefined` — отключить. Вызывает адаптер. */
export function setToastSink(next?: ToastSink): void {
  sink = next;
}

/**
 * Меняет настройки на лету: частичное обновление, без пересоздания рендерера.
 * Например, после загрузки пользовательских предпочтений.
 */
export function configureToasts(next: {
  enabled?: boolean;
  desktop?: Partial<ToastPreset>;
  mobile?: Partial<ToastPreset>;
}): void {
  config = {
    ...config,
    ...(next.enabled === undefined ? {} : { enabled: next.enabled }),
    desktop: { ...config.desktop, ...next.desktop },
    mobile: { ...config.mobile, ...next.mobile },
  };
  emitChange();
}

export function getToastConfig(): ToastConfig {
  return config;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Подмена определения «мобильный экран» — для тестов и встраивания. */
export function setToastViewport(isMobile: () => boolean): void {
  viewport = isMobile;
}

/** Пресет, который сейчас получит уведомление. */
export function currentToastPreset(): ToastPreset {
  return viewport() ? config.mobile : config.desktop;
}

/** Единственная функция, которой приложение показывает уведомление. */
export function notify(
  kind: ToastKind,
  message: string,
  input: Omit<ToastInput, "message"> = {},
): void {
  if (!config.enabled || !sink) return;
  sink(kind, { message, ...input }, currentToastPreset());
}

export const toast = {
  success: (message: string, input?: Omit<ToastInput, "message">) =>
    notify("success", message, input),
  error: (message: string, input?: Omit<ToastInput, "message">) =>
    notify("error", message, input),
  info: (message: string, input?: Omit<ToastInput, "message">) =>
    notify("info", message, input),
  warning: (message: string, input?: Omit<ToastInput, "message">) =>
    notify("warning", message, input),
  message: (message: string, input?: Omit<ToastInput, "message">) =>
    notify("message", message, input),
};