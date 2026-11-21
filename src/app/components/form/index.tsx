"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { visibleFields, type Result } from "@/lib/form";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
 *
 * Тексты сюда не вшиты: универсальный компонент не решает, что читает
 * пользователь. Всё, что видно, приходит через `texts` от фичи.
 */

type Attrs = Record<string, unknown>;

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

/**
 * Успех обрабатывает место подключения: модалка закрывается, маршрут
 * переходит. Рендерер только сообщает, что сервер подтвердил отправку.
 */
export function useFormSuccess(
  form: BoundForm,
  onSuccess?: (result: Result) => void,
) {
  const seen = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!onSuccess) return;
    const result = form.state.result;
    if (!result?.ok) return;
    if (seen.current === result.submissionId) return;
    seen.current = result.submissionId;
    onSuccess(result);
  }, [onSuccess, form.state.result?.ok, form.state.result?.submissionId]);
}

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
  texts,
}: {
  form: BoundForm;
  texts?: FormTexts;
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
      {form.state.status === "success" && texts?.success && (
        <p className="text-sm text-emerald-600" role="status">
          {texts.success}
        </p>
      )}
    </>
  );
}

/**
 * Видимые поля в порядке описания. Условие видимости — данные описания,
 * поэтому фильтр живёт в рендерере, а не в каждой форме.
 */
export function FormFields({
  form,
  texts,
}: {
  form: BoundForm;
  texts?: FormTexts;
}) {
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
            texts={texts}
          />
        ))}
    </>
  );
}

/** Текст ошибки: async-проверки приходят с кодом, если словарь не сработал. */
function messageOf(form: BoundForm, error: { code: string; message?: string }) {
  if (error.message && error.message !== error.code) return error.message;
  return form.description.messages[error.code] ?? error.code;
}

/** Общие ARIA-связи поля, которые обязаны доехать до любого примитива. */
function fieldAria(attrs: Attrs) {
  return {
    "aria-invalid": attrs["aria-invalid"] as boolean | undefined,
    "aria-describedby": attrs["aria-describedby"] as string | undefined,
    "aria-errormessage": attrs["aria-errormessage"] as string | undefined,
  };
}

/** Одно поле: вид элемента выбирается по `kind`, а не по имени формы. */
export function FormField({
  form,
  name,
  texts,
}: {
  form: BoundForm;
  name: string;
  texts?: FormTexts;
}) {
  const field: FieldView = form.f[name];
  const attrs = field.attrs as Attrs;
  const aria = fieldAria(attrs);
  const change = (value: unknown) => field.onInput(value);

  const options = field.options ?? [];

  const control = (() => {
    switch (field.kind) {
      case "checkbox":
        return (
          <label className="flex items-center gap-2">
            <Checkbox
              {...aria}
              checked={Boolean(field.value)}
              id={attrs.id as string}
              name={attrs.name as string}
              onBlur={() => field.setTouched()}
              onCheckedChange={(checked) => change(checked)}
            />
            <span className="text-sm font-medium">{field.label}</span>
          </label>
        );

      case "multiselect": {
        const selected = new Set(
          Array.isArray(field.value) ? (field.value as string[]) : [],
        );
        return (
          <div className="flex flex-col gap-2" role="group">
            {options.map((option) => {
              const checked = selected.has(option.value);
              return (
                <label className="flex items-center gap-2" key={option.value}>
                  <Checkbox
                    checked={checked}
                    disabled={option.disabled}
                    name={attrs.name as string}
                    onBlur={() => field.setTouched()}
                    onCheckedChange={(next) => {
                      const updated = new Set(selected);
                      if (next) updated.add(option.value);
                      else updated.delete(option.value);
                      change([...updated]);
                    }}
                    value={option.value}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "select":
        return (
          <Select
            disabled={Boolean(attrs.disabled)}
            items={options}
            name={attrs.name as string}
            onValueChange={(value) => change(value)}
            value={String(field.value ?? attrs.value ?? "")}
          >
            <SelectTrigger
              {...aria}
              className="w-full"
              id={attrs.id as string}
            >
              <SelectValue placeholder={texts?.selectPlaceholder} />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {options.map((option) => (
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
        );

      case "radio":
        return (
          <RadioGroup
            {...aria}
            name={attrs.name as string}
            onValueChange={(value) => change(value)}
            value={String(field.value ?? attrs.value ?? "")}
          >
            {options.map((option) => {
              const id = `${attrs.id as string}-${option.value}`;
              return (
                <div className="flex items-center gap-2" key={option.value}>
                  <RadioGroupItem
                    disabled={option.disabled}
                    id={id}
                    value={option.value}
                  />
                  <Label htmlFor={id}>{option.label}</Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case "file":
      case "files": {
        const { value: _value, checked: _checked, ...fileAttrs } = attrs;
        return (
          <Input
            {...(fileAttrs as ComponentProps<typeof Input>)}
            onChange={(event) => {
              const files = event.currentTarget.files;
              change(
                field.kind === "files"
                  ? Array.from(files ?? [])
                  : (files?.[0] ?? null),
              );
            }}
            type="file"
          />
        );
      }

      case "textarea":
        return (
          <Textarea
            {...(attrs as ComponentProps<typeof Textarea>)}
            onBlur={() => field.setTouched()}
            onChange={(event) => change(event.currentTarget.value)}
          />
        );

      default:
        return (
          <Input
            {...(attrs as ComponentProps<typeof Input>)}
            aria-busy={field.checking || undefined}
            onBlur={() => field.setTouched()}
            onChange={(event) => change(event.currentTarget.value)}
          />
        );
    }
  })();

  return (
    <Field data-invalid={aria["aria-invalid"] || undefined}>
      {field.kind !== "checkbox" && (
        <FieldLabel {...field.labelProps()}>{field.label}</FieldLabel>
      )}
      {control}
      {field.help && (
        <FieldDescription {...field.helpProps()}>
          {field.help}
        </FieldDescription>
      )}
      {field.checking && texts?.checking && (
        <FieldDescription>{texts.checking}</FieldDescription>
      )}
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
  texts,
  className,
}: {
  form: BoundForm;
  label: string;
  texts?: FormTexts;
  className?: string;
}) {
  return (
    <Button
      {...form.intent("submit")}
      className={className}
      render={<button type="submit" />}
    >
      {form.state.pending ? (texts?.pending ?? label) : label}
    </Button>
  );
}
