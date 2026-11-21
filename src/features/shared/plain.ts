/**
 * React Flight принимает только plain-объекты: значения из `decode` несут
 * null-прототип, и такой `Result` падает при передаче в клиентский компонент.
 * Приводим данные к обычным объектам, не трогая `File`/`Blob`/`Date` — их
 * Flight сериализует сам.
 */
export function plain(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plain);
  if (
    value instanceof Date ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  )
    return value;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = plain(item);
    return out;
  }
  return value;
}
