/**
 * Radio group prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

/**
 * One option.
 *
 * A `value` prop rather than children, following `Select` rather than `ToggleButtonGroup`. That is
 * the deliberate divergence: a children-based group has to read each child's props to find its
 * value, which silently misbehaves the moment a child is wrapped in a component or a fragment — a
 * failure `ToggleButtonGroup` has to detect at runtime and log an error for. A typed array has no
 * such failure mode, and it keeps this a one-component folder.
 */
export interface RadioOption {
  /** The value reported by `onValueChange`. Required and stable. */
  value: string;

  /** What the user reads. */
  label: ReactNode;

  /**
   * Not selectable.
   *
   * A disabled option is skipped by the arrow keys *and* by `Home` / `End`, which is what makes a
   * group usable with a keyboard rather than merely visible.
   */
  disabled?: boolean | undefined;

  /**
   * Text announced for the option, when `label` is not plain text.
   *
   * Required only when `label` contains elements or images, because the accessible name of an
   * option is derived from its content and arbitrary content often yields nothing useful.
   */
  textValue?: string | undefined;

  /** Rendered after the label, inside the row. Decorative by default; see `textValue`. */
  children?: ReactNode | undefined;
}

export interface RadioGroupOwnProps {
  /**
   * Visible group heading, rendered as a real `<legend>` inside a `<fieldset>`.
   *
   * A fieldset and legend, not a div with `aria-label`, because a radio group is a form structure:
   * the legend is what a screen reader announces on entering the group, and it is what a browser
   * exposes as the group's name in its own accessibility tree.
   *
   * Needs an `id` to bind, which is also what `aria-labelledby` points at. The development warning
   * covers the case where `id` is missing.
   */
  label?: ReactNode | undefined;

  /** The options. */
  options: readonly RadioOption[];

  /**
   * Controlled selected value. `undefined` means uncontrolled.
   *
   * `null` means "controlled, nothing selected", which is a real state before the user chooses —
   * and, for a required field, the state that has to be representable.
   */
  value?: string | null | undefined;

  /** Initial selection when uncontrolled. */
  defaultValue?: string | null | undefined;

  /** Called with the newly selected value, or `null` when the selection is cleared. */
  onValueChange?: ((value: string | null) => void) | undefined;

  /**
   * Id of the element that names the group, applied as `aria-labelledby` when there is no `label`.
   *
   * Use this when a visible element outside the group already names it.
   */
  labelId?: string | undefined;

  /** Not actionable as a whole. Individual options can still be disabled on top. */
  disabled?: boolean | undefined;

  /**
   * Rendered as the native `required` attribute on every option, so the browser's own form
   * validation applies.
   *
   * Adds a visually hidden "Required" to the legend.
   */
  required?: boolean | undefined;

  /**
   * Layout direction.
   *
   * Also selects the arrow-key axis: `vertical` responds to Up/Down, `horizontal` to
   * Left/Right.
   *
   * @default "vertical"
   */
  orientation?: "horizontal" | "vertical" | undefined;

  /** Size, applied to every option. See `docs/foundations.md` §2. */
  size?: Size | undefined;

  /**
   * Advisory intent of the selected option's dot.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /** Name submitted with the form, and what groups the inputs server-side. */
  name?: string | undefined;

  /**
   * Announced description, wired to `aria-describedby` on the fieldset.
   *
   * The same contract as `Textbox`'s `helperText`: it exists to be announced, not merely rendered.
   */
  helperText?: ReactNode | undefined;

  /**
   * Whether the selection can be cleared by selecting the already-selected option.
   *
   * @default false
   */
  clearable?: boolean | undefined;

  /** Merged onto the component root, never onto an option. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the `<fieldset>`.
   *
   * Named `ref` because the fieldset is the element a consumer focuses imperatively, and there is
   * no proxy element to disambiguate from.
   */
  ref?: Ref<HTMLFieldSetElement> | undefined;
}

/**
 * The type is `HTMLAttributes<HTMLFieldSetElement>`, not `HTMLDivElement`.
 *
 * The root is a fieldset, and a div's attribute type includes nothing a fieldset lacks but also
 * types `disabled`, `name` and `form` as ordinary strings — so a consumer could pass
 * `disabled="yes"` and have it reach the DOM. Inheriting from the element actually rendered is
 * what keeps the escape hatch honest.
 */
export type RadioGroupProps = RadioGroupOwnProps &
  Omit<HTMLAttributes<HTMLFieldSetElement>, keyof RadioGroupOwnProps | "children">;
