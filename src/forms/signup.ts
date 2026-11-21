import { check, defineForm, field, v } from "@/lib/form";

/**
 * Вторая форма — не ради «ещё одной», а чтобы были видны вещи, за которыми
 * библиотека нужна: живая проверка, асинхронная занятость почты, межполевое
 * правило, условное поле и чекбокс с обязательностью.
 */
export const signup = defineForm({
  id: "signup",
  revision: 1,
  cardinality: "first",
  messages: {
    "email.taken": "Эта почта уже занята",
    "check.failed": "Проверка не удалась, попробуйте ещё раз",
  },
  actions: [{ id: "submit", label: "Создать аккаунт", validate: "full" }],
  fields: {
    name: field.text({
      label: "Имя",
      placeholder: "Как к вам обращаться",
      validate: [v.required(), v.minLength(2)],
    }),
    email: field.email({
      label: "Почта",
      placeholder: "you@example.com",
      validate: [v.required(), v.email(), check("email-taken", { debounceMs: 350 })],
    }),
    password: field.password({
      label: "Пароль",
      validate: [v.required(), v.strength("good")],
    }),
    confirm: field.password({
      label: "Повторите пароль",
      validate: [v.required(), v.sameAs("password")],
    }),
    account: field.select({
      label: "Тип аккаунта",
      defaultValue: "personal",
      options: [
        { value: "personal", label: "Личный" },
        { value: "company", label: "Компания" },
      ],
    }),
    company: field.text({
      label: "Название компании",
      placeholder: "ООО «Пример»",
      visibleWhen: { field: "account", equals: "company" },
      validate: [v.required(), v.minLength(2)],
    }),
    terms: field.checkbox({
      label: "Согласен с условиями",
      validate: [v.required()],
    }),
  },
});
