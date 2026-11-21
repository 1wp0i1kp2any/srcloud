"use server";

import {
  evaluate,
  normalizeErrors,
  issue,
  makeRenderer,
  ru,
  runAsyncChecks,
  stableId,
  CheckRegistry,
  type FormError,
  type Result,
} from "@/lib/form";
import { serverQuery } from "rwsdk/worker";

import { signup } from "@/forms/signup";

import { plain } from "./plain";

const INSTANCE = "signup:new";

/** Демонстрационный список занятых адресов: в реальном приложении — запрос к БД. */
const TAKEN = new Set(["taken@example.com", "admin@example.com"]);

/**
 * `serverQuery` вместо обычного действия: ответ не перерисовывает страницу.
 * Server action на каждый дебаунс гонял бы весь RSC-рендер ради boolean.
 */
export const isEmailTaken = serverQuery(async (email: string) => {
  return TAKEN.has(email.trim().toLowerCase());
});

const checks = new CheckRegistry().register("email-taken", async (value) => {
  if (typeof value !== "string" || !value.includes("@")) return null;
  return (await isEmailTaken(value)) ? issue("email.taken") : null;
});

const render = makeRenderer(
  [signup.messages as never, ru],
  signup.policy.interpolate,
);

/**
 * Серверная половина регистрации: та же описательная проверка, что и в
 * браузере, плюс асинхронная занятость почты — она выполняется всегда,
 * независимо от того, что успел проверить клиент.
 */
export async function signUp(formData: FormData): Promise<Result<{ email: string }>> {
  const evaluated = evaluate(formData, signup, {
    render,
    instance: INSTANCE,
    requireEnvelope: false,
  });

  const rawSubmission = formData.get(signup.policy.envelopeKeys.submission);
  const submission = {
    v: 1 as const,
    formId: signup.id,
    instance: INSTANCE,
    submissionId:
      typeof rawSubmission === "string" && rawSubmission.length > 0
        ? rawSubmission
        : crypto.randomUUID(),
    revision: signup.revision,
    from: "action" as const,
    values: plain(evaluated.publicValues) as Record<string, unknown>,
  };

  const errors: FormError[] = [...evaluated.errors];
  if (errors.length === 0) {
    errors.push(
      ...normalizeErrors(
        await runAsyncChecks(signup, evaluated.values, checks),
        render,
        signup.policy.limits,
      ),
    );
  }

  if (errors.length > 0) {
    return {
      ...submission,
      ok: false,
      status: signup.policy.status.validationFailed,
      outcome: "not-applied",
      errors: plain(errors) as readonly FormError[],
    };
  }

  const email = String(evaluated.values.email ?? "").trim().toLowerCase();

  // Бизнес-правило, которое не выражается описанием: занятый домен.
  if (email.endsWith("@blocked.dev")) {
    const blocked: FormError = {
      id: stableId({ code: "signup.domain" }),
      code: "signup.domain",
      message: "Регистрация с этого домена недоступна",
      path: "email",
      origin: "server",
    };
    return {
      ...submission,
      ok: false,
      status: signup.policy.status.validationFailed,
      outcome: "not-applied",
      errors: [blocked],
    };
  }

  return {
    ...submission,
    ok: true,
    status: signup.policy.status.ok,
    outcome: "committed",
    errors: [],
    data: { email },
  };
}
