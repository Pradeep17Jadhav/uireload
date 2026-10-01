import { createRef } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { opposite, readDirection, useDirection } from "./use-direction";

describe("readDirection", () => {
  it("defaults to ltr without an element", () => {
    expect(readDirection(null)).toBe("ltr");
  });

  it("reads dir from the element itself", () => {
    const node = document.createElement("div");
    node.setAttribute("dir", "rtl");
    expect(readDirection(node)).toBe("rtl");
  });

  it("inherits dir from an ancestor", () => {
    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    const child = document.createElement("span");
    host.append(child);

    expect(readDirection(child)).toBe("rtl");
  });

  it("respects the nearest ancestor", () => {
    const outer = document.createElement("div");
    outer.setAttribute("dir", "rtl");
    const inner = document.createElement("div");
    inner.setAttribute("dir", "ltr");
    const leaf = document.createElement("span");

    outer.append(inner);
    inner.append(leaf);

    expect(readDirection(leaf)).toBe("ltr");
  });

  it("treats an unknown dir value as ltr", () => {
    const node = document.createElement("div");
    node.setAttribute("dir", "sideways");
    expect(readDirection(node)).toBe("ltr");
  });
});

describe("useDirection", () => {
  it("returns the default during a server render, then resolves from the DOM", async () => {
    const ref = createRef<HTMLDivElement>();
    const node = document.createElement("div");
    node.setAttribute("dir", "rtl");
    document.body.append(node);
    ref.current = node;

    // `renderHook` flushes layout effects inside `act`, so it only ever observes the
    // post-effect value. To capture the render-phase value (which is what a server
    // render would see) the values are recorded inside the hook callback itself.
    const duringRender: string[] = [];
    const { result } = renderHook(() => {
      const direction = useDirection(ref, "ltr");
      duringRender.push(direction);
      return direction;
    });

    expect(duringRender[0]).toBe("ltr");
    await waitFor(() => expect(result.current).toBe("rtl"));
  });

  it("observes runtime changes to an ancestor dir attribute", async () => {
    const host = document.createElement("div");
    host.setAttribute("dir", "ltr");
    const node = document.createElement("div");
    host.append(node);
    document.body.append(host);

    const ref = createRef<HTMLDivElement>();
    ref.current = node;

    const { result } = renderHook(() => useDirection(ref));
    await waitFor(() => expect(result.current).toBe("ltr"));

    // `await act(...)` rather than a sync `act(...)`: MutationObserver callbacks are
    // delivered as microtasks, so a synchronous act would exit before the state update
    // landed and React would warn about an update outside act. The inner await is what
    // drains that microtask queue; it is load-bearing, not decoration.
    await act(async () => {
      host.setAttribute("dir", "rtl");
      await Promise.resolve();
    });

    expect(result.current).toBe("rtl");
  });

  it("falls back to observing <html> when no ancestor carries dir", async () => {
    const node = document.createElement("div");
    document.body.append(node);
    const ref = createRef<HTMLDivElement>();
    ref.current = node;

    const { result } = renderHook(() => useDirection(ref));
    await waitFor(() => expect(result.current).toBe("ltr"));

    await act(async () => {
      document.documentElement.setAttribute("dir", "rtl");
      await Promise.resolve();
    });
    expect(result.current).toBe("rtl");

    // Cleaned up rather than left in place: `<html dir="rtl">` would leak into every
    // later test in this file.
    await act(async () => {
      document.documentElement.removeAttribute("dir");
      await Promise.resolve();
    });
    expect(result.current).toBe("ltr");
  });

  it("does nothing when the ref is empty", () => {
    const ref = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useDirection(ref));
    expect(result.current).toBe("ltr");
  });
});

describe("opposite", () => {
  it("flips direction", () => {
    expect(opposite("ltr")).toBe("rtl");
    expect(opposite("rtl")).toBe("ltr");
  });
});
