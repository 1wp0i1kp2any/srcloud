import type { RequestInfo } from "rwsdk/worker";

import { formActions, type FormActionName } from "@/features/shared/form-actions";

/**
 * Нативный путь отправки формы (браузер без JS или страница без гидрации).
 *
 * rwsdk 1.7.5 не обрабатывает `$ACTION_ID`, поэтому форма уходила бы просто
 * перезагрузкой страницы. Здесь POST с нашим скрытым полем `__form_action`
 * вызывает то же серверное действие, а результат кладётся в `rw.actionResult`:
 * страница рендерится с ним, и `useForm` показывает ошибки до гидрации.
 */
export async function formAction({ request, rw }: RequestInfo): Promise<void> {
  if (request.method !== "POST") return;

  const url = new URL(request.url);
  // JS-путь: вызов действия через RSC обрабатывает сам фреймворк.
  if (url.searchParams.has("__rsc_action_id")) return;

  const type = request.headers.get("content-type") ?? "";
  if (
    !type.startsWith("multipart/form-data") &&
    !type.startsWith("application/x-www-form-urlencoded")
  ) {
    return;
  }

  let data: FormData;
  try {
    data = await request.clone().formData();
  } catch {
    return;
  }

  const name = data.get("__form_action");
  if (typeof name !== "string" || !(name in formActions)) return;

  const action = formActions[name as FormActionName];
  rw.actionResult = await action(data);
}