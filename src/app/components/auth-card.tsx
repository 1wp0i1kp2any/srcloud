"use client";

import { useEffect, useId, useMemo } from "react";

import type { Result } from "@/lib/form";
import { createConfig, useForm } from "@/lib/form/react";
import { auth } from "@/forms/auth";

import { signIn } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Одна форма входа для любого места: страница, модалка, вложенный экран.
 *
 * Компонент не знает, где он смонтирован, и не зависит от текущего URL:
 * вызов сервера — это `signIn`, а не адрес. Разметку и проверку даёт
 * описание формы (`@/forms/auth`), UI — basecn.
 */
export function AuthCard({ continuation = null }: { continuation?: Result | null }) {
  // Два экземпляра на одной странице не должны делить DOM-id и aria-связи.
  const uid = useId().replace(/:/g, "");

  const config = useMemo(
    () =>
      createConfig({
        live: "after-touched",
        ui: {
          fieldId: (formId, name) => `${formId}-${uid}-${name}`,
        },
      }),
    [uid],
  );

  const form = useForm(config, auth, {
    instance: "auth:new",
    intercept: true,
    continuation,
    transport: async ({ data }) => ({
      kind: "result",
      result: await signIn(data),
    }),
  });

  // Серверный результат приезжает пропом после нативной отправки:
  // поднимаем его один раз, чтобы ошибки появились на той же странице.
  useEffect(() => {
    form.lift(continuation);
  }, [continuation]);

  const success = form.state.status === "success";
  const pending = form.state.pending;

  // React типизирует `action` как возвращающий void, но SDK кладёт возврат
  // функции в `requestInfo.rw.actionResult` — именно оттуда страница берёт
  // continuation для нативной (без-JS) отправки. Тип сужаем, поведение — нет.
  const submitAction = signIn as unknown as (
    formData: FormData,
  ) => Promise<void>;

  return (
    <form
      {...form.formProps()}
      action={submitAction}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Вход</h2>
        <p className="text-sm text-muted-foreground">
          user@example.com / secret123
        </p>
      </div>

      {form.common.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {form.common.map((error) => (
            <p key={error.id}>{error.message}</p>
          ))}
        </div>
      )}

      {auth.fields.map((descriptor) => {
        const field = form.f[descriptor.name];

        return (
          <div className="flex flex-col gap-2" key={field.name}>
            <Label {...field.labelProps()}>{field.label}</Label>
            <Input
              {...(field.attrs as React.ComponentProps<typeof Input>)}
              onChange={(event) => field.onInput(event.currentTarget.value)}
              onBlur={() => field.setTouched()}
            />
            {field.help && (
              <p className="text-xs text-muted-foreground" {...field.helpProps()}>
                {field.help}
              </p>
            )}
            {field.errors[0] && (
              <p className="text-sm text-destructive" {...field.errorProps()}>
                {field.errors[0].message}
              </p>
            )}
          </div>
        );
      })}

      <button
        {...form.intent("submit")}
        className={buttonVariants({ className: "w-full" })}
        type="submit"
      >
        {pending ? "Проверяем…" : "Войти"}
      </button>

      {success && (
        <p className="text-sm text-emerald-600" role="status">
          Готово: сервер подтвердил вход.
        </p>
      )}
    </form>
  );
}
