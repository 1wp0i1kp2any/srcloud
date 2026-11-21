"use server";

import {
  evaluate,
  makeRenderer,
  ru,
  stableId,
  type FormError,
  type Result,
} from "@/lib/form";
import { auth } from "@/forms/auth";

/** Тот же instance, что у `useForm` на клиенте: иначе continuation не поднимется. */
const INSTANCE = "auth:new";

const render = makeRenderer(
  [auth.messages as never, ru],
  auth.policy.interpolate,
);

const DEMO_EMAIL = "user@example.com";
const DEMO_PASSWORD = "secret123";

/**
 * React Flight принимает только plain-объекты: `decode` библиотеки отдаёт
 * значения с null-прототипом, и такой `Result` падает при передаче в
 * клиентский компонент. Приводим данные к обычным объектам, не трогая
 * `File`/`Blob`/`Date` — их Flight умеет.
 */
function plain(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plain);
  if (value instanceof Date || (typeof Blob !== "undefined" && value instanceof Blob))
    return value;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = plain(item);
    return out;
  }
  return value;
}

/**
 * Единственная точка входа формы входа.
 *
 * Ожидаемые исходы — значением (`Result`), не исключением: валидация из
 * описания плюс бизнес-проверка учётных данных. Ошибка адресуется полю
 * `password`, чтобы интерфейс показал её у нужного поля.
 */
export async function signIn(
  formData: FormData,
): Promise<Result<{ email: string }>> {
  const evaluated = evaluate(formData, auth, {
    render,
    instance: INSTANCE,
    requireEnvelope: false,
  });

  // Номер отправки приходит из библиотеки: клиент сверяет его со своим,
  // иначе результат считается чужим. Нет номера — нативная отправка.
  const rawSubmission = formData.get(auth.policy.envelopeKeys.submission);
  const submissionId =
    typeof rawSubmission === "string" && rawSubmission.length > 0
      ? rawSubmission
      : crypto.randomUUID();

  const submission = {
    v: 1 as const,
    formId: auth.id,
    instance: INSTANCE,
    submissionId,
    revision: auth.revision,
    from: "action" as const,
    values: plain(evaluated.publicValues) as Record<string, unknown>,
    errors: [] as readonly FormError[],
  };

  if (evaluated.errors.length > 0) {
    return {
      ...submission,
      ok: false,
      status: auth.policy.status.validationFailed,
      outcome: "not-applied",
      errors: plain(evaluated.errors) as readonly FormError[],
    };
  }

  const email = String(evaluated.values.email ?? "").trim().toLowerCase();
  const password = String(evaluated.values.password ?? "");

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    const invalid: FormError = {
      id: stableId({ code: "auth.invalid" }),
      code: "auth.invalid",
      message: "Неверная почта или пароль",
      path: "password",
      origin: "server",
    };
    return {
      ...submission,
      ok: false,
      status: auth.policy.status.validationFailed,
      outcome: "not-applied",
      errors: [invalid],
    };
  }

  return {
    ...submission,
    ok: true,
    status: auth.policy.status.ok,
    outcome: "committed",
    data: { email },
  };
}
