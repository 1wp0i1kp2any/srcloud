/**
 * Разбор переменных окружения — чистые функции, без Cloudflare и без Vite.
 * Правила взяты из modals-kit (refs/core/src/env.ts): пустая строка = «не задано»,
 * ошибка называет переменную и длину значения, но никогда не печатает секрет.
 */

const split = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Список origin без пути, креденшелов и query. Дубликаты схлопываются. */
export function originList(name: string, raw: string | undefined): string[] {
  const out: string[] = [];

  for (const item of split(raw)) {
    let url: URL;
    try {
      url = new URL(item);
    } catch {
      throw new Error(`${name}: ожидался origin вида https://host, получено «${item}»`);
    }

    if (url.username || url.password) {
      throw new Error(`${name}: origin не должен содержать логин или пароль`);
    }
    if (url.origin !== item.replace(/\/+$/, "")) {
      throw new Error(`${name}: origin не должен содержать путь, query или хвостовой «/»`);
    }

    out.push(url.origin);
  }

  return [...new Set(out)];
}

/** Флаг: 1/true/yes в любом регистре; пусто — значение по умолчанию. */
export function flag(name: string, raw: string | undefined, fallback: boolean): boolean {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return fallback;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  throw new Error(`${name}: ожидался флаг 1/true/yes или 0/false/no`);
}

/** Одно значение из списка; пусто — значение по умолчанию. */
export function choice<T extends string>(
  name: string,
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = (raw ?? "").trim();
  if (!value) return fallback;
  if (!allowed.includes(value as T)) {
    throw new Error(`${name}: ожидалось одно из ${allowed.join(", ")}, получено «${value}»`);
  }
  return value as T;
}

export interface EnvInput {
  APP_ORIGINS?: string;
  SECURITY_MODE?: string;
  COOKIE_SECURE?: string;
  COOKIE_PREFIX?: string;
}

export interface AppConfig {
  /** Публичные origin, с которых приложение проксируется. */
  appOrigins: readonly string[];
  /** `framework` — CSRF закрыт rwsdk; `strict` — плюс своя проверка; `off` — только для локальных проб. */
  securityMode: "framework" | "strict" | "off";
  cookies: { secure: boolean; prefix: string };
}

/**
 * Адреса, которые разрешены всегда: превью песочницы проксирует приложение
 * с публичного домена, и без записи здесь любое действие получало бы 403.
 * Домены из APP_ORIGINS добавляются к этому списку.
 */
const BUILT_IN_ORIGINS: readonly string[] = ["https://preview.opencode.pzlb.ru"];

export function parseEnv(
  raw: EnvInput,
  defaults: { prod: boolean },
): AppConfig {
  return {
    appOrigins: [
      ...new Set([...BUILT_IN_ORIGINS, ...originList("APP_ORIGINS", raw.APP_ORIGINS)]),
    ],
    securityMode: choice("SECURITY_MODE", raw.SECURITY_MODE, [
      "framework",
      "strict",
      "off",
    ], "strict"),
    cookies: {
      secure: flag("COOKIE_SECURE", raw.COOKIE_SECURE, defaults.prod),
      prefix: raw.COOKIE_PREFIX ?? (defaults.prod ? "__Host-" : ""),
    },
  };
}