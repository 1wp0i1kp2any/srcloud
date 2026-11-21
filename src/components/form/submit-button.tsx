"use client";

import type { BoundForm } from "@/lib/form/react";

import { Button } from "@/components/ui/button";

import type { FormTexts } from "./types";

/** Кнопка-намерение: `type="submit"` ставит `render`, иначе Base UI его съест. */
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