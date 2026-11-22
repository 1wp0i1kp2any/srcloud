"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";

import CollapsingHeader, { type HeaderRows } from "./collapsing-header";

export interface SidebarSlots {
  top?: ReactNode[];
  middle?: ReactNode[];
  bottom?: ReactNode[];
}

const SIDEBAR_ID = "app-sidebar";

/**
 * Каркас приложения: сворачиваемая шапка, трёхзонный сайдбар и скроллер.
 * Drawer на узком экране работает через скрытый checkbox — открывается и
 * закрывается без JS; Escape и возврат по истории добавляются эффектом.
 */
export function AppShell({
  header,
  sidebar = {},
  children,
}: {
  header: HeaderRows;
  sidebar?: SidebarSlots;
  children: ReactNode;
}) {
  const toggleRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const hasSidebar =
    (sidebar.top?.length ?? 0) +
      (sidebar.middle?.length ?? 0) +
      (sidebar.bottom?.length ?? 0) >
    0;

  useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;

    let pushed = false;

    const onChange = () => {
      if (toggle.checked && !pushed) {
        pushed = true;
        history.pushState(
          { ...(history.state ?? {}), appSidebar: 1 },
          "",
          location.href,
        );
      }
    };

    const onPop = () => {
      pushed = false;
      toggle.checked = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && toggle.checked) {
        event.preventDefault();
        toggle.checked = false;
      }
    };

    toggle.addEventListener("change", onChange);
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      toggle.removeEventListener("change", onChange);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-clip bg-background text-foreground">
      <CollapsingHeader
        leading={(row) =>
          row === "top" && hasSidebar ? (
            <label
              aria-controls={SIDEBAR_ID}
              aria-label="Открыть панель"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground lg:hidden"
              htmlFor={SIDEBAR_ID}
              role="button"
              tabIndex={0}
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </label>
          ) : null
        }
        rows={header}
        scrollContainer={mainRef}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Скрытый checkbox — peer для панели и подложки: drawer работает без JS. */}
        <input
          ref={toggleRef}
          aria-hidden="true"
          className="peer/sidebar sr-only"
          id={SIDEBAR_ID}
          tabIndex={-1}
          type="checkbox"
        />

        {hasSidebar && (
          <label
            aria-label="Закрыть подложку"
            className="fixed inset-0 z-30 hidden bg-foreground/45 peer-checked/sidebar:block lg:hidden"
            htmlFor={SIDEBAR_ID}
          />
        )}

        {hasSidebar && (
          <aside
            className={cn(
              "flex w-[260px] shrink-0 flex-col border-r border-border/70 bg-background",
              "max-lg:fixed max-lg:inset-y-0 max-lg:z-40 max-lg:hidden max-lg:peer-checked/sidebar:flex",
            )}
            id={`${SIDEBAR_ID}-panel`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3 lg:hidden">
              <span className="text-sm font-semibold">Панель</span>
              <label
                aria-label="Закрыть панель"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                htmlFor={SIDEBAR_ID}
                role="button"
                tabIndex={0}
              >
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </label>
            </div>

            {(sidebar.top?.length ?? 0) > 0 && (
              <div className="flex shrink-0 flex-col gap-2 border-b border-border/50 p-3">
                {sidebar.top}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
              {sidebar.middle}
            </div>

            {(sidebar.bottom?.length ?? 0) > 0 && (
              <div className="flex shrink-0 flex-col gap-2 border-t border-border/50 p-3">
                {sidebar.bottom}
              </div>
            )}
          </aside>
        )}

        <main
          ref={mainRef}
          className="flex min-w-0 flex-1 flex-col overflow-y-auto outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <Toaster closeButton position="bottom-right" richColors />
    </div>
  );
}