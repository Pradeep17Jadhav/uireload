/**
 * Stepper prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/**
 * Whether the completed steps are navigable.
 *
 * The component's one real fork, and it changes the keyboard contract rather than just the styling.
 */
export type StepperNavigation = "linear" | "non-linear";

export interface StepperStep {
  /** Stable identity. Used in `onStepClick` and for React's key. */
  id?: string | undefined;

  /** The step's heading. Announced, so plain text is the safe choice. */
  label: ReactNode;

  /** Secondary text under the label. */
  description?: ReactNode | undefined;

  /** Whether the user may skip past this step. */
  optional?: boolean | undefined;

  /**
   * Whether this step can be entered.
   *
   * Distinct from "is the current step", and distinct from `optional`: a step can be locked because
   * something before it is incomplete, which is not the same as being optional.
   */
  disabled?: boolean | undefined;

  /** Advisory intent of the marker. */
  tone?: Tone | undefined;

  /**
   * Reported when this step is in an error state.
   *
   * `aria-current` is still used, because a stepper's marker *is* the position indicator; this adds
   * the reason. An error a screen reader cannot hear is an error a screen reader user cannot act on.
   */
  errorText?: string | undefined;
}

/**
 * Where a step's label sits relative to its marker.
 *
 * Logical, so `block-start` and `block-end` mirror in a vertical writing mode rather than meaning
 * "above" and "below" whichever way is up.
 *
 * `inline-end` is the default and is the only one of the three that can put the connector under the
 * text, which is why the default exists: the horizontal strip is the case the connector was drawn for,
 * and it is the one where a label beside its marker reads in one pass.
 */
export type StepperLabelPlacement = "inline-end" | "block-start" | "block-end";

export interface StepperOwnProps {
  /** The steps. Order is the order. */
  steps: readonly StepperStep[];

  /** Zero-based index of the current step. */
  active?: number | undefined;

  /**
   * Called when the current step should change.
   *
   * The component never moves itself. A stepper that advances on its own is a wizard that has decided
   * the user is finished, and "finished" is the one judgement this component has no basis to make.
   */
  onStepChange?: ((index: number) => void) | undefined;

  /**
   * Whether steps ahead of the current one can be entered.
   *
   * @default "linear"
   *
   * `linear` is the default: the user moves forward one step at a time, and an **upcoming** step is
   * not a button. Going *back* is still allowed — a wizard you cannot return to in order to fix the
   * address you typed two steps ago is a wizard people abandon.
   *
   * `non-linear` makes every step the user has not yet reached a button too, which is the right
   * shape when nothing before the current step has to be filled in first.
   *
   * Either way the **current** step's header is a `<div>` rather than a button, because activating it
   * would report a move that did not happen. So the strip's tab stops are exactly its reachable
   * steps, and `Tab` never lands on something inert.
   */
  navigation?: StepperNavigation | undefined;

  /**
   * Layout direction.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical" | undefined;

  /**
   * Where a step's label sits relative to its marker.
   *
   * @default "inline-end"
   *
   * `inline-end` puts the label beside its marker, which is one pass of the eye along a horizontal
   * strip. `block-start` and `block-end` put it above or below the marker, which is what a narrow
   * column needs: a label beside its marker needs at least the marker's width plus the longest word,
   * and a stepper in a 12rem sidebar cannot hold that.
   *
   * The connector never crosses the label in any of the three. Beside, it runs from one marker's edge
   * to the next's, in the gap between two steps; above or below, it runs behind the marker row while
   * the label has a row of its own. That is the bug this prop exists alongside — the connector used to
   * span the full width of each step at marker height, which put a 1px line straight through the text.
   */
  labelPlacement?: StepperLabelPlacement | undefined;

  /** Whether to show content beneath the strip. @default false */
  showContent?: boolean | undefined;

  /** Content, rendered beneath the strip when `showContent`. */
  children?: ReactNode | undefined;

  /**
   * Whether the current position is announced.
   *
   * @default true
   *
   * A `role="status"` region reading "Step 2 of 4". Advancing through a wizard with no announcement
   * is the experience of pressing next and hearing nothing happen.
   */
  announcePosition?: boolean | undefined;

  /** Announced noun for a step. @default "Step" */
  stepLabel?: string | undefined;

  /** Accessible name for the whole stepper. */
  label?: string | undefined;

  /** Not actionable. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto a header. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type StepperProps = StepperOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof StepperOwnProps | "children">;
