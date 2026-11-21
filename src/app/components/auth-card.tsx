"use client";

import { useEffect, useId, useMemo } from "react";

import type { Result } from "@/lib/form";
import { createConfig, useForm } from "@/lib/form/react";
import { auth } from "@/forms/auth";

import { signIn } from "@/app/actions/auth";
import {
  FormFields,
  FormShell,
  FormSummary,
  SubmitButton,
  useFormSuccess,
  type FormSuccessAction,
} from "@/app/components/form";

/**
 * Одна форма входа для любого места: страница, модалка, вложенный экран.
 * Разметку строит общий рендерер, поэтому компонент не знает, где он
 * смонтирован, и не зависит от текущего URL.
 */
export function AuthCard({
  continuation = null,
  instance = "auth:new",
  onSuccess,
}: {
  continuation?: Result | null;
  /**
   * Идентификатор экземпляра: два монтирования одной формы не должны делить
   * результат. Место подключения решает, какой экземпляр перед ним.
   */
  instance?: string;
  /** Что делать после подтверждённого входа: решает место подключения. */
  onSuccess?: FormSuccessAction;
}) {
  // Два экземпляра на одной странице не должны делить DOM-id и aria-связи.
  const uid = useId().replace(/:/g, "");

  const config = useMemo(
    () =>
      createConfig({
        live: "after-touched",
        ui: { fieldId: (formId, name) => `${formId}-${uid}-${name}` },
      }),
    [uid],
  );

  const form = useForm(config, auth, {
    instance,
    intercept: true,
    continuation,
    transport: async ({ data }) => ({
      kind: "result",
      result: await signIn(data),
    }),
  });

  const texts = { pending: "Входим…" };

  useFormSuccess(form, onSuccess);

  // Результат нативной отправки приезжает пропом: поднимаем один раз.
  useEffect(() => {
    form.lift(continuation);
  }, [continuation]);

  return (
    <FormShell
      action={signIn}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
      form={form}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Вход</h2>
        <p className="text-sm text-muted-foreground">
          user@example.com / secret123
        </p>
      </div>

      <FormSummary form={form} texts={texts} />

      <FormFields form={form} texts={texts} />

      <SubmitButton className="w-full" form={form} label="Войти" texts={texts} />
    </FormShell>
  );
}
