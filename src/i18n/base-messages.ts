/**
 * English base catalog.
 *
 * Every user-visible string the library renders must exist here first. This file
 * is the translation source of truth: a missing key is a bug, and the placeholder
 * set for each key is documented so translators do not have to read component
 * source to know what `{n}` means.
 *
 * Catalogs are namespaced per component (`componentName.key`). The prefix is part
 * of the public API; renaming a namespace is a breaking change.
 */

import type { Messages } from "./catalog";

/**
 * Message keys, typed against the base catalog so a typo or a missing key is a
 * compile error rather than a runtime fallback.
 */
export const BASE_MESSAGES = {
  /* Shared, used by more than one component. */
  "common.close": "Close",
  "common.open": "Open",
  "common.loading": "Loading",
  "common.error": "Something went wrong",
  "common.required": "Required",
  "common.optional": "Optional",
  /** The trailing control on a removable chip. Composed with the chip's own text when there is any. */
  "common.remove": "Remove",
  /**
   * The fallback accessible name for a menu.
   *
   * A `role="menu"` with no name is announced as "menu" and nothing else, which tells a screen reader user
   * nothing about which menu they have just opened. This is the name used when a caller has not supplied
   * one, so the unnamed case is the rare one rather than the default.
   */
  "common.menu": "Menu",
  /**
   * The fallback accessible name for a navigation landmark.
   *
   * A `<nav>` with no name is announced as "navigation" and nothing else, and a page with two of them gives
   * the user no way to tell them apart. "Main" is the right guess far more often than not, but a page with a
   * secondary navigation must pass its own — which is why this is a default rather than a fixed value.
   */
  "common.mainNavigation": "Main",

  /* Paging. `common.of` is the only one with a placeholder, and it is composed rather than
     concatenated so a translator can put the count where their language needs it. */
  "common.page": "Page",
  "common.previousPage": "Previous page",
  "common.nextPage": "Next page",
  "common.firstPage": "First page",
  "common.lastPage": "Last page",
  "common.step": "Step",
  "common.of": "of {total}",

  /* Example namespace, showing the convention a first component will follow.
     Not referenced by any shipped component yet. */
  "example.itemSelected": "{count} of {total} selected",
} as const satisfies Messages;

export type MessageKey = keyof typeof BASE_MESSAGES;

/**
 * Placeholder documentation, generated from the base catalog.
 *
 * Kept adjacent to the catalog so translators see both in one view.
 */
export const MESSAGE_PLACEHOLDERS: Readonly<Record<MessageKey, readonly string[]>> = {
  "common.close": [],
  "common.open": [],
  "common.loading": [],
  "common.menu": [],
  "common.mainNavigation": [],
  "common.error": [],
  "common.required": [],
  "common.optional": [],
  "common.remove": [],
  "common.page": [],
  "common.previousPage": [],
  "common.nextPage": [],
  "common.firstPage": [],
  "common.lastPage": [],
  "common.step": [],
  "common.of": ["total"],
  "example.itemSelected": ["count", "total"],
};

/** Locale codes UIReload ships base strings for. English is the only complete catalog today. */
export const SUPPORTED_LOCALES = ["en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number] | (string & {});
