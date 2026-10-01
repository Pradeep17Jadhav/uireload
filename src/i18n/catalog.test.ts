import { describe, expect, it } from "vitest";
import { formatMessage, resolveMessage } from "./catalog";
import { BASE_MESSAGES, MESSAGE_PLACEHOLDERS } from "./base-messages";

describe("formatMessage", () => {
  it("returns the template unchanged with no values", () => {
    expect(formatMessage("Hello")).toBe("Hello");
  });

  it("substitutes string and numeric placeholders", () => {
    expect(formatMessage("{count} of {total}", { count: 2, total: 5 })).toBe("2 of 5");
  });

  it("leaves unknown placeholders visible instead of printing undefined", () => {
    // A missing value must be obvious during development, not silently render
    // "undefined" to a user.
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
  });

  it("escapes literal braces", () => {
    expect(formatMessage("{{literal}}")).toBe("{literal}");
  });

  it("escapes literal braces and still substitutes", () => {
    expect(formatMessage("{{{name}}}", { name: "x" })).toBe("{x}");
  });
});

describe("resolveMessage", () => {
  it("falls back to the base catalog", () => {
    expect(resolveMessage(undefined, BASE_MESSAGES, "common.close")).toBe("Close");
  });

  it("prefers a consumer translation", () => {
    expect(resolveMessage({ "common.close": "Fermer" }, BASE_MESSAGES, "common.close")).toBe(
      "Fermer"
    );
  });

  it("falls back per key, so partial catalogs work", () => {
    const partial = { "common.close": "Schließen" };

    expect(resolveMessage(partial, BASE_MESSAGES, "common.close")).toBe("Schließen");
    expect(resolveMessage(partial, BASE_MESSAGES, "common.open")).toBe("Open");
  });

  it("ignores an empty translation", () => {
    expect(resolveMessage({ "common.close": "" }, BASE_MESSAGES, "common.close")).toBe("Close");
  });
});

describe("base catalog", () => {
  it("documents placeholders for every key that uses them", () => {
    for (const [key, template] of Object.entries(BASE_MESSAGES)) {
      const used = [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string).sort();
      const documented = [...MESSAGE_PLACEHOLDERS[key as keyof typeof MESSAGE_PLACEHOLDERS]].sort();

      expect(documented).toEqual(used);
    }
  });

  it("namespaces every key", () => {
    for (const key of Object.keys(BASE_MESSAGES)) {
      expect(key).toMatch(/^[a-z][a-zA-Z]*\.[a-z][a-zA-Z]*$/);
    }
  });
});
