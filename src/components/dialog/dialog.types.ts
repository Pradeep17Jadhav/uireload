/**
 * Dialog prop types.
 *
 * The reasoning behind each choice is in `README.md`.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

/**
 * How urgent the dialog is, and therefore what role it takes.
 *
 * Urgency is a separate axis rather than a value state, because deriving the role from the
 * colour couples two independent decisions together.
 *
 * Splitting them means a consumer can say "this is urgent" with a name that means urgency rather
 * than with a colour that means it, and can say "positive" without accidentally becoming an
 * assertive live region.
 *
 * `alertdialog` is the consequential one. An `alertdialog` is an assertive live region: assistive
 * technology announces the dialog *as soon as it appears*, interrupting whatever the user was
 * doing. That is correct for a destructive confirmation that must not be missed, and wrong for
 * almost everything else.
 */
export type DialogUrgency = "normal" | "alert";

/**
 * Why the dialog asked to close.
 *
 * The reason is a named value rather than a boolean, because "the user pressed Escape" and
 * "the user pressed the backdrop" are different things to react to and a boolean cannot tell them
 * apart.
 *
 * Named here in the past tense, like `Popover`'s, so the callback reads as a description of what
 * happened rather than as an instruction.
 */
export type DialogCloseReason = "escape" | "backdrop-press";

/**
 * Where focus goes when the dialog opens.
 *
 * The APG dialog pattern says focus moves to the element inside the dialog that is most useful
 * for the interaction, and that is often not the first one. A delete confirmation should focus
 * Cancel, not the heading and not the destructive button.
 */
export type DialogInitialFocus = "auto" | "container";

export interface DialogOwnProps {
  /**
   * Controlled open state. `undefined` means uncontrolled; see `useControllableState`.
   *
   * When closed, nothing is rendered — see `Popover` for why an inert surface is worse than no
   * surface.
   */
  open?: boolean | undefined;

  /** Initial state when uncontrolled. */
  defaultOpen?: boolean | undefined;

  /** Called whenever the component intends to change `open`. */
  onOpenChange?: ((open: boolean) => void) | undefined;

  /**
   * Called when the dialog asks to close, with why.
   *
   * Fires for Escape and for a backdrop press, and always fires regardless of whether the close
   * is accepted — use `onOpenChange` to veto.
   */
  onClose?: ((reason: DialogCloseReason) => void) | undefined;

  /**
   * How urgent this is. `alert` takes `role="alertdialog"`, which announces the dialog as soon as
   * it appears.
   *
   * @default "normal"
   */
  urgency?: DialogUrgency | undefined;

  /**
   * Visible heading, and the element `aria-labelledby` points at.
   *
   * Strongly recommended: a dialog with no name is announced as "dialog" and nothing else. Pass
   * `label` for the case where the heading is rendered by the consumer instead.
   */
  title?: ReactNode | undefined;

  /** Accessible name, applied as `aria-label` when there is no `title`. */
  label?: string | undefined;

  /**
   * Intent of the surface's border and the footer.
   *
   * This is the *visual* tone and is deliberately separate from {@link urgency}. A single
   * `state` value that drives both the role and the colour makes a negative dialog red *and*
   * assertive whether or not that was meant. Splitting them is the point of the two axes existing
   * at all.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Maximum width.
   *
   * A dialog's size is a content decision, not an emphasis one, so this is the shared `Size`
   * scale read as a width rather than a height — and it is why there is no `variant`.
   * `lg` is wide enough for a form; below 30rem the surface goes edge to edge instead, which is
   * what a phone user expects from a modal.
   *
   * The size does not change the padding, type scale or control sizes: a dialog containing one
   * field and a dialog containing a form should use the same controls, so the two read as one
   * system. Set `data-size` from your own CSS if you need it to.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Where focus goes on open.
   *
   * `auto` focuses the first tabbable descendant, or the dialog itself when there is none —
   * which is why an empty dialog is still usable. `container` always focuses the dialog, for the
   * case where focusing the first button would put a keyboard user one keystroke from a
   * destructive action.
   *
   * @default "auto"
   */
  initialFocus?: DialogInitialFocus | undefined;

  /**
   * Restores focus to the element that had it before the dialog opened.
   *
   * Set this to `false` when the trigger was removed, or when something else takes focus on
   * close.
   *
   * @default true
   */
  restoreFocus?: boolean | undefined;

  /**
   * Closes when the user presses Escape.
   *
   * On by default, and it should stay on. A dialog that cannot be dismissed with Escape strands a
   * keyboard user inside it.
   *
   * @default true
   */
  closeOnEscape?: boolean | undefined;

  /**
   * Closes when the user presses the backdrop.
   *
   * On by default. For a destructive confirmation, turn it off — a stray click should not discard
   * the user's work.
   *
   * @default true
   */
  closeOnBackdropPress?: boolean | undefined;

  /** Rendered at the top of the surface, above the heading. */
  header?: ReactNode | undefined;

  /**
   * Rendered at the bottom, in a footer row.
   *
   * Where action buttons belong. The footer is not sticky by default; it
   * scrolls with the content, which is right for a short dialog and wrong for a long one.
   */
  footer?: ReactNode | undefined;

  /**
   * A button that closes the dialog.
   *
   * Rendered inside the header, `aria-hidden` is *not* applied to it — this is a real control, and
   * hiding it from assistive technology would leave a keyboard user with no way out but the footer
   * actions. Give it a label; `aria-label="Close"` is applied only if you supply none.
   */
  showCloseButton?: boolean | undefined;

  /** Accessible name for the close button, from the i18n catalog by default. */
  closeButtonLabel?: string | undefined;

  /** Rendered inside the surface, in the content region. */
  children?: ReactNode | undefined;

  /** Merged onto the surface element. */
  className?: string | undefined;

  /** Inline styles for the surface element. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the surface element.
   *
   * The surface is the element that carries `role`, so `aria-label` and `className` belong there.
   */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type DialogProps = DialogOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof DialogOwnProps | "title" | "role">;
