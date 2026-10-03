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
export { Menu } from "./components/menu";
export type {
  MenuProps,
  MenuOwnProps,
  MenuItem,
  MenuSeparator,
  MenuEntry,
  MenuItemRole,
  MenuPlacement,
  MenuInitialFocus,
} from "./components/menu";
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

export { Checkbox } from "./components/checkbox";
export type { CheckboxProps, CheckboxOwnProps } from "./components/checkbox";

export { RadioGroup } from "./components/radio-group";
export type { RadioGroupProps, RadioGroupOwnProps, RadioOption } from "./components/radio-group";

export { Slider } from "./components/slider";
export type { SliderProps, SliderOwnProps, SliderMark } from "./components/slider";

export { Chip } from "./components/chip";
export type { ChipProps, ChipOwnProps } from "./components/chip";

export { Text } from "./components/text";
export type { TextProps, TextOwnProps, TextVariant, TextTone } from "./components/text";

export { Link } from "./components/link";
export type { LinkProps, LinkOwnProps } from "./components/link";

export { Tile } from "./components/tile";
export type { TileProps, TileOwnProps } from "./components/tile";

export { TabBar } from "./components/tab-bar";
export type { TabBarProps, TabBarOwnProps, TabItem } from "./components/tab-bar";

export { Snackbar } from "./components/snackbar";
export type { SnackbarProps, SnackbarOwnProps, SnackbarCloseReason } from "./components/snackbar";

export { Divider } from "./components/divider";
export type {
  DividerProps,
  DividerOwnProps,
  DividerOrientation,
  DividerWeight,
} from "./components/divider";

export { Accordion } from "./components/accordion";
export type {
  AccordionProps,
  AccordionOwnPropsBase,
  AccordionItem,
  AccordionSelectionMode,
  AccordionHeadingLevel,
  AccordionSingleSelectionProps,
  AccordionMultipleSelectionProps,
} from "./components/accordion";

/*
 * A `navigation` landmark. Exported near the other page-level composites because it composes with them:
 * a `Menu` in `actions` is the usual way to make a bar work on a narrow screen.
 */
export { Navbar } from "./components/navbar";
export type { NavbarProps, NavbarOwnProps, NavbarItem } from "./components/navbar";

export { Skeleton } from "./components/skeleton";
export type { SkeletonProps, SkeletonOwnProps, SkeletonVariant } from "./components/skeleton";

/*
 * The two busy indicators, split by whether the amount of work is knowable.
 *
 * `Spinner` never takes a value and `Loader` treats an absent value as indeterminate, so a
 * caller picks the component rather than a flag — see each README for why one component with a
 * `mode` prop was rejected.
 */
export { Spinner } from "./components/spinner";
export type { SpinnerProps, SpinnerOwnProps, SpinnerSize } from "./components/spinner";

export { Loader } from "./components/loader";
export type { LoaderProps, LoaderOwnProps, LoaderSize } from "./components/loader";

export { Avatar, initialsFrom } from "./components/avatar";
export type { AvatarProps, AvatarOwnProps, AvatarShape } from "./components/avatar";

export { Alert } from "./components/alert";
export type { AlertProps, AlertOwnProps, AlertUrgency, AlertVariant } from "./components/alert";

export { Tooltip } from "./components/tooltip";
export type { TooltipProps, TooltipOwnProps, TooltipPlacement } from "./components/tooltip";

export { Drawer } from "./components/drawer";
export type { DrawerProps, DrawerOwnProps, DrawerCloseReason } from "./components/drawer";

export { Pagination } from "./components/pagination";
export type { PaginationProps, PaginationOwnProps } from "./components/pagination";

export { Stepper } from "./components/stepper";
export type {
  StepperProps,
  StepperOwnProps,
  StepperNavigation,
  StepperStep,
} from "./components/stepper";

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
