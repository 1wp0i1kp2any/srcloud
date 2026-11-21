"use client";

import { visibleFields } from "@/lib/form";
import type { BoundForm } from "@/lib/form/react";

import { FormField } from "./form-field";
import type { FormTexts } from "./types";

/**
 * Видимые поля в порядке описания. Условие видимости — данные описания,
 * поэтому фильтр живёт здесь, а не в каждой форме.
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