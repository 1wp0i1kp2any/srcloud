import type { LayoutProps } from "rwsdk/router";
import { requestInfo as currentRequest } from "rwsdk/worker";

import { AppShell } from "@/components/shell/app-shell";

import { pageHeader, pageSidebar } from "@/app/page-config";

/**
 * Шаблон сайта: шапка и сайдбар из конфига страницы. Контент страницы
 * рендерится как есть — Surface'ы страница расставляет сама, их может быть
 * несколько, каждый со своим `render`/`className`.
 */
export function AppLayout({ children, requestInfo }: LayoutProps) {
  const path = (requestInfo ?? currentRequest).path;

  return (
    <AppShell header={pageHeader(path)} sidebar={pageSidebar(path)}>
      {children}
    </AppShell>
  );
}
