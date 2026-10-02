/**
 * Slider prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/** One labelled point on the track, at a value the user can land on. */
export interface SliderMark {
  /** The value this mark sits at. Must be a multiple of `step` or equal to `min`, or it is unreachable. */
  value: number;

  /** What is drawn under the track. */
  label?: ReactNode | undefined;
}

export interface SliderOwnProps {
  /**
   * Accessible name, required because a slider announces only its current value.
   *
   * A `role="slider"` with no name is announced as "slider, 40 percent" and nothing about what it
   * is measuring. This is the one prop a slider genuinely cannot do without.
   */
  label: string;

  /**
   * Controlled value. `undefined` means uncontrolled; see `useControllableState`.
   *
   * Always an **array**, even for a single-thumb slider, matching how a range control is specified:
   * a one-thumb slider is a range whose ends happen to be bound together. Using `number | number[]`
   * would mean every consumer's callback had to narrow a union before it could read anything, and
   * the two cases differ only in how many thumbs are drawn.
   *
   * The array is always ordered low-to-high and always the same length as the number of thumbs. A
   * consumer passing them out of order or of the wrong length gets the value clamped and the test
   * tells them, rather than a slider whose thumbs disagree with its value.
   */
  value?: readonly number[] | undefined;

  /** Initial value when uncontrolled. Same shape and ordering rule as `value`. */
  defaultValue?: readonly number[] | undefined;

  /**
   * Called on every change, including each step of a drag and each arrow key.
   *
   * Named for what changed rather than after the DOM event, consistent with `Checkbox` and
   * `Switch`.
   */
  onValueChange?: ((value: number[]) => void) | undefined;

  /**
   * Called once the change is settled: on pointer release, and on each arrow key press.
   *
   * Both are one "the user has finished deciding" moment. Kept separate from `onValueChange`
   * because a slider that fires only on commit cannot show a live readout, and one that fires only
   * live cannot be submitted — a form needs the committed value.
   */
  onValueCommit?: ((value: number[]) => void) | undefined;

  /** Lowest value. @default 0 */
  min?: number | undefined;

  /** Highest value. @default 100 */
  max?: number | undefined;

  /**
   * Granularity.
   *
   * `null` means continuous — the value is whatever the pointer lands on, snapped only to two
   * decimal places so floating-point drift cannot produce `0.30000000000000004`. `0` is rejected at
   * runtime rather than treated as continuous, because a zero step is a slider that cannot move and
   * a continuous one that can: too different to guess at, so it is a bug worth reporting.
   *
   * @default 1
   */
  step?: number | null | undefined;

  /**
   * How many thumbs, derived from the length of `value` or `defaultValue`.
   *
   * Not a prop. A separate `thumbs` count that disagrees with the value array is a component with
   * two sources of truth for one fact, and every consumer would have to keep them in step.
   */
  marks?: readonly SliderMark[] | undefined;

  /** Whether the marks are drawn as tick marks only, without labels. */
  showLabels?: boolean | undefined;

  /**
   * Text announced for a value, when a bare number is not what a screen reader should say.
   *
   * Called with the value and the thumb index. Without it the announced value is the raw number, so
   * a price slider announces "40" where "40 dollars" is meant.
   */
  getAriaValueText?: ((value: number, index: number) => string) | undefined;

  /**
   * Show a bubble with the current value while dragging or focused.
   *
   * @default "off"
   *
   * Deliberately off. A permanently visible value label duplicates what assistive technology
   * already announces and what the `aria-valuenow` attribute already carries, so it is noise for
   * most users. It exists for the case where the value is not otherwise visible — a bare slider in
   * a colour-picker strip, say.
   */
  valueLabelDisplay?: "auto" | "on" | "off" | undefined;

  /**
   * Layout direction, which also selects the arrow-key axis.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical" | undefined;

  /**
   * Which part of the track is filled.
   *
   * `normal` fills from the lowest value to the highest, `inverted` fills from the centre outwards
   * — a bipolar control, where the middle is "nothing" and either end is "a lot". Inverted is
   * meaningless for a single thumb, where there is no centre to be symmetrical about, so it falls
   * back to `normal` there rather than rendering a half-filled bar.
   *
   * @default "normal"
   */
  track?: "normal" | "inverted" | undefined;

  /** Not actionable. Native `disabled` on every thumb, so all of them leave the tab order. */
  disabled?: boolean | undefined;

  /** Advisory intent of the filled track. @default "neutral" */
  tone?: Tone | undefined;

  /** Visual size of the track and thumb. @default "md" */
  size?: "sm" | "md" | "lg" | undefined;

  /**
   * Whether to snap to the nearest step while dragging.
   *
   * @default true
   *
   * On, because the pointer cannot be placed at exactly `step * 3` and a slider that reports
   * `37.4821` for a stepped control is reporting noise. Off is for a genuinely continuous control,
   * which is what `step={null}` is for.
   */
  snapToStep?: boolean | undefined;

  /**
   * Hide the numeric readout beside the label.
   *
   * @default false
   */
  hideValueText?: boolean | undefined;

  /** Name submitted with the form. */
  name?: string | undefined;

  /** Announced description, wired to `aria-describedby` when an `id` is present. */
  helperText?: ReactNode | undefined;

  /** Merged onto the component root, never onto a thumb. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the first thumb's `<input type="range">`.
   *
   * The first rather than the root, because that is the element a consumer focuses and reads state
   * from. A range control's native input is per-thumb, so this is the closest single answer.
   */
  ref?: Ref<HTMLInputElement> | undefined;
}

/**
 * The type is `HTMLAttributes<HTMLDivElement>` rather than `HTMLInputElement`.
 *
 * The root is a wrapper div, and inheriting from the input would let a consumer pass `value` or
 * `checked`-shaped attributes that the component already owns. `value` is in fact omitted below,
 * because ours is an array and the native one is a scalar.
 */
export type SliderProps = SliderOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof SliderOwnProps | "children" | "value" | "defaultValue"
  >;
