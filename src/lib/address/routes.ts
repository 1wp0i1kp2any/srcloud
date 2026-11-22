// Реестр адресов: один маршрут — одна запись, свой владелец GET-ключей.
//
// Пара к keys.ts: там бронь ключей, тут — бронь самих адресов. Два компонента
// не могут зарегистрировать один и тот же маршрут (или один id): вторая
// регистрация с другими данными — исключение при старте, а не «кто последний,
// тот и прав». Одинаковая повторная регистрация идемпотентна: dev-SSR
// переоценивает модуль страницы, и это не должно ронять запрос.
//
// Ни одного фреймворкового импорта: `href`/`patch` — чистая алгебра адреса
// поверх `nextSearch`.

import { claimQuery, nextSearch, type QueryClaim, type QueryPatchValue } from "./keys";

/** Сырой разбор поиска: ключ → значение или список значений. */
export type RawQuery = Record<string, string | readonly string[] | undefined>;

/** Откуда читать поиск: URL, `URLSearchParams`, строка или уже разобранная запись. */
export type QueryInputSource = URL | URLSearchParams | string | RawQuery | null | undefined;

/** Схема поиска: превращает сырые параметры в типизированное значение. */
export type SearchSchema<Output> = (raw: RawQuery) => Output;

/** Опции статического маршрута: путь, схема поиска и метаданные. */
export interface StaticRouteOptions<
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
> {
  /** Уникальный идентификатор в реестре (по умолчанию совпадает с `path`). */
  readonly id?: string;
  /** Владелец GET-ключей (по умолчанию `id ?? path`). */
  readonly owner?: string;
  /** Бронируемые ключи строки запроса (`['stage', 'next']`, `'page.*'`). */
  readonly keys?: readonly QueryClaim[];
  /** Разбор query: битые значения чинит сама схема. */
  readonly search?: SearchSchema<SearchOutput>;
  /** Значения по умолчанию: совпадающие с ними не попадают в `href` / `patch`. */
  readonly defaults?: Partial<Record<keyof SearchInput & string, unknown>>;
}

/** Опции параметрического маршрута: шаблон пути и схема поиска. */
export interface ParamRouteOptions<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
> extends StaticRouteOptions<SearchInput, SearchOutput> {
  readonly id: string;
  readonly buildPath: (params: Params) => string;
}

/** Описание статического маршрута: разбор адреса и построение ссылки. */
export interface StaticRouteDescriptor<
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
> {
  readonly id: string;
  readonly owner: string;
  readonly path: string;
  /** Собрать ссылку маршрута. */
  readonly href: (search?: Partial<SearchInput>) => string;
  /** Разобрать query из `URL`, `URLSearchParams` или строки. */
  readonly parse: (from?: QueryInputSource) => SearchOutput;
  /** Точечно обновить свои ключи, сохранив все чужие параметры нетронутыми. */
  readonly patch: (
    from: URL | URLSearchParams | string,
    changes: Partial<Record<keyof SearchInput & string, QueryPatchValue>>,
    opts?: { drop?: readonly string[] },
  ) => string;
}

/** Описание параметрического маршрута: параметры пути и схема поиска. */
export interface ParamRouteDescriptor<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
> {
  readonly id: string;
  readonly owner: string;
  /** Собрать путь маршрута по параметрам сегментов. */
  readonly path: (params: Params) => string;
  /** Собрать ссылку маршрута по параметрам пути и query. */
  readonly href: (params: Params, search?: Partial<SearchInput>) => string;
  /** Разобрать query из `URL`, `URLSearchParams` или строки. */
  readonly parse: (from?: QueryInputSource) => SearchOutput;
  /** Точечно обновить свои ключи на конкретном пути, сохранив чужие параметры. */
  readonly patch: (
    from: URL | URLSearchParams | string,
    params: Params,
    changes: Partial<Record<keyof SearchInput & string, QueryPatchValue>>,
    opts?: { drop?: readonly string[] },
  ) => string;
}

/** Общий вид описания маршрута. */
export type RouteDescriptor<
  Params extends Record<string, string> | void = void,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
> = [Params] extends [void]
  ? StaticRouteDescriptor<SearchInput, SearchOutput>
  : ParamRouteDescriptor<Extract<Params, Record<string, string>>, SearchInput, SearchOutput>;

const routes = new Map<string, RouteDescriptor<never, never, unknown>>();
const routeSignatures = new Map<string, string>();

/** Зарегистрированные маршруты — для проверки ссылок на существование. */
export function registeredRoutes(): readonly RouteDescriptor<never, never, unknown>[] {
  return [...routes.values()];
}

/** Сброс реестра — для изолированных тестов. */
export function resetRegisteredRoutes(): void {
  routes.clear();
  routeSignatures.clear();
}

function extractSearchString(from: URL | URLSearchParams | string): string {
  if (from instanceof URL) return from.search;
  if (from instanceof URLSearchParams) {
    const qs = from.toString();
    return qs ? `?${qs}` : "";
  }
  const qIndex = from.indexOf("?");
  if (qIndex < 0) return "";
  const raw = from.slice(qIndex);
  const hashIndex = raw.indexOf("#");
  return hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
}

function toRawRecord(from: QueryInputSource): RawQuery {
  if (!from) return {};
  if (!(from instanceof URL) && !(from instanceof URLSearchParams) && typeof from !== "string") {
    return from;
  }
  const params = new URLSearchParams(extractSearchString(from));
  const out: RawQuery = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length <= 1 ? all[0] : all;
  }
  return out;
}

