"use client";

import type { ComponentProps, ReactNode } from "react";

import { visibleFields } from "@/lib/form";
import type { BoundForm, FieldView } from "@/lib/form/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Общий рендерер форм: один раз на проект. Компонент не знает, какая форма
 * перед ним, — он разворачивает наборы пропсов, которые посчитало ядро.
 * Поэтому новая форма — это описание и композиция, а не новая разметка.
 */

type Attrs = Record<string, unknown>;

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

  return (
    <form {...form.formProps()} action={submitAction} className={className}>
      {form.hidden().map((hidden) => (
        <input key={hidden.name} {...hidden} />
      ))}
      {children}
    </form>
  );
}

export function FormSummary({
  form,
  successText = "Готово: сервер подтвердил отправку.",
}: {
  form: BoundForm;
  successText?: string;
}) {
  return (
    <>
      {form.common.length > 0 && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {form.common.map((error) => (
            <p key={error.id}>{error.message}</p>
          ))}
        </div>
      )}
      {form.state.status === "success" && (
        <p className="text-sm text-emerald-600" role="status">
          {successText}
        </p>
      )}
    </>
  );
}

/**
 * Видимые поля в порядке описания. Условие видимости — данные описания,
 * поэтому фильтр живёт в рендерере, а не в каждой форме.
 */
export function FormFields({ form }: { form: BoundForm }) {
  const visible = visibleFields(form.description, form.values);

  return (
    <>
      {form.description.fields
        .filter((descriptor) => visible.has(descriptor.name))
        .map((descriptor) => (
          <FormField
            form={form}
            key={descriptor.name}
            name={descriptor.name}
          />
        ))}
    </>
  );
}

/** Текст ошибки: async-проверки приходят с кодом вместо текста. */
function messageOf(form: BoundForm, error: { code: string; message?: string }) {
  if (error.message && error.message !== error.code) return error.message;
  return form.description.messages[error.code] ?? error.code;
}

/** Одно поле: вид элемента выбирается по `input`, а не по имени формы. */
export function FormField({ form, name }: { form: BoundForm; name: string }) {
  const field: FieldView = form.f[name];
  const attrs = field.attrs as Attrs;
  const change = (value: unknown) => field.onInput(value);
  const invalid = attrs["aria-invalid"] === true;
  const describedBy = attrs["aria-describedby"] as string | undefined;

  return (
    <Field data-invalid={invalid || undefined}>
      {field.input === "checkbox" ? (
        <div className="flex items-center gap-2">
          <Checkbox
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            checked={Boolean(field.value)}
            id={attrs.id as string}
            name={attrs.name as string}
            onBlur={() => field.setTouched()}
            onCheckedChange={(checked) => change(checked)}
          />
          <FieldLabel htmlFor={attrs.id as string}>{field.label}</FieldLabel>
        </div>
      ) : (
        <>
          <FieldLabel {...field.labelProps()}>{field.label}</FieldLabel>

          {field.input === "select" ? (
            <Select
              disabled={Boolean(attrs.disabled)}
              items={field.options}
              name={attrs.name as string}
              onValueChange={(value) => change(value)}
              value={String(field.value ?? attrs.value ?? "")}
            >
              <SelectTrigger
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className="w-full"
                id={attrs.id as string}
              >
                <SelectValue placeholder={field.placeholder ?? "Выберите…"} />
              </SelectTrigger>
              <SelectPositioner>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem
                      disabled={option.disabled}
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectPositioner>
            </Select>
          ) : field.input === "textarea" ? (
            <Textarea
              {...(attrs as ComponentProps<typeof Textarea>)}
              onBlur={() => field.setTouched()}
              onChange={(event) => change(event.currentTarget.value)}
            />
          ) : (
            <Input
              {...(attrs as ComponentProps<typeof Input>)}
              aria-busy={field.checking || undefined}
              onBlur={() => field.setTouched()}
              onChange={(event) => change(event.currentTarget.value)}
            />
          )}
        </>
      )}

      {field.help && (
        <FieldDescription {...field.helpProps()}>
          {field.help}
        </FieldDescription>
      )}
      {field.checking && <FieldDescription>Проверяем…</FieldDescription>}
      {field.errors.length > 0 && (
        <FieldError
          {...field.errorProps()}
          errors={field.errors.map((item) => ({
            message: messageOf(form, item),
          }))}
        />
      )}
    </Field>
  );
}

export function SubmitButton({
  form,
  label,
  className,
}: {
  form: BoundForm;
  label: string;
  className?: string;
}) {
  return (
    <Button
      {...form.intent("submit")}
      className={className}
      render={<button type="submit" />}
    >
      {form.state.pending ? "Отправляем…" : label}
    </Button>
  );
}
