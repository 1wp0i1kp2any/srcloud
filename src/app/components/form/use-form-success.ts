"use client";

import { useEffect, useRef } from "react";

import { navigate } from "rwsdk/client";

import type { BoundForm } from "@/lib/form/react";

import type { FormSuccessAction } from "./types";

/**
 * Успех обрабатывает место подключения: модалка закрывается, маршрут
 * переходит. Рендерер только сообщает, что сервер подтвердил отправку.
 */
export function useFormSuccess(
  form: BoundForm,
  action?: FormSuccessAction,
) {
  const seen = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!action) return;
    const result = form.state.result;
    if (!result?.ok) return;
    if (seen.current === result.submissionId) return;
    seen.current = result.submissionId;
    if (typeof action === "function") action(result);
    else void navigate(action.redirect);
  }, [action, form.state.result?.ok, form.state.result?.submissionId]);
}