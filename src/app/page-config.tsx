import type { ReactNode } from "react";

import {
  emptyRowSlots,
  type HeaderRow,
  type HeaderRows,
  type HeaderSide,
} from "@/components/shell/collapsing-header";
import type { SidebarSlots } from "@/components/shell/app-shell";

/**
 * Конфигурация страницы: что показать в шапке и сайдбаре. Живёт на сервере,
 * потому что шаблон читает её до рендера; слоты — элементы, не функции.
 */
export interface PageConfig {
  title?: string;
  header?: Partial<Record<HeaderRow, Partial<Record<HeaderSide, ReactNode[]>>>>;
  sidebar?: SidebarSlots;
}

const navItem =
  (href: string, label: string, active: boolean): ReactNode => (
    <a
      className={
        active
          ? "rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
      }
      href={href}
    >
      {label}
    </a>
  );

const pages: Record<string, PageConfig> = {
  "/": {
    title: "srcloud",
    header: {
      middle: {
        start: [
          <span className="text-sm font-semibold" key="title">
            srcloud
          </span>,
        ],
        end: [
          <a
            className="text-sm text-muted-foreground hover:text-foreground"
            href="https://github.com/1wp0i1kp2any/srcloud"
            key="repo"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>,
        ],
      },
    },
    sidebar: {
      middle: [navItem("/", "Главная", true), navItem("/welcome", "Готово", false)],
    },
  },
  "/welcome": {
    title: "Готово",
    sidebar: {
      middle: [navItem("/", "Главная", false), navItem("/welcome", "Готово", true)],
    },
  },
};

function mergeRows(
  base: PageConfig["header"],
  next: PageConfig["header"],
): PageConfig["header"] {
  const rows: PageConfig["header"] = {};
  for (const row of ["top", "middle", "bottom"] as HeaderRow[]) {
    const merged: Partial<Record<HeaderSide, ReactNode[]>> = { ...base?.[row] };
    for (const side of ["start", "center", "end"] as HeaderSide[]) {
      const value = next?.[row]?.[side];
      if (value) merged[side] = value;
    }
    if (Object.keys(merged).length > 0) rows[row] = merged;
  }
  return rows;
}

function resolve(path: string): PageConfig {
  const matched = Object.keys(pages)
    .filter((key) => key === path || path.startsWith(key === "/" ? "/" : key + "/"))
    .sort((a, b) => a.length - b.length);

  return matched.reduce<PageConfig>((acc, key) => {
    const next = pages[key]!;
    return {
      title: next.title ?? acc.title,
      header: mergeRows(acc.header, next.header),
      sidebar: {
        top: next.sidebar?.top ?? acc.sidebar?.top,
        middle: next.sidebar?.middle ?? acc.sidebar?.middle,
        bottom: next.sidebar?.bottom ?? acc.sidebar?.bottom,
      },
    };
  }, {});
}

/** Полные ряды шапки: конфиг страницы поверх пустых слотов. */
export function pageHeader(path: string): HeaderRows {
  const config = resolve(path);
  const rows: HeaderRows = {
    top: emptyRowSlots(),
    middle: emptyRowSlots(),
    bottom: emptyRowSlots(),
  };

  for (const row of ["top", "middle", "bottom"] as HeaderRow[]) {
    for (const side of ["start", "center", "end"] as HeaderSide[]) {
      const items = config.header?.[row]?.[side];
      if (items) {
        rows[row][side] = items.map((content, id) => ({ id, content }));
      }
    }
  }

  return rows;
}

export function pageSidebar(path: string): SidebarSlots {
  return resolve(path).sidebar ?? {};
}