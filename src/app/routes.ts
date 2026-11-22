import { registerRoute } from "@/lib/address/routes";

/**
 * Маршруты приложения: один id — одна запись. Регистрация на импорте, чтобы
 * `worker.tsx` и проверка ссылок читали один и тот же адрес, а не две копии.
 */
export const homeRoute = registerRoute("/", { id: "home" });
export const welcomeRoute = registerRoute("/welcome", { id: "welcome" });
