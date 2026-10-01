/**
 * Unit tests for the CSS rule checks.
 *
 * These run before the build does, so a mistake in the rules themselves is caught here
 * rather than as a false pass in `dist/`. The build gate is only as trustworthy as
 * this module.
 */

import { describe, expect, it } from "vitest";

import { checkCss, checkLine, classSelectors, stripNonCode, DISABLE_MARKER } from "./css-rules.mjs";

const messages = (source: string) =>
  checkCss(source, "probe.css").map((violation) => violation.message);

describe("stripNonCode", () => {
  it("removes block comments", () => {
    expect(stripNonCode("/* .leaked { margin-left: 1px } */ .uir-a {}")).toBe(" .uir-a {}");
  });

  it("removes @import targets, which contain dots", () => {
    // `@import "./theme/tokens.css"` would otherwise parse `.css` as a class selector.
    expect(stripNonCode('@import "./theme/tokens.css";')).toBe("");
  });

  it("removes url() bodies", () => {
    expect(stripNonCode("background: url(a.b.png);")).toBe("background: ;");
  });

  it("removes quoted strings", () => {
    expect(stripNonCode('content: ".notAClass";')).toBe('content: "";');
  });
});

describe("classSelectors", () => {
  it("finds a class selector", () => {
    expect(classSelectors(".uir-button")).toEqual(["uir-button"]);
  });

  it("finds a class inside a compound selector", () => {
    expect(classSelectors('[data-state="open"].uir-dialog__title')).toEqual(["uir-dialog__title"]);
  });

  it("finds a class inside :not()", () => {
    expect(classSelectors(":not(.uir-visually-hidden)")).toEqual(["uir-visually-hidden"]);
  });

  it("does not treat a decimal as a class selector", () => {
    expect(classSelectors("width: 0.5rem")).toEqual([]);
  });

  it("does not treat a version number as a class selector", () => {
    expect(classSelectors("font: 1.5rem/2")).toEqual([]);
  });

  it("does not treat a number in a property name as a class", () => {
    // `.5` cannot start a class selector, and must not appear as one.
    expect(classSelectors("grid-template-columns: repeat(3, 1fr)")).toEqual([]);
  });
});

describe("checkLine: namespace", () => {
  it("accepts a prefixed class", () => {
    expect(messages(".uir-button { color: red; }")).toEqual([]);
  });

  it("rejects an unprefixed class", () => {
    expect(messages(".button { color: red; }")).toHaveLength(1);
    expect(messages(".button { color: red; }")[0]).toMatch(/unnamespaced class/);
  });

  it("reports each unprefixed class on a line once", () => {
    expect(messages(".a .b { color: red; }")).toHaveLength(2);
  });

  it("rejects a prefixed-looking but wrong namespace", () => {
    expect(messages(".uirbutton { color: red; }")).toHaveLength(1);
    expect(messages(".ui-button { color: red; }")).toHaveLength(1);
  });
});

describe("checkLine: physical properties", () => {
  it("accepts logical properties", () => {
    expect(messages(".uir-a { margin-inline-start: 4px; padding-inline-end: 2px; }")).toEqual([]);
  });

  it("rejects margin-left", () => {
    expect(messages(".uir-a { margin-left: 4px; }")[0]).toMatch(/margin-inline-start/);
  });

  it("rejects inset shorthand positions", () => {
    expect(messages(".uir-a { left: 0; }")[0]).toMatch(/inset-inline-start/);
  });

  it("rejects physical border radii", () => {
    expect(messages(".uir-a { border-top-left-radius: 2px; }")[0]).toMatch(
      /border-start-start-radius/
    );
  });

  it("does not flag the word inside a value", () => {
    // `border-left` is a property; a `content` string is not.
    expect(messages('.uir-a { content: "left"; }')).toEqual([]);
  });
});

describe("checkLine: physical values", () => {
  it("accepts start and end", () => {
    expect(messages(".uir-a { text-align: start; }")).toEqual([]);
    expect(messages(".uir-a { text-align: end; }")).toEqual([]);
  });

  it("rejects left and right for text-align", () => {
    expect(messages(".uir-a { text-align: right; }")).toHaveLength(1);
  });

  it("rejects float: left", () => {
    expect(messages(".uir-a { float: left; }")).toHaveLength(1);
  });

  it("reports text-align once, not twice", () => {
    // It is only in VALUE_CHECKS, never in PHYSICAL_PROPERTIES.
    expect(messages(".uir-a { text-align: right; }")).toHaveLength(1);
  });
});

describe("checkLine: box-shadow symmetry", () => {
  it("accepts a shadow with no x-offset", () => {
    expect(messages(".uir-a { box-shadow: 0 2px 4px rgb(0 0 0 / 20%); }")).toEqual([]);
  });

  it("accepts a symmetric horizontal shadow", () => {
    expect(
      messages(".uir-a { box-shadow: 2px 0 4px rgb(0 0 0 / 20%), -2px 0 4px rgb(0 0 0 / 20%); }")
    ).toEqual([]);
  });

  it("accepts an inset shadow with no x-offset", () => {
    expect(messages(".uir-a { box-shadow: inset 0 -1px 0 rgb(0 0 0 / 10%); }")).toEqual([]);
  });

  it("rejects a single asymmetric x-offset", () => {
    expect(messages(".uir-a { box-shadow: -2px 0 4px rgb(0 0 0 / 20%); }")).toHaveLength(1);
  });

  it("does not reject a shadow with a y-offset", () => {
    expect(messages(".uir-a { box-shadow: 0 -4px 8px rgb(0 0 0 / 20%); }")).toEqual([]);
  });
});

describe("checkLine: suppression", () => {
  it("suppresses a line carrying the marker", () => {
    expect(messages(`.leaked { margin-left: 0; } /* ${DISABLE_MARKER}: audited */`)).toEqual([]);
  });

  it("still reports the next line", () => {
    const source = `.leaked { color: red; }\n.leaked2 { color: blue; }`;
    expect(checkCss(source, "probe.css")).toHaveLength(2);
  });
});

describe("checkCss", () => {
  it("records the file and a 1-based line number", () => {
    const found = checkCss(".uir-a {}\n\n.leaked {}\n", "src/x.css");

    expect(found).toHaveLength(1);
    expect(found[0]?.file).toBe("src/x.css");
    expect(found[0]?.line).toBe(3);
  });

  it("returns nothing for clean CSS", () => {
    expect(
      checkCss("@layer uireload.components { .uir-a { margin-inline-end: 0; } }", "a.css")
    ).toEqual([]);
  });

  it("handles an empty file", () => {
    expect(checkCss("", "a.css")).toEqual([]);
  });
});

describe("checkLine: custom options", () => {
  it("accepts a different namespace", () => {
    expect(checkLine(".acme-button { color: red; }", { prefix: "acme-" })).toEqual([]);
  });

  it("still rejects the default namespace under a custom one", () => {
    expect(checkLine(".uir-button { color: red; }", { prefix: "acme-" })).toHaveLength(1);
  });
});
