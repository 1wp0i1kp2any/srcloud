"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type { Result } from "@/lib/form";
import { createConfig, useForm } from "@/lib/form/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FormFields,
  FormShell,
  FormSummary,
  SubmitButton,
  useFormSuccess,
  type FormSuccessAction,
} from "@/components/form";

import { signIn } from "./actions";
import { auth } from "./contract";

/**
 * Форма входа: разметка из описания, серверное действие — из `./actions`.
 * Где смонтирована — не знает; успех обрабатывает место подключения.
 */
export function AuthCard({
  continuation = null,
  instance = "auth:new",
  onSuccess,
}: {
  continuation?: Result | null;
  /** Два монтирования одной формы не должны делить результат. */
  instance?: string;
  /** Что делать после подтверждённого входа: решает место подключения. */
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
      actionName="auth.signIn"
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

/**
 * Модальная точка подключения: тот же AuthCard, только закрытие диалога —
 * её собственное решение об успехе.
 */
export function AuthModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline" />}>
        Вход в модалке
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Вход</DialogTitle>
          <DialogDescription>
            Тот же компонент формы, что и на странице.
          </DialogDescription>
        </DialogHeader>
        <AuthCard instance="auth:modal" onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}