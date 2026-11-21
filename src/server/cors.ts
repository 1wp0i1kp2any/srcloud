import type { RequestInfo } from "rwsdk/worker";

import { config, PREVIEW_ORIGIN } from "@/lib/env";

/**
 * CORS и проверка Origin для приложения, которое проксируется с разных доменов.
 *
 * Same-origin запросы проходят без изменений. Для разрешённых внешних origin
 * выставляются CORS-заголовки и отвечается preflight. В режиме `strict`
 * изменяющие запросы без разрешённого Origin отклоняются до действия.
 */
export function cors({ request, response }: RequestInfo): Response | void {
  if (config.securityMode === "off") return;

  const self = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  // `Origin: null` приходит из opaque origin (sandbox-iframe, replay в песочнице).
  // Разрешаем его только по явному флагу или на хосте превью: там формы должны
  // работать без JS, а настоящих данных и сессий нет.
  const nullAllowed = config.allowNullOrigin || self === PREVIEW_ORIGIN;
  const allowed = (value: string) =>
    (value === "null" && nullAllowed) ||
    value === self ||
    config.appOrigins.includes(value);
  const cross = origin !== null && origin !== self;

  const headers = new Headers();
  if (cross && allowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      request.headers.get("access-control-request-headers") ?? "content-type",
    );
    headers.set("Access-Control-Max-Age", "600");
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  for (const [name, value] of headers) response.headers.set(name, value);

  // Vary не перезаписываем: у ответа он может быть выставлен и другими слоями.
  if (cross && allowed(origin)) {
    const vary = new Set(
      (response.headers.get("Vary") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    vary.add("Origin");
    response.headers.set("Vary", [...vary].join(", "));
  }

  const mutating = request.method !== "GET" && request.method !== "HEAD";
  const ownCheck = config.securityMode === "strict";

  // Запросы действий уже проверил rwsdk по Origin; свой слой закрывает только
  // то, что через обработчик действий не проходит (нативный POST, маршруты).
  const isAction =
    new URL(request.url).searchParams.has("__rsc_action_id") ||
    request.headers.get("x-tsr-serverfn") === "true";

  if (ownCheck && mutating && !isAction && (!origin || !allowed(origin))) {
    // Диагностика: без этих полей невозможно понять, почему запрос отклонён.
    console.warn(
      "[cors] reject",
      JSON.stringify({
        method: request.method,
        origin,
        self,
        isAction,
        nullAllowed,
        allowed: config.appOrigins,
        path: new URL(request.url).pathname,
      }),
    );
    return new Response("Origin not allowed: " + (origin ?? "missing"), {
      status: 403,
    });
  }
}