/**
 * Chip prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

export interface ChipOwnProps {
  /** What the chip says. The only required prop. */
  children?: ReactNode | undefined;

  /**
   * Where the chip leads.
   *
   * This is the one prop that changes what the chip *is*, and it decides the rendered element:
   *
   * - `none` (default) — a `<span>`. Not focusable, not actionable. The right choice for a static
   *   label such as a category or a count, which is most uses.
   * - `button` — a `<button type="button">`. A chip the user can activate. This is the form to reach
   *   for when the whole chip does something.
   * - `remove` — a `<span>` with a real `<button>` inside for the removal affordance. The chip's
   *   content is *not* itself interactive; only the trailing control is.
   *
   * A single boolean would have been wrong for `remove`: a chip that is both activatable and
   * removable has two separate tab stops and two separate accessible names, and collapsing that to
   * one boolean is how nested-interactive controls get shipped.
   *
   * @default "none"
   */
  intent?: "none" | "button" | "remove" | undefined;

  /**
   * Advisory intent, painted as a wash with a matching text colour.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /** Visual size. @default "md" */
  size?: Size | undefined;

  /**
   * Filled or outlined.
   *
   * `filled` is a wash of the tone; `outlined` is a border of the tone on the surface. Outlined is
   * for a set where colour carries no information and the chips would otherwise read as a wall of
   * colour — outlined is quieter at the same contrast.
   *
   * @default "filled"
   */
  variant?: "filled" | "outlined" | undefined;

  /**
   * Leading adornment, decorative.
   *
   * `aria-hidden`, because it is drawn rather than spoken: the chip's own text is the name, and a
   * leading icon announced as well would say the same thing twice. When the icon carries meaning
   * that the text does not, put it in the text instead.
   */
  icon?: ReactNode | undefined;

  /**
   * Announced name for the remove button.
   *
   * Required when `intent="remove"` and there is more than one chip in a group: "Remove" alone
   * announces as "Remove button", which does not say what is being removed. Pass something that
   * includes the chip's own text — `"Remove Weekly"`.
   *
   * The default is the chip's text followed by the word, built from the `chip.remove` message. That
   * is right for a one-off and wrong for a list of twelve, which is why it is a prop.
   */
  removeLabel?: string | undefined;

  /**
   * Called when the remove control is activated.
   *
   * The chip does not remove itself. A list is the consumer's state, and a component that deleted
   * its own row without telling the caller would leave the model and the view disagreeing.
   */
  onRemove?: (() => void) | undefined;

  /** Not actionable. The whole chip, including its remove control. */
  disabled?: boolean | undefined;

  /**
   * Label announced for an activatable chip, when the children are not plain text.
   *
   * A `<button>` needs an accessible name; arbitrary content often yields nothing useful.
   */
  buttonLabel?: string | undefined;

  /** Merged onto the component root, never onto the remove button. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the interactive element when there is one — the `<button>` for `intent="button"`,
   * the remove `<button>` for `intent="remove"`, and nothing for `intent="none"`, which is not
   * focusable.
   */
  ref?: Ref<HTMLElement> | undefined;
}

/**
 * The type is `HTMLAttributes<HTMLElement>` rather than `HTMLDivElement`.
 *
 * The rendered element depends on `intent`, so the widest element any variant can produce is the
 * honest base. `onClick` and the other mouse handlers are deliberately absent from this type's
 * usefulness on `intent="none"`: a non-interactive chip forwards them to a span, where they are
 * meaningful only if the consumer has put their own handler on it.
 */
export type ChipProps = ChipOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof ChipOwnProps | "children">;
