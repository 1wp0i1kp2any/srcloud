"use client";

import { useId, useMemo } from "react";

import { CheckRegistry, issue } from "@/lib/form";
import { createConfig, useForm } from "@/lib/form/react";
import { signup } from "@/forms/signup";

import { isEmailTaken, signUp } from "@/app/actions/signup";
import {
  FormFields,
  FormShell,
  FormSummary,
  SubmitButton,
  useFormSuccess,
  type FormSuccessAction,
} from "@/app/components/form";

/**
 * Демонстрация того, чего в React «из коробки» нет: живая проверка по
 * политике, асинхронная занятость почты с дебаунсом, межполевое правило,
 * условное поле и генерация атрибутов — всё из описания формы.
 */
export function SignupCard({
  onSuccess,
}: {
  onSuccess?: FormSuccessAction;
}) {
  const uid = useId().replace(/:/g, "");

  const config = useMemo(
    () =>
      createConfig({
        live: "after-touched",
        ui: { fieldId: (formId, name) => `${formId}-${uid}-${name}` },
      }),
    [uid],
  );

  // Ту же проверку сервер выполняет сам: браузерная версия — только
  // оптимизация, чтобы не ждать отправки.
  const checks = useMemo(
    () =>
      new CheckRegistry().register("email-taken", async (value, ctx) => {
        if (ctx.signal.aborted) return null;
        if (typeof value !== "string" || !value.includes("@")) return null;
        return (await isEmailTaken(value)) ? issue("email.taken") : null;
      }),
    [],
  );

  const form = useForm(config, signup, {
    instance: "signup:new",
    intercept: true,
    checks,
    transport: async ({ data }) => ({
      kind: "result",
      result: await signUp(data),
    }),
  });

  useFormSuccess(form, onSuccess);

  const texts = {
    success: "Готово: сервер принял заявку.",
    pending: "Отправляем…",
    checking: "Проверяем…",
    selectPlaceholder: "Выберите тип",
  };

  return (
    <FormShell
      action={signUp}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
      form={form}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Регистрация</h2>
        <p className="text-sm text-muted-foreground">
          taken@example.com занят, домен @blocked.dev запрещён сервером
        </p>
      </div>

      <FormSummary form={form} texts={texts} />

      <FormFields form={form} texts={texts} />

      <SubmitButton className="w-full" form={form} label="Создать аккаунт" texts={texts} />
    </FormShell>
  );
}
