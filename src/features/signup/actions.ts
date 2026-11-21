"use server";

import { CheckRegistry, issue, stableId, type FormError } from "@/lib/form";

import { serverQuery } from "rwsdk/worker";

import { defineAction } from "@/features/shared/define-action";

import { signup } from "./contract";

/** Демонстрационный список занятых адресов: в проде — запрос к БД. */
const TAKEN = new Set(["taken@example.com", "admin@example.com"]);

/** `serverQuery` не перерисовывает страницу — важно для дебаунс-проверки. */
export const isEmailTaken = serverQuery(async (email: string) => {
  return TAKEN.has(email.trim().toLowerCase());
});

const checks = new CheckRegistry().register("email-taken", async (value) => {
  if (typeof value !== "string" || !value.includes("@")) return null;
  return (await isEmailTaken(value)) ? issue("email.taken") : null;
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