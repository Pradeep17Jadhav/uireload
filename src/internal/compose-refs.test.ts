import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { composeRefs } from "./compose-refs";

describe("composeRefs", () => {
  it("assigns to a callback ref", () => {
    const received: (Element | null)[] = [];
    const node = document.createElement("div");

    // Braces around the arrow body: `push` returns a number, and React's ref type
    // requires `void`.
    composeRefs<Element>((value) => {
      received.push(value);
    })(node);

    expect(received).toEqual([node]);
  });

  it("assigns to an object ref", () => {
    const ref = createRef<Element>();
    const node = document.createElement("div");

    composeRefs<Element>(ref)(node);

    expect(ref.current).toBe(node);
  });

  it("assigns to several refs at once", () => {
    const ref = createRef<Element>();
    const seen: (Element | null)[] = [];
    const node = document.createElement("div");

    composeRefs<Element>(ref, (value) => {
      seen.push(value);
    })(node);

    expect(ref.current).toBe(node);
    expect(seen).toEqual([node]);
  });

  it("clears refs when called with null", () => {
    const ref = createRef<Element>();
    const setRef = composeRefs<Element>(ref);

    setRef(document.createElement("div"));
    setRef(null);

    expect(ref.current).toBeNull();
  });

  it("ignores undefined refs", () => {
    const node = document.createElement("div");
    expect(() => composeRefs<Element>(undefined, undefined)(node)).not.toThrow();
  });
});
