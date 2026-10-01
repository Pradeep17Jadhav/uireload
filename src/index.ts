/**
 * Public API surface.
 *
 * Everything a consumer can import from `uireload` is re-exported here. Three
 * rules govern this file:
 *
 * 1. Only intentional public API. Anything not listed here is internal and may
 *    change without notice, even when it lives under `src/`.
 * 2. No side effects at module scope. Importing this module must never touch the
 *    DOM, inject styles, or register global handlers, so SSR and CSP stay clean.
 * 3. Re-exports are `export ... from` so bundlers can still tree-shake and so
 *    each named export keeps its own module identity for ESM analyzers.
 *
 * Per-component imports are the primary consumption path:
 *
 *   import { Button } from "uireload/components/button";
 *
 * This barrel exists for convenience and for types. It re-exports the same modules,
 * so importing from here never loads a component the consumer did not reference,
 * provided the bundler honours `sideEffects: false` in package.json.
 */

/* ---------------------------------------------------------------- types --- */
export type {
  UIReloadBaseProps,
  NativeRootProps,
  PolymorphicRefProp,
  SlotProps,
  Size,
  FocusTarget,
} from "./types";

/* --------------------------------------------------------------- theming --- */
export {
  TOKENS,
  COLOR_SCHEMES,
  SCHEME_ATTRIBUTE,
  DENSITY_ATTRIBUTE,
  DENSITIES,
  type ThemeTokens,
  type ColorScheme,
  type Density,
} from "./theme/tokens";

/* ------------------------------------------------------------------- i18n --- */
export {
  formatMessage,
  resolveMessage,
  BASE_MESSAGES,
  SUPPORTED_LOCALES,
  type Messages,
  type MessageValues,
  type MessageKey,
  type Locale,
} from "./i18n";

/* ------------------------------------------------------------ components --- */
/*
 * One re-export per component, added as components land:
 *
 * export { Button } from "./components/button";
 * export type { ButtonProps } from "./components/button";
 *
 * Component files are intentionally absent. This repository contains
 * infrastructure only; see `src/components/README.md`.
 */
