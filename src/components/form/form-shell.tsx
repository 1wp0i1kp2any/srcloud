"use client";

import type { ReactNode } from "react";

import type { BoundForm } from "@/lib/form/react";

/**
 * Форма как элемент: пропсы приходят из `formProps()`, отправку по умолчанию
 * перехватывает библиотека, `action` — серверная функция для нативной ветки.
 */
export function FormShell({
  form,
  action,
  children,
  className,
}: {
  form: BoundForm;
  action: (formData: FormData) => Promise<unknown>;
  children: ReactNode;
  className?: string;
}) {
  // React типизирует action как void, но SDK кладёт возврат в
  // `requestInfo.rw.actionResult` — оттуда страница берёт continuation.
  const submitAction = action as unknown as (
    formData: FormData,
  ) => Promise<void>;

  // React сам задаёт method/encType для формы с функцией-действием; если
  // передать их из formProps, он предупреждает и всё равно переопределяет.
  const { action: _action, method: _method, encType: _encType, ...rest } =
    form.formProps();

  return (
    <form {...rest} action={submitAction} className={className}>
      {form.hidden().map((hidden) => (
        <input key={hidden.name} {...hidden} />
      ))}
      {children}
    </form>
  );
}