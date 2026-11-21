import { env } from "cloudflare:workers";

import { parseEnv } from "./parse";

/**
 * Единственный перечень переменных приложения. Читается один раз при старте
 * воркера; ошибка в значении останавливает старт и называет переменную.
 * Значения приходят из `.env` (локально RWSDK линкует его в `.dev.vars`)
 * и из `vars`/секретов воркера в проде.
 */
export const config = parseEnv(env as unknown as Record<string, string | undefined>, {
  prod: import.meta.env.PROD,
});