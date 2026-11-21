import { describe, expect, it } from "vitest";

import { choice, flag, originList, parseEnv } from "./parse";

describe("originList", () => {
  it("rejects a path, credentials and query", () => {
    expect(() => originList("APP_ORIGINS", "https://a.example/app")).toThrow(/путь/);
    expect(() => originList("APP_ORIGINS", "https://u:p@a.example")).toThrow(/логин/);
    expect(() => originList("APP_ORIGINS", "https://a.example/?x=1")).toThrow(/путь/);
  });

  it("normalizes trailing slash and deduplicates", () => {
    expect(originList("APP_ORIGINS", "https://a.example/, https://a.example")).toEqual([
      "https://a.example",
    ]);
  });

  it("returns an empty list for an empty value", () => {
    expect(originList("APP_ORIGINS", "")).toEqual([]);
    expect(originList("APP_ORIGINS", undefined)).toEqual([]);
  });
});

describe("flag and choice", () => {
  it("reads booleans and falls back when empty", () => {
    expect(flag("F", "1", false)).toBe(true);
    expect(flag("F", "no", true)).toBe(false);
    expect(flag("F", "", true)).toBe(true);
    expect(() => flag("F", "maybe", true)).toThrow(/флаг/);
  });

  it("accepts only the declared values", () => {
    expect(choice("M", "", ["a", "b"], "a")).toBe("a");
    expect(choice("M", "b", ["a", "b"], "a")).toBe("b");
    expect(() => choice("M", "c", ["a", "b"], "a")).toThrow(/ожидалось одно из/);
  });
});

describe("parseEnv", () => {
  it("defaults to framework mode and production cookies", () => {
    expect(parseEnv({}, { prod: true })).toEqual({
      appOrigins: ["https://preview.opencode.pzlb.ru"],
      securityMode: "strict",
      allowNullOrigin: false,
      cookies: { secure: true, prefix: "__Host-" },
    });
  });

  it("does not require Secure cookies in dev", () => {
    expect(parseEnv({}, { prod: false }).cookies).toEqual({
      secure: false,
      prefix: "",
    });
  });
});