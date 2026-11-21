"use client";

import { useSyncExternalStore } from "react";

import { toast as sonner, Toaster as Sonner, type ExternalToast } from "sonner";

import {
  MOBILE_QUERY,
  getToastConfig,
  presetForViewport,
  subscribeToasts,
} from "./config";

function subscribeViewport(listener: () => void): () => void {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", listener);
  return () => {
    media.removeEventListener("change", listener);
  };
}

const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const isMobileOnServer = () => false;

/** Контейнер уведомлений: позиция и лимит зависят от экрана. */
export function Toaster() {
  const config = useSyncExternalStore(
    subscribeToasts,
    getToastConfig,
    getToastConfig,
  );
  const mobile = useSyncExternalStore(
    subscribeViewport,
    isMobile,
    isMobileOnServer,
  );
  const preset = mobile ? config.mobile : config.desktop;

  return (
    <Sonner
      closeButton
      duration={preset.duration}
      position={preset.position}
      richColors
      theme="system"
      visibleToasts={preset.max}
    />
  );
}

type NotifyKind = "success" | "error" | "info" | "warning" | "message";

function emit(kind: NotifyKind, message: string, options?: ExternalToast): void {
  if (!getToastConfig().enabled) return;
  const preset = presetForViewport();
  sonner[kind](message, { duration: preset.duration, ...options });
}

/** Единственная точка вызова уведомлений в приложении. */
export const notify = {
  success: (message: string, options?: ExternalToast) =>
    emit("success", message, options),
  error: (message: string, options?: ExternalToast) =>
    emit("error", message, options),
  info: (message: string, options?: ExternalToast) =>
    emit("info", message, options),
  warning: (message: string, options?: ExternalToast) =>
    emit("warning", message, options),
  message: (message: string, options?: ExternalToast) =>
    emit("message", message, options),
};