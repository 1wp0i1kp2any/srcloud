import { beforeEach, describe, expect, it } from "vitest";

import {
  carryQuery,
  checkKeys,
  claimQuery,
  nextSearch,
  queryOwner,
  readQuery,
  resetQueryClaims,
} from "./keys";

beforeEach(() => resetQueryClaims());

describe("claimQuery", () => {
  it("второй владелец не может забронировать чужой ключ", () => {
    claimQuery("modals", "modal");
    expect(() => claimQuery("steps", "modal")).toThrow(/уже забронирован «modals»/);
  });

  it("повторная бронь своего ключа — не ошибка", () => {
    claimQuery("modals", "modal");
    expect(() => claimQuery("modals", "modal")).not.toThrow();
    expect(queryOwner("modal")).toBe("modals");
  });

  it("семейство не даёт забронировать ключ под ним", () => {
    claimQuery("pager", "page.*");
    expect(() => claimQuery("filters", "page.size")).toThrow(/покрыт семейством «page.\*»/);
  });

  it("семейство не накрывает чужой точный ключ", () => {
    claimQuery("steps", "page.size");
    expect(() => claimQuery("pager", "page.*")).toThrow(/накрывает «page.size»/);
  });
});

describe("nextSearch", () => {
  it("меняет только свои ключи и сохраняет чужие и их порядок", () => {
    claimQuery("steps", "step");
    const search = nextSearch("steps", "?page=2&step=a&q=x", { step: "b" });
    expect(search).toBe("?page=2&q=x&step=b");
  });

  it("отказывается писать незабронированный ключ", () => {
    claimQuery("steps", "step");
    expect(() => nextSearch("steps", "", { page: "2" })).toThrow(/никем не забронирован/);
  });

  it("семейство в патче заменяет всё семейство одним значением", () => {
    claimQuery("modals", "modal.*");
    const search = nextSearch("modals", "?modal.a=1&modal.b=2&x=3", {
      "modal.*": "a,b",
    });
    expect(search).toBe("?x=3&modal=a%2Cb");
  });

  it("drop снимает своё семейство, не трогая соседей", () => {
    claimQuery("pager", "page.*");
    const search = nextSearch("pager", "?page.size=10&page.filters.kind=a&q=x", {}, {
      drop: ["page.filters.*"],
    });
    expect(search).toBe("?page.size=10&q=x");
  });
});

describe("readQuery / carryQuery", () => {
  it("читает повторяющийся ключ массивом", () => {
    expect(readQuery("?a=1&a=2", "a")).toEqual(["1", "2"]);
    expect(readQuery("?a=1", "a")).toBe("1");
    expect(readQuery("?a=1", "b")).toBeUndefined();
  });

  it("переносит чужие ключи и выкидывает свои drop", () => {
    claimQuery("pager", "page");
    const hidden = carryQuery("pager", "?page=3&q=x&empty=", ["page"]);
    expect(hidden).toEqual([{ name: "q", value: "x" }]);
  });
});

describe("checkKeys", () => {
  it("пропускает изменение своего ключа", () => {
    claimQuery("steps", "step");
    expect(() => checkKeys("steps", "?step=a&q=x", "?step=b&q=x")).not.toThrow();
  });

  it("падает, если изменился чужой ключ", () => {
    claimQuery("steps", "step");
    claimQuery("pager", "page");
    expect(() => checkKeys("steps", "?step=a&page=1", "?step=a&page=2")).toThrow(
      /забронирован «pager»/,
    );
  });
});
