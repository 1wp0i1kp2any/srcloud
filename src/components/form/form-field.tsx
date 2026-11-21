"use client";

import type { ComponentProps } from "react";

import type { BoundForm, FieldView } from "@/lib/form/react";

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

import type { FormTexts } from "./types";

type Attrs = Record<string, unknown>;

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

/**
 * Одно поле: вид элемента выбирается по `kind`, а не по имени формы.
 * Все ветви — на примитивах basecn.
 */
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
            <SelectTrigger {...aria} className="w-full" id={attrs.id as string}>
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