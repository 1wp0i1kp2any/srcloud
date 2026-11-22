import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Result } from "@/lib/form";

import { Surface, useSurfaceContinuation } from "./surface";

const result = (formId: string) => ({ formId } as unknown as Result);

function Probe() {
  return createElement("span", null, useSurfaceContinuation()?.formId ?? "none");
}

describe("Surface", () => {
  it("несколько Surface на странице раздают каждый свой результат", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Surface, {
          continuation: result("left"),
          children: createElement(Probe),
        }),
        createElement(Surface, {
          continuation: result("right"),
          children: createElement(Probe),
        }),
        createElement(Probe),
      ),
    );

    expect(html).toBe(
      "<div><div><span>left</span></div><div><span>right</span></div><span>none</span></div>",
    );
  });

  it("ближайший Surface важнее внешнего", () => {
    const html = renderToStaticMarkup(
      createElement(Surface, {
        continuation: result("outer"),
        children: createElement(Surface, {
          continuation: result("inner"),
          children: createElement(Probe),
        }),
      }),
    );

    expect(html).toBe("<div><div><span>inner</span></div></div>");
  });

  it("явный результат у формы важнее контекста", () => {
    function Explicit() {
      return createElement(
        "span",
        null,
        useSurfaceContinuation(result("explicit"))?.formId,
      );
    }

    const html = renderToStaticMarkup(
      createElement(Surface, {
        continuation: result("context"),
        children: createElement(Explicit),
      }),
    );

    expect(html).toBe("<div><span>explicit</span></div>");
  });
});
