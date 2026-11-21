# Security: env-driven CORS and origin policy

src/env/parse.ts — pure validators (originList, flag, choice); src/env/index.ts reads Cloudflare `env` once at startup and fails fast.
src/server/cors.ts — request middleware (first in defineApp):
- same-origin untouched;
- allowed origins (APP_ORIGINS) get CORS headers with credentials and Vary: Origin;
- SECURITY_MODE=strict rejects mutating requests from unknown origins; framework keeps rwsdk's own Origin check for actions; off is local-only.
worker.tsx passes APP_ORIGINS to defineApp({ allowedOrigins }) — required for cross-origin action calls.

Known limitation: OPTIONS is answered by the rwsdk router before our middleware, so preflight responses carry no ACAO. RSC/FormData requests are CORS-simple (text/plain or multipart), so browsers do not preflight; if a non-simple request appears, add an explicit OPTIONS route.

Cookies: config.cookies (secure/prefix) is ready; actual session cookies come with defineDurableSession.