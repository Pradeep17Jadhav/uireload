import { describe, expect, it } from "vitest";
import { cx, uirName } from "./classnames";

describe("cx", () => {
  it("joins strings", () => {
    expect(cx("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("keeps zero and coerces numbers", () => {
    expect(cx(0, "a")).toBe("0 a");
  });

  it("supports object syntax", () => {
    expect(cx("a", { b: true, c: false, d: undefined })).toBe("a b");
  });

  it("flattens arrays", () => {
    expect(cx(["a", ["b", { c: true }]])).toBe("a b c");
  });

  it("returns an empty string for no meaningful input", () => {
    expect(cx()).toBe("");
    expect(cx(false, null)).toBe("");
  });

  it("preserves insertion order", () => {
    expect(cx("z", "a", "m")).toBe("z a m");
  });
});

describe("uirName", () => {
  it("namespaces a block", () => {
    expect(uirName("button")).toBe("uir-button");
  });

  it("joins parts", () => {
    expect(uirName("button", "root", "md")).toBe("uir-button-root-md");
  });

  it("strips leading dashes from parts", () => {
    expect(uirName("dialog", "--backdrop")).toBe("uir-dialog-backdrop");
  });
});