function normalizePatch(
  patch: Record<string, unknown> | undefined,
  defaults: Partial<Record<string, unknown>> | undefined,
): Record<string, QueryPatchValue> {
  if (!patch) return {};
  const normalized: Record<string, QueryPatchValue> = {};
  for (const [key, value] of Object.entries(patch)) {
    normalized[key] = (
      defaults && key in defaults && defaults[key] === value ? undefined : value
    ) as QueryPatchValue;
  }
  return normalized;
}

function createRouteCodec<SearchInput extends Record<string, unknown>, SearchOutput>(
  id: string,
  opts: StaticRouteOptions<SearchInput, SearchOutput> | undefined,
) {
  const owner = opts?.owner ?? id;
  const declaredKeys = opts?.keys ?? [];
  const claimAll = () => {
    if (declaredKeys.length > 0) claimQuery(owner, ...declaredKeys);
  };
  claimAll();

  const parse = (from?: QueryInputSource): SearchOutput => {
    const raw = toRawRecord(from);
    return opts?.search ? opts.search(raw) : (raw as unknown as SearchOutput);
  };

  const formatSearch = (
    from: URL | URLSearchParams | string,
    changes: Record<string, unknown> | undefined,
    patchOpts?: { drop?: readonly string[] },
  ): string => {
    if (!from && (!changes || Object.keys(changes).length === 0) && !patchOpts?.drop?.length) {
      return "";
    }
    claimAll();
    return nextSearch(
      owner,
      extractSearchString(from),
      normalizePatch(changes, opts?.defaults),
      patchOpts,
    );
  };

  return { id, owner, parse, formatSearch };
}

/** Стабильная подпись входных данных регистрации (для идемпотентности dev-SSR). */
function routeSignature(pathOrOptions: unknown, maybeOptions: unknown): string {
  if (typeof pathOrOptions === "string") {
    return JSON.stringify({ p: pathOrOptions, o: maybeOptions ?? null });
  }
  const o = (pathOrOptions ?? {}) as Record<string, unknown>;
  return JSON.stringify({
    id: o.id,
    keys: o.keys,
    owner: o.owner,
    defaults: o.defaults,
    hasBuildPath: typeof o.buildPath === "function",
  });
}

/** Объявляет типизированный маршрут, не добавляя его в реестр. */
export function defineRoute<
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  path: string,
  options?: StaticRouteOptions<SearchInput, SearchOutput>,
): StaticRouteDescriptor<SearchInput, SearchOutput>;
export function defineRoute<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  options: ParamRouteOptions<Params, SearchInput, SearchOutput>,
): ParamRouteDescriptor<Params, SearchInput, SearchOutput>;
export function defineRoute<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  pathOrOptions: string | ParamRouteOptions<Params, SearchInput, SearchOutput>,
  maybeOptions?: StaticRouteOptions<SearchInput, SearchOutput>,
):
  | StaticRouteDescriptor<SearchInput, SearchOutput>
  | ParamRouteDescriptor<Params, SearchInput, SearchOutput> {
  if (typeof pathOrOptions === "string") {
    const pathname = pathOrOptions;
    const core = createRouteCodec(maybeOptions?.id ?? pathname, maybeOptions);
    const descriptor: StaticRouteDescriptor<SearchInput, SearchOutput> = {
      id: core.id,
      owner: core.owner,
      path: pathname,
      parse: core.parse,
      href: (search) =>
        `${pathname}${core.formatSearch("", search as Record<string, unknown> | undefined)}`,
      patch: (from, changes, opts) =>
        `${pathname}${core.formatSearch(from, changes as Record<string, unknown>, opts)}`,
    };
    return descriptor;
  }

  const { buildPath } = pathOrOptions;
  const core = createRouteCodec(pathOrOptions.id, pathOrOptions);
  const descriptor: ParamRouteDescriptor<Params, SearchInput, SearchOutput> = {
    id: core.id,
    owner: core.owner,
    path: buildPath,
    parse: core.parse,
    href: (params, search) =>
      `${buildPath(params)}${core.formatSearch("", search as Record<string, unknown> | undefined)}`,
    patch: (from, params, changes, opts) =>
      `${buildPath(params)}${core.formatSearch(from, changes as Record<string, unknown>, opts)}`,
  };
  return descriptor;
}

/** Регистрирует маршрут. Другой маршрут с тем же id — исключение. */
export function registerRoute<
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  path: string,
  options?: StaticRouteOptions<SearchInput, SearchOutput>,
): StaticRouteDescriptor<SearchInput, SearchOutput>;
export function registerRoute<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  options: ParamRouteOptions<Params, SearchInput, SearchOutput>,
): ParamRouteDescriptor<Params, SearchInput, SearchOutput>;
export function registerRoute<
  Params extends Record<string, string>,
  SearchInput extends Record<string, unknown> = Record<string, never>,
  SearchOutput = SearchInput,
>(
  pathOrOptions: string | ParamRouteOptions<Params, SearchInput, SearchOutput>,
  maybeOptions?: StaticRouteOptions<SearchInput, SearchOutput>,
):
  | StaticRouteDescriptor<SearchInput, SearchOutput>
  | ParamRouteDescriptor<Params, SearchInput, SearchOutput> {
  const id =
    typeof pathOrOptions === "string" ? (maybeOptions?.id ?? pathOrOptions) : pathOrOptions.id;
  const existing = routes.get(id);
  if (existing) {
    const sig = routeSignature(pathOrOptions, maybeOptions);
    if (routeSignatures.get(id) === sig) return existing as never;
    throw new Error(`Маршрут «${id}» уже зарегистрирован в реестре адресов`);
  }

  const descriptor =
    typeof pathOrOptions === "string"
      ? defineRoute(pathOrOptions, maybeOptions)
      : defineRoute(pathOrOptions);
  routes.set(id, descriptor as never);
  routeSignatures.set(id, routeSignature(pathOrOptions, maybeOptions));
  return descriptor as never;
}
