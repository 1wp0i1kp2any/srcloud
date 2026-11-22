import { beforeEach, describe, expect, it } from "vitest";

import { resetQueryClaims } from "./keys";
import {
  defineRoute,
  registerRoute,
  registeredRoutes,
  resetRegisteredRoutes,
  type ParamRouteOptions,
} from "./routes";

beforeEach(() => {
  resetRegisteredRoutes();
  resetQueryClaims();
});

describe("defineRoute", () => {
  it("собирает href и не сериализует значения по умолчанию", () => {
    const route = defineRoute("/items", { keys: ["page"], defaults: { page: 1 } });
    expect(route.href({ page: 1 })).toBe("/items");
    expect(route.href({ page: 2 })).toBe("/items?page=2");
  });

  it("patch сохраняет чужие параметры", () => {
    const route = defineRoute("/items", { keys: ["page"] });
    expect(route.patch("?q=x&page=1", { page: 2 })).toBe("/items?q=x&page=2");
  });

  it("parse отдаёт схему или сырые значения", () => {
    const typed = defineRoute("/items", {
      keys: ["page"],
      search: (raw) => ({ page: Number(raw.page ?? 1) }),
    });
    expect(typed.parse("?page=3")).toEqual({ page: 3 });
    expect(typed.parse("")).toEqual({ page: 1 });

    const raw = defineRoute("/items");
    expect(raw.parse("?page=3")).toEqual({ page: "3" });
  });

  it("параметрический маршрут собирает путь и search", () => {
    const options: ParamRouteOptions<{ id: string }, { tab?: string }> = {
      id: "card",
      buildPath: (params) => `/cards/${params.id}`,
      keys: ["tab"],
    };
    const card = defineRoute(options);
    expect(card.href({ id: "7" }, { tab: "files" })).toBe("/cards/7?tab=files");
    expect(card.patch("?x=1", { id: "7" }, { tab: "files" })).toBe(
      "/cards/7?x=1&tab=files",
    );
  });
});

describe("registerRoute", () => {
  it("не даёт зарегистрировать второй маршрут с тем же id", () => {
    registerRoute("/a", { id: "a", owner: "first" });
    expect(() => registerRoute("/a", { id: "a", owner: "second" })).toThrow(
      /уже зарегистрирован в реестре адресов/,
    );
  });

  it("одинаковая повторная регистрация идемпотентна", () => {
    const first = registerRoute("/a", { id: "a" });
    const second = registerRoute("/a", { id: "a" });
    expect(second).toBe(first);
    expect(registeredRoutes()).toHaveLength(1);
  });

  it("два маршрута не могут забронировать один GET-ключ", () => {
    registerRoute("/a", { id: "a", keys: ["tab"] });
    expect(() => registerRoute("/b", { id: "b", keys: ["tab"] })).toThrow(
      /ключ «tab» уже забронирован «a»/,
    );
  });

  it("после сброса реестр пуст", () => {
    registerRoute("/a");
    resetRegisteredRoutes();
    expect(registeredRoutes()).toHaveLength(0);
  });
});
