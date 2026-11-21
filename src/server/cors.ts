import type { RequestInfo } from "rwsdk/worker";

import { config } from "@/env";

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
  const allowed = (value: string) =>
    value === self || config.appOrigins.includes(value);
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
    headers.set("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  for (const [name, value] of headers) response.headers.set(name, value);

  const mutating = request.method !== "GET" && request.method !== "HEAD";
  const ownCheck = config.securityMode === "strict";
  if (ownCheck && mutating && (!origin || !allowed(origin))) {
    return new Response("Origin not allowed", { status: 403 });
  }
}