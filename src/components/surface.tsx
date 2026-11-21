"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { Result } from "@/lib/form";

const Continuation = createContext<Result | null>(null);

/**
 * Результат нативного POST, доступный формам внутри Surface. Явный проп
 * у формы важнее контекста; ближайший Surface важнее внешнего.
 */
export function useSurfaceContinuation(
  explicit?: Result | null,
): Result | null {
  return explicit ?? useContext(Continuation);
}

/**
 * Область страницы: раздаёт формам результат серверного действия и задаёт
 * корневой элемент. `render` — точка расширения: сюда можно передать свой
 * корень (например, ACL-гейт), Surface просто клонирует его с детьми.
 */
export function Surface({
  continuation = null,
  render,
  className,
  children,
}: {
  continuation?: Result | null;
  render?: ReactElement<{ children?: ReactNode }>;
  className?: string;
  children: ReactNode;
}) {
  const content = isValidElement(render) ? (
    cloneElement(render, undefined, children)
  ) : (
    <div className={className}>{children}</div>
  );

  return (
    <Continuation.Provider value={continuation}>
      {content}
    </Continuation.Provider>
  );
}