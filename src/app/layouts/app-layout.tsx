import type { LayoutProps } from "rwsdk/router";
import { requestInfo as currentRequest } from "rwsdk/worker";

import type { Result } from "@/lib/form";

import { AppShell } from "@/components/shell/app-shell";
import { Surface } from "@/components/surface";

import { pageHeader, pageSidebar } from "@/app/page-config";

/**
 * Шаблон сайта: шапка и сайдбар из конфига страницы, контент — в Surface,
 * чтобы формы получили результат нативного POST.
 */
export function AppLayout({ children, requestInfo }: LayoutProps) {
  const info = requestInfo ?? currentRequest;
  const continuation = (info.rw.actionResult as Result | undefined) ?? null;
  const path = info.path;

  return (
    <AppShell header={pageHeader(path)} sidebar={pageSidebar(path)}>
      <Surface
        className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-8"
        continuation={continuation}
      >
        {children}
      </Surface>
    </AppShell>
  );
}