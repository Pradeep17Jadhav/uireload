/**
 * ToggleButtonGroup prop types.
 *
 * From MUI's `ToggleButtonGroupProps` (`@mui/material/ToggleButtonGroup/
 * ToggleButtonGroup.d.ts`) and UI5's `ui5-segmented-button`
 * (`@ui5/webcomponents/dist/SegmentedButton.d.ts`). Reconciliation, and the
 * accessibility decision this component exists to make, in `README.md`.
 */

import type { HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * How many members may be pressed at once.
 *
 * UI5's `selectionMode` is `Single | Multiple`
 * (`@ui5/webcomponents/dist/types/SegmentedButtonSelectionMode.d.ts`); MUI uses a
 * boolean, `exclusive`, defaulting to multiple. UIReload takes UI5's enum because a
 * boolean cannot express a third mode later, and because a named prop is easier to
 * read at the call site.
 *
 * The two modes are not just different validation: **they render different roles and
 * different keyboard behaviour.** See `README.md`.
 */
export type SelectionMode = "single" | "multiple";

interface ToggleButtonGroupBaseProps {
  /**
   * Accessible name for the group, applied as `aria-label`.
   *
   * Required in practice: a group of buttons announces only as "group" without it.
   * Pass `aria-labelledby` through the native props when a visible element already
   * names it. A development warning is logged when neither is present.
   */
  label?: string | undefined;

  /**
   * Layout direction.
   *
   * Also selects the arrow-key axis: `vertical` responds to Up/Down, `horizontal` to
   * Left/Right.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical" | undefined;

  /**
   * Size, applied to every member. Mixed sizes in one group are not supported; a
   * group reads as one control and one control has one size.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Emphasis, applied to every member.
   *
   * @default "outline"
   */
  variant?: Variant | undefined;

  /**
   * Intent, applied to every member.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Disables every member. Individual members can still be disabled on top.
   *
   * @default false
   */
  disabled?: boolean | undefined;

  /** The `ToggleButton` elements in the group. */
  children?: ReactNode;

  /** Merged onto the group element. */
  className?: string | undefined;

  /** Forwarded to the group element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

interface SingleSelectionProps {
  selectionMode?: "single" | undefined;

  /** The pressed member's value, or `null` for none. `undefined` means uncontrolled. */
  value?: string | null | undefined;

  /** Initial selection when uncontrolled. */
  defaultValue?: string | null | undefined;

  /**
   * Called with the newly pressed member's value, or `null` if the selection was
   * cleared.
   *
   * Single selection cannot be cleared by pressing the pressed member, matching the
   * APG radio-group behaviour.
   */
  onValueChange?: ((value: string | null) => void) | undefined;
}

interface MultipleSelectionProps {
  selectionMode: "multiple";

  /** The pressed members' values. `undefined` means uncontrolled. */
  value?: string[] | undefined;

  /** Initial selection when uncontrolled. */
  defaultValue?: string[] | undefined;

  /** Called with the full next set of pressed values. */
  onValueChange?: ((value: string[]) => void) | undefined;
}

/**
 * Discriminated on `selectionMode` so the value shape and the callback signature
 * cannot disagree: passing an array with `selectionMode="single"` is a type error
 * rather than a runtime surprise.
 */
export type ToggleButtonGroupProps = ToggleButtonGroupBaseProps &
  (SingleSelectionProps | MultipleSelectionProps) &
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "role">;
