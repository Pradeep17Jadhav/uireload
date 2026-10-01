/**
 * Class name composition.
 *
 * Kept intentionally tiny and dependency-free. Supports the two conventions the
 * library needs and nothing more:
 *
 * - `cx("a", cond && "b")` - falsy entries are dropped.
 * - `cx("a", { b: cond })` - object keys are kept when the value is truthy.
 *
 * Arrays are flattened one level deep, which is enough for conditional slot lists.
 * Values are coerced with `String` so numbers and `0` are not silently dropped.
 */

export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

function append(target: string[], value: ClassValue): void {
  if (!value && value !== 0) return;

  if (Array.isArray(value)) {
    for (const entry of value) append(target, entry);
    return;
  }

  if (typeof value === "object") {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) target.push(key);
    }
    return;
  }

  target.push(String(value));
}

/** Compose a stable, whitespace-separated class list. */
export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) append(out, value);
  return out.join(" ");
}

/**
 * Join the library-owned prefix with component-specific names.
 *
 * Every class UIReload renders starts with `uir-`, which is what keeps the library
 * safe to drop into an application that has no build-time CSS isolation.
 */
export const PREFIX = "uir";

/** Build a namespaced class name: `uirName("button", "root", "md")` -> `uir-button__root--md`. */
export function uirName(block: string, ...parts: string[]): string {
  const head = `${PREFIX}-${block}`;
  if (parts.length === 0) return head;
  return [head, ...parts.map((part) => part.replace(/^--?/, ""))].join("-");
}
