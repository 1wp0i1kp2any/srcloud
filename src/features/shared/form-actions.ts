import { signIn } from "@/features/auth/actions";
import { signUp } from "@/features/signup/actions";

/**
 * Действия, доступные нативному (без-JS) POST. Имя — то, что приходит в
 * скрытом поле `__form_action`; значение — та же серверная функция, что и
 * для JS-пути. Регистрация здесь, чтобы не резолвить модули по строке.
 */
export const formActions = {
  "auth.signIn": signIn,
  "signup.submit": signUp,
} as const;

export type FormActionName = keyof typeof formActions;