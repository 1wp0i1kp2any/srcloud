import {
  evaluate,
  makeRenderer,
  normalizeErrors,
  ru,
  runAsyncChecks,
  type CheckRegistry,
  type FormDescription,
  type FormError,
  type Result,
} from "@/lib/form";

import { plain } from "./plain";

/** Исход бизнес-части действия: данные или ошибки, без исключений. */
export type ActionOutcome<T> =
  | { ok: true; data?: T }
  | { ok: false; errors: FormError[] };

/**
 * Общий каркас серверного действия: описание формы + бизнес-правило.
 * Здесь живёт весь протокол — конверт, проверка, async-проверки, `Result`,
 * приведение к plain-объектам, — чтобы фича писала только свой случай.
 */
export function defineAction<T = undefined>(
  form: FormDescription,
  options: {
    /** Запасной экземпляр, если конверт не пришёл. */
    instance?: string;
    /** Асинхронные проверки, которые сервер выполняет всегда. */
    checks?: CheckRegistry;
    /** Бизнес-правило: вызывается только после успешной проверки. */
    run?: (
      values: Record<string, unknown>,
    ) => ActionOutcome<T> | Promise<ActionOutcome<T>>;
  } = {},
) {
  const render = makeRenderer(
    [form.messages as never, ru],
    form.policy.interpolate,
  );
  const fallbackInstance = options.instance ?? `${form.id}:new`;

  return async (formData: FormData): Promise<Result<T>> => {
    const rawInstance = formData.get(form.policy.envelopeKeys.instance);
    const instance =
      typeof rawInstance === "string" && rawInstance.length > 0
        ? rawInstance
        : fallbackInstance;

    const rawSubmission = formData.get(form.policy.envelopeKeys.submission);
    const submissionId =
      typeof rawSubmission === "string" && rawSubmission.length > 0
        ? rawSubmission
        : crypto.randomUUID();

    const evaluated = evaluate(formData, form, {
      render,
      instance,
      requireEnvelope: false,
    });

    const base = {
      v: 1 as const,
      formId: form.id,
      instance,
      submissionId,
      revision: form.revision,
      from: "action" as const,
      values: plain(evaluated.publicValues) as Record<string, unknown>,
    };

    let errors: FormError[] = [...evaluated.errors];

    if (errors.length === 0 && options.checks) {
      errors = normalizeErrors(
        await runAsyncChecks(form, evaluated.values, options.checks),
        render,
        form.policy.limits,
      );
    }

    if (errors.length === 0 && options.run) {
      const outcome = await options.run(evaluated.values);
      if (outcome.ok) {
        return {
          ...base,
          ok: true,
          status: form.policy.status.ok,
          outcome: "committed",
          errors: [],
          data: outcome.data,
        };
      }
      errors = outcome.errors;
    }

    if (errors.length === 0) {
      return {
        ...base,
        ok: true,
        status: form.policy.status.ok,
        outcome: "committed",
        errors: [],
      };
    }

    return {
      ...base,
      ok: false,
      status: form.policy.status.validationFailed,
      outcome: "not-applied",
      errors: plain(errors) as readonly FormError[],
    };
  };
}