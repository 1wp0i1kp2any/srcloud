import { afterEach, describe, expect, it } from "vitest";

import {
  configureToasts,
  currentToastPreset,
  initialToastConfig,
  notify,
  setToastSink,
  setToastViewport,
  type ToastSink,
} from "./index";

const received: Parameters<ToastSink>[] = [];
const sink: ToastSink = (...args) => {
  received.push(args);
};

afterEach(() => {
  received.length = 0;
  setToastSink(undefined);
  setToastViewport(() => false);
  configureToasts({
    enabled: true,
    desktop: initialToastConfig.desktop,
    mobile: initialToastConfig.mobile,
  });
});

describe("toast access point", () => {
  it("does nothing without a renderer", () => {
    notify("info", "no sink");
    expect(received).toHaveLength(0);
  });

  it("passes the desktop preset and allows a per-message duration", () => {
    setToastSink(sink);
    setToastViewport(() => false);
    notify("success", "saved", { description: "ok", duration: 1000 });

    expect(received).toHaveLength(1);
    const [kind, input, preset] = received[0]!;
    expect(kind).toBe("success");
    expect(input).toMatchObject({ message: "saved", description: "ok", duration: 1000 });
    expect(preset).toEqual(initialToastConfig.desktop);
  });

  it("switches to the mobile preset at runtime", () => {
    setToastSink(sink);
    setToastViewport(() => true);
    notify("error", "failed");

    expect(currentToastPreset()).toEqual(initialToastConfig.mobile);
    expect(received[0]![2]).toEqual(initialToastConfig.mobile);
  });

  it("honours configureToasts on the fly and the enabled flag", () => {
    setToastSink(sink);
    configureToasts({ mobile: { position: "bottom-left", duration: 1234 } });
    setToastViewport(() => true);

    expect(currentToastPreset()).toMatchObject({ position: "bottom-left", duration: 1234 });

    configureToasts({ enabled: false });
    notify("info", "hidden");
    expect(received).toHaveLength(0);
  });
});