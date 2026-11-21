"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Toaster as Sonner, toast as sonner } from "sonner";

import { getToastConfig, setToastSink, subscribeToasts } from "@/lib/toast";

const MOBILE_QUERY = "(max-width: 640px)";

function subscribeViewport(listener: () => void): () => void {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", listener);
  return () => {
    media.removeEventListener("change", listener);
  };
}

const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const isMobileOnServer = () => false;

/**
 * Адаптер sonner: единственное место, где ядро уведомлений встречается с
 * рендерером. Настройки читает из точки доступа и обновляет на лету.
 */
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

  useEffect(() => {
    setToastSink((kind, input, preset) => {
      sonner[kind](input.message, {
        description: input.description,
        duration: input.duration ?? preset.duration,
        id: input.id,
      });
    });
    return () => {
      setToastSink(undefined);
    };
  }, []);

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