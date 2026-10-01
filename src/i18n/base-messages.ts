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
  "common.error": [],
  "common.required": [],
  "common.optional": [],
  "example.itemSelected": ["count", "total"],
};

/** Locale codes UIReload ships base strings for. English is the only complete catalog today. */
export const SUPPORTED_LOCALES = ["en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number] | (string & {});
