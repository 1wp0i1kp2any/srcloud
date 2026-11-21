"use client";

import type { LayoutProps } from "rwsdk/router";

import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/lib/use-is-mobile";

/**
 * Общий каркас страниц. Тостер монтируется здесь: Document рендерится вне
 * клиентского дерева и не гидрируется. Позиция — по единому правилу «мобильный».
 */
export function AppLayout({ children }: LayoutProps) {
  const mobile = useIsMobile();

  return (
    <>
      {children}
      <Toaster
        closeButton
        position={mobile ? "top-center" : "bottom-right"}
        richColors
      />
    </>
  );
}