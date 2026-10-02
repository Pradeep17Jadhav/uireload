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
export { Button } from "./components/button";
export type { ButtonProps, ButtonOwnProps, ButtonType } from "./components/button";

export { IconButton } from "./components/icon-button";
export type { IconButtonProps, IconButtonOwnProps } from "./components/icon-button";

export { ToggleButton } from "./components/toggle-button";
export type {
  ToggleButtonProps,
  ToggleButtonOwnProps,
  ToggleButtonRole,
} from "./components/toggle-button";

export { ToggleButtonGroup } from "./components/toggle-button-group";
export type { ToggleButtonGroupProps, SelectionMode } from "./components/toggle-button-group";

export { Textbox } from "./components/textbox";
export type {
  TextboxProps,
  TextboxOwnProps,
  TextboxType,
  TextboxElement,
} from "./components/textbox";

export { Switch } from "./components/switch";
export type { SwitchProps, SwitchOwnProps } from "./components/switch";

export { Popover } from "./components/popover";
export type {
  PopoverProps,
  PopoverOwnProps,
  PopoverPlacement,
  PopoverAlign,
  PopoverCloseReason,
  PopoverVirtualAnchor,
} from "./components/popover";

export { Dialog } from "./components/dialog";
export type {
  DialogProps,
  DialogOwnProps,
  DialogUrgency,
  DialogCloseReason,
  DialogInitialFocus,
} from "./components/dialog";

export { Select, isOptionGroup } from "./components/select";
export type {
  SelectProps,
  SelectOwnProps,
  SelectItem,
  SelectOption,
  SelectOptionGroup,
} from "./components/select";

/* ---------------------------------------------------------- foundations --- */
/*
 * The shared design contract. Exported so consumers can type their own abstractions
 * against the same `Variant` / `Tone` / `Size`, and so `CONTROL_TOKENS` lets tooling
 * reference token names without duplicating strings. See `docs/foundations.md`.
 */
export {
  VARIANTS,
  TONES,
  SIZES,
  CONTROL_STATES,
  CONTROL_TOKENS,
  controlToken,
  isVariant,
  isTone,
  isSize,
  type Variant,
  type Tone,
  type ControlState,
} from "./foundations";
