/**
 * Switch prop types.
 *
 * API decomposition from MUI's `SwitchProps` and `SwitchBaseProps`
 * (`@mui/material/Switch/Switch.d.ts`, `@mui/material/internal/SwitchBase.d.ts`);
 * documented behaviour, `@csspart` parts and the design enum from UI5's `ui5-switch`
 * (`@ui5/webcomponents/dist/Switch.d.ts`). Reconciliation and the full citation list are
 * in `README.md`.
 */

import type { CSSProperties, InputHTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

/**
 * Props specific to `Switch`. Everything else comes from the native element.
 *
 * Deliberately absent, with reasons recorded in `README.md`:
 *
 * - `color` — `tone` instead; there is no palette to key into.
 * - `icon` / `checkedIcon` (MUI) — a glyph inside the handle. `role="switch"` with
 *   `aria-checked` already announces the state, so an icon beside it is a second,
 *   contradictory signal. UI5's `SwitchDesign.Graphical` puts check/cross icons there for
 *   the same purpose; see the rejected list.
 * - `design` (UI5) — `Textual` vs `Graphical`. Rejected: the second is a Material/Fiori
 *   flourish whose meaning duplicates `aria-checked`, and its text mode truncates at three
 *   characters, which is a documented Fiori limitation rather than a design.
 * - `textOn` / `textOff` (UI5) — see the rejected list. The label is the consumer's.
 * - `edge` (MUI) — a Material ripple-layout affordance; this library has no ripples.
 * - `tooltip` (UI5) — a tooltip on a labelled control is noise. UI5's own JSDoc says an
 *   external label reference is always preferable.
 * - `disableRipple`, `disableFocusRipple` — Material machinery; a focus ring is never
 *   optional.
 */
export interface SwitchOwnProps {
  /**
   * Visible label, rendered as a real `<label for>` beside the control.
   *
   * Required in practice. `role="switch"` with `aria-checked` says what the control *is*
   * but never *what it is for*, so a switch with no name is announced only as "switch,
   * on". A development warning is logged when neither `label` nor an `aria-label` /
   * `aria-labelledby` is present.
   *
   * Needs an `id` to bind the label's `for`; the same warning covers that case.
   */
  label?: ReactNode | undefined;

  /**
   * Controlled checked state. `undefined` means uncontrolled; see `useControllableState`.
   */
  checked?: boolean | undefined;

  /** Initial state when uncontrolled. */
  defaultChecked?: boolean | undefined;

  /**
   * Called whenever the component intends to change `checked`.
   *
   * Not `onChange`: the native `onChange` is a React event handler and is forwarded
   * untouched, so a component that reported the state through it would break every
   * consumer reading `event.target.checked`. Matches `Textbox`'s `onValueChange` and
   * `ToggleButton`'s `onPressedChange`.
   */
  onCheckedChange?: ((checked: boolean) => void) | undefined;

  /**
   * Not actionable, and out of the tab order. Rendered with the native `disabled`
   * attribute.
   */
  disabled?: boolean | undefined;

  /**
   * **Not implemented. Deliberately absent rather than broken.**
   *
   * UI5 has it (`readonly`, since 2.21.0) and pairs it with `effectiveAriaReadonly`. It is not
   * here because `readonly` has no effect on a checkbox in the HTML spec, so implementing it means
   * refusing a toggle the browser has already performed — and three separate implementations were
   * measured against React 19, all ending with the control visually checked while announcing
   * `aria-checked="false"`. The full account is in `switch.tsx` and in `README.md`.
   *
   * Until then, render a disabled switch, or control `checked` and decline to update it.
   */
  readOnly?: never;

  /**
   * Rendered with the native `required` attribute, so the browser's own form validation
   * applies. Adds a visually hidden "Required" to the label.
   */
  required?: boolean | undefined;

  /**
   * Size. See `docs/foundations.md` section 2.
   *
   * MUI only ships `small | medium`; the shared three-tier scale is used here so a switch
   * can line up with an `sm` or `lg` field.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * The colour of the track when on.
   *
   * There is no `variant` on a switch. The emphasis ladder describes how loud a *command*
   * is, and a switch is a setting rather than an action; a "ghost" switch would be
   * invisible by definition, and a "solid" one is what every switch already is.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Puts the label before the control instead of after it.
   *
   * For layouts that read top-to-bottom, where a trailing label looks detached from its
   * switch. This is the same `start` / `end` vocabulary as `docs/foundations.md` section 7,
   * and it is a logical direction, not a physical one, so it mirrors in RTL.
   */
  labelPosition?: "start" | "end" | undefined;

  /** Merged onto the component root, never onto the `<input>`. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the `<input>`.
   *
   * Named `ref` rather than MUI's `inputRef` because there is no proxy element to
   * disambiguate from.
   */
  ref?: Ref<HTMLInputElement> | undefined;
}

/**
 * Native `InputHTMLAttributes` are forwarded to the `<input>`, not to the root, so `name`,
 * `form`, `value` and every `on*` handler behave exactly as on a bare checkbox.
 *
 * `className` and `style` are excluded because the library's contract is that they always
 * land on the component root (`src/components/README.md`).
 */
export type SwitchProps = SwitchOwnProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof SwitchOwnProps | "className" | "style">;
