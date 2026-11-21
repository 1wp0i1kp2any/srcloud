import { defineForm, field, v } from "@/lib/form";

/**
 * Описание формы входа: изоморфный модуль. Его импортируют и страница,
 * и серверный экшен — один и тот же код проверяет обе стороны.
 */
export const auth = defineForm({
  id: "auth",
  revision: 1,
  cardinality: "first",
  actions: [{ id: "submit", label: "Войти", validate: "full" }],
  fields: {
    email: field.email({
      label: "Почта",
      placeholder: "user@example.com",
      validate: [v.required(), v.email()],
    }),
    password: field.password({
      label: "Пароль",
      placeholder: "secret123",
      validate: [v.required(), v.minLength(6)],
    }),
  },
});
