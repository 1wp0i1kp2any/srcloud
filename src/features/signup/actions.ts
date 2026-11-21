"use server";

import { CheckRegistry, issue, stableId, type FormError } from "@/lib/form";

import { serverQuery } from "rwsdk/worker";

import { defineAction } from "@/features/shared/define-action";

import { signup } from "./contract";

/**
 * Единственное место, где решается «почта занята». Сейчас — демонстрационный
 * набор; при подключении БД меняется только тело:
 *   const row = await db.users.findByEmail(email)
 *   return row !== null
 * Остальное (serverQuery, дебаунс, перепроверка на сервере) не трогается.
 */
async function lookupEmailTaken(email: string): Promise<boolean> {
  // TODO(db): заменить на запрос к БД — это единственная точка.
  const TAKEN = new Set(["taken@example.com", "admin@example.com"]);
  return TAKEN.has(email.trim().toLowerCase());
}

/** `serverQuery` не перерисовывает страницу — важно для дебаунс-проверки. */
export const isEmailTaken = serverQuery(lookupEmailTaken);

const checks = new CheckRegistry().register("email-taken", async (value) => {
  if (typeof value !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
    return null;
  return (await lookupEmailTaken(value)) ? issue("email.taken") : null;
});

const blockedDomain = (): FormError => ({
  id: stableId({ code: "signup.domain" }),
  code: "signup.domain",
  message: "Регистрация с этого домена недоступна",
  path: "email",
  origin: "server",
});

/**
 * Регистрация: describe-проверка, серверная занятость почты и бизнес-правило.
 * Протокол — в defineAction, здесь только правило фичи.
 */
export const signUp = defineAction<{ email: string }>(signup, {
  checks,
  run: ({ email }) => {
    const mail = String(email ?? "").trim().toLowerCase();
    if (mail.endsWith("@blocked.dev")) {
      return { ok: false, errors: [blockedDomain()] };
    }
    return { ok: true, data: { email: mail } };
  },
});