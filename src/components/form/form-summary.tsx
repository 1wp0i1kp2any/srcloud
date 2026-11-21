"use client";

import type { BoundForm } from "@/lib/form/react";

import type { FormTexts } from "./types";

/** Общие ошибки формы и сообщение об успехе — если место подключения его дало. */
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