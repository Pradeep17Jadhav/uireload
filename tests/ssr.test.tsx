/**
 * SSR and hydration tests.
 *
 * These run against `react-dom/server`, not jsdom. jsdom cannot tell us whether a
 * component would survive being rendered on a server, and hydration bugs are the
 * class of bug that only appears in production. React logs a warning on mismatch
 * rather than throwing, so the console is asserted on explicitly.
 */

import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Example } from "../src/components/_template/example";

/** Hydrate `ui` into a container and report React's warnings. */
async function hydrate(ui: React.ReactElement) {
  const { hydrateRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui);
  document.body.append(container);

  const errors: unknown[] = [];
  const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
    errors.push(args);
  });

  const root = hydrateRoot(container, ui);
  // Let React flush and effects run.
  await new Promise((resolve) => setTimeout(resolve, 0));

  spy.mockRestore();
  return { errors, container, root };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("server rendering", () => {
  it("renders a component to a string without touching the DOM", () => {
    expect(() => renderToString(createElement(Example, null, "hi"))).not.toThrow();
  });

  it("produces deterministic markup", () => {
    const a = renderToString(createElement(Example, null, "hi"));
    const b = renderToString(createElement(Example, null, "hi"));
    expect(a).toBe(b);
  });

  it("does not read window or document during render", () => {
    // If any render-phase code touched a browser global, this would throw.
    const html = renderToString(createElement(Example, { size: "lg" }, "hi"));
    expect(html).toContain("hi");
  });
});

describe("hydration", () => {
  it("hydrates without a mismatch warning", async () => {
    const { errors } = await hydrate(createElement(Example, null, "content"));

    const messages = errors.flat().join(" ");
    expect(messages).not.toMatch(/did not match|Text content does not match|Hydration/i);
  });

  it("matches server output for the initial state", async () => {
    const ui = createElement(Example, { defaultOpen: true, size: "sm" }, "content");
    const { container, errors } = await hydrate(ui);

    expect(container.querySelector("[data-state]")).toHaveAttribute("data-state", "open");
    expect(container.querySelector("[data-size]")).toHaveAttribute("data-size", "sm");
    expect(errors.flat().join(" ")).not.toMatch(/did not match/i);
  });

  it("does not depend on ambient dir for the initial markup", async () => {
    const { errors, container } = await hydrate(
      createElement(Example, null, createElement("div", { dir: "rtl" }, "content"))
    );

    expect(container.querySelector("[dir]")).toHaveAttribute("dir", "rtl");
    expect(errors.flat().join(" ")).not.toMatch(/did not match/i);
  });
});
