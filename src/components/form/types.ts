import type { ReactNode } from "react";

import type { Result } from "@/lib/form";

/** Тексты, которые место подключения даёт универсальному рендереру. */
export interface FormTexts {
  /** Подпись пустого селекта. */
  selectPlaceholder?: string;
  /** Индикатор идущей асинхронной проверки. */
  checking?: ReactNode;
  /** Сообщение об успешной отправке. */
  success?: ReactNode;
  /** Подпись кнопки во время отправки. */
  pending?: ReactNode;
}

/** Что делать после подтверждённой отправки: решает место подключения. */
export type FormSuccessAction =
  | ((result: Result) => void)
  | { redirect: string };