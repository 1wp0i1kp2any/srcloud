import { requestInfo } from "rwsdk/worker";

import type { Result } from "@/lib/form";

/**
 * Результат серверного действия текущего запроса. Middleware `formAction`
 * кладёт его в `rw.actionResult` до рендера, поэтому страница отдаёт его
 * своим Surface, и ошибки нативного POST видны в SSR без гидрации.
 */
export function actionResult(): Result | null {
  return (requestInfo.rw.actionResult as Result | undefined) ?? null;
}
