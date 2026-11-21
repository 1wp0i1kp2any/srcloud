"use server";

import { stableId, type FormError } from "@/lib/form";

import { defineAction } from "@/features/shared/define-action";

import { auth } from "./contract";

const DEMO_EMAIL = "user@example.com";
const DEMO_PASSWORD = "secret123";

const invalidCredentials = (): FormError => ({
  id: stableId({ code: "auth.invalid" }),
  code: "auth.invalid",
  message: "Неверная почта или пароль",
  path: "password",
  origin: "server",
});

/**
 * Единственное серверное действие фичи входа. Протокол живёт в defineAction:
 * проверка по описанию, конверт, Result, plain-объекты. Здесь — только правило.
 */
export const signIn = defineAction<{ email: string }>(auth, {
  run: ({ email, password }) => {
    const mail = String(email ?? "").trim().toLowerCase();
    const pass = String(password ?? "");

    if (mail !== DEMO_EMAIL || pass !== DEMO_PASSWORD) {
      return { ok: false, errors: [invalidCredentials()] };
    }

    return { ok: true, data: { email: mail } };
  },
});