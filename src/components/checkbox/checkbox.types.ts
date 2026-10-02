/**
 * Checkbox prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

export interface CheckboxOwnProps {
  /**
   * Visible label, rendered as a real `<label for>` beside the box.
   *
   * Needs an `id` to bind the label's `for`, which is also what `aria-labelledby` points at. The
   * development warning covers the case where `id` is missing, the same as `Textbox` and `Select`.
   */
  label?: ReactNode | undefined;

  /**
   * Controlled checked state. `undefined` means uncontrolled; see `useControllableState`.
   */
  checked?: boolean | undefined;

  /** Initial state when uncontrolled. */
  defaultChecked?: boolean | undefined;

  /**
   * Called with the new checked state.
   *
   * Named for what changed rather than after the DOM event, consistent with `Switch`, because the
   * consumer's interest is the value and not the event object.
   */
  onCheckedChange?: ((checked: boolean) => void) | undefined;

  /**
   * Partially checked — "some of the children are checked".
   *
   * Never reachable by interaction: a click always resolves to checked or unchecked. The consumer
   * owns it, which is what makes a parent/child checkbox work — the parent reads its children and
   * sets this.
   *
   * Rendered as the native `indeterminate` **property**, which is not an attribute and therefore
   * cannot be expressed in JSX, plus `aria-checked="mixed"` so assistive technology agrees. Note
   * the ordering rule from `CheckBox.d.ts`: checked and indeterminate together still render as
   * partially checked, and unchecked wins over indeterminate.
   */
  indeterminate?: boolean | undefined;

  /**
   * Not implemented. Deliberately absent rather than broken.
   *
   * `readonly` has no effect on a checkbox in the HTML spec, so honouring it means refusing a toggle
   * the browser has already performed. The failure mode is worse than the gap: the box renders
   * checked while announcing `aria-checked="false"`. `Switch` documents the measurement in full —
   * three approaches were built and all three lost to React's controlled-input restore. A consumer
   * who needs to refuse a change controls `checked` and declines by not updating it.
   */
  readOnly?: never;

  /** Not actionable. Native `disabled`, so it leaves the tab order and is not submitted. */
  disabled?: boolean | undefined;

  /**
   * Rendered with the native `required` attribute, so the browser's own form validation applies.
   *
   * Adds a visually hidden "Required" to the label.
   */
  required?: boolean | undefined;

  /**
   * Advisory intent of the box.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Visual size. `sm` is the dense table-row and toolbar size and is the minimum that still meets
   * the target-size floor; see `docs/foundations.md` §2.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Whether the label sits before or after the box.
   *
   * @default "end"
   */
  labelPosition?: "start" | "end" | undefined;

  /**
   * Value submitted with the form.
   *
   * Only a **checked** checkbox contributes to submission, which is the platform's behaviour and is
   * why a checkbox is the right control for an optional value and a `Select` for a required one.
   */
  value?: string | undefined;

  /** Name submitted with the form, and what groups same-named checkboxes in a server round trip. */
  name?: string | undefined;

  /**
   * Announced description, wired to `aria-describedby` when an `id` is present.
   *
   * The same contract as `Textbox`'s `helperText`: it exists to be announced, not merely rendered.
   */
  helperText?: ReactNode | undefined;

  /** Merged onto the component root, never onto the input. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the `<input type="checkbox">`.
   *
   * Named `ref` because the input is the element a consumer focuses imperatively and reads state
   * from, and there is no proxy element to disambiguate from.
   */
  ref?: Ref<HTMLInputElement> | undefined;
}

export type CheckboxProps = CheckboxOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof CheckboxOwnProps | "children" | "defaultChecked">;
