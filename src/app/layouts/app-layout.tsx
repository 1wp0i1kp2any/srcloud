"use client";

import type { LayoutProps } from "rwsdk/router";

import { Toaster } from "@/components/toast";

/**
 * Общий каркас страниц: контейнер уведомлений живёт в клиентском дереве,
 * иначе он рендерится на сервере и никогда не монтируется.
 */
export function AppLayout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}