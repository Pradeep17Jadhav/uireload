/**
 * Textbox prop types.
 *
 * The reasoning behind each choice is in `README.md`.
 */

import type { CSSProperties, InputHTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * The elements a `Textbox` can render.
 *
 * A single-line `Textbox` renders `<input>`; a `multiline` one renders `<textarea>`.
 * The forwarded ref is typed as the union because the component decides which one it
 * is, not the consumer.
 */
export type TextboxElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * The input types a text field accepts.
 *
 * The set is a published `InputType` enum
 * (`Text`, `Email`, `Number`,
 * `Password`, `Tel`, `URL`, `Search`), spelled in the lowercase form the HTML attribute
 * requires. `URL` and `Tel` are capitalised in the enum only because it is a TypeScript
 * enum, and comparable libraries document `type` as "a valid HTML5
 * input type", so the native spelling is what belongs in a DOM attribute.
 *
 * Narrowed deliberately, exactly as `ButtonType` is on `Button`. Some libraries leave `type` as
 * `string`; a typo in `type="emmial"` would then be an inert attribute rather than a
 * compile error.
 *
 * Excluded on purpose, and therefore a gap: `date`, `time`, `datetime-local`, `month`,
 * `week`, `color`, `range` and `file` are not text entry, and a date picker needs
 * locale-aware parsing and a calendar surface that this component has no opinion about.
 * A consumer who needs one today renders a native `<input>` and styles it with
 * `.uir-textbox__control`. See `README.md`.
 */
export type TextboxType = "text" | "email" | "number" | "password" | "search" | "tel" | "url";

/**
 * Props specific to `Textbox`. Everything else comes from the native element.
 *
 * Deliberately absent, with reasons recorded in `README.md`:
 *
 * - `color` / `error` — `tone` and `invalid` instead. See `README.md`.
 * - `sx`, `slots`, `slotProps`, `classes`, `inputProps`, `inputComponent`,
 *   `renderSuffix` — theme and override machinery this library deliberately rejects
 *   (`AGENTS.md` section 4).
 * - `margin: 'dense' | 'none'` — density is `[data-uir-density]` in this
 *   library, not a per-field prop.
 * - `showClearIcon` — a clear button is an interactive child, and needs the
 *   `Button` this library already has. Recorded as a gap rather than reinvented here.
 * - `minRows` / `maxRows` — need an auto-sizing algorithm, which is its own
 *   component.
 * - `accessibleName` / `accessibleNameRef` — a real `<label for>` is strictly
 *   better than an ARIA name override: it also gives a visible, clickable target.
 *   `aria-label` and `aria-labelledby` are forwarded natively when they are the right
 *   tool.
 */
export interface TextboxOwnProps {
  /**
   * Visible label, rendered as a real `<label for>` above the field.
   *
   * A visible label that is not programmatically associated is invisible to a screen
   * reader, so `id` is required for this to do anything useful. A development warning
   * is logged when `label` is present without an `id`.
   *
   * Not a `<legend>`: that belongs to a `fieldset`, and this is a single control.
   */
  label?: ReactNode | undefined;

  /**
   * Text below the field: a hint, a format note, or the validation message.
   *
   * Automatically announced through `aria-describedby` when an `id` is present. A
   * consumer who passes their own `aria-describedby` keeps it; the two are not merged,
   * because guessing how to interleave two independent description lists is a worse
   * outcome than one predictable rule.
   *
   * This is the `valueStateMessage` slot of one design and `helperText` of another, and it is the only
   * non-colour signal the invalid state has. Pair it with `invalid`.
   */
  helperText?: ReactNode | undefined;

  /**
   * The field's current value failed validation.
   *
   * Sets `aria-invalid` and repaints the control in the `danger` role set, whatever
   * `tone` says. Validation and intent are separate decisions: `tone="positive"`
   * describes an advisory state, and an advisory state that has been overridden by a
   * server-side error must not still read as a confirmation.
   *
   * Named for `aria-invalid` and the CSS `:invalid` pseudo-class rather than a boolean
   * `error`, so the prop, the attribute and the pseudo-class all say the same thing.
   */
  invalid?: boolean | undefined;

  /**
   * Size. See `docs/foundations.md` section 2.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Emphasis of the control's box.
   *
   * Reuses the shared ladder rather than a component-specific `standard | filled | outlined`, so a
   * field and a button in the same row cannot disagree about what "outline" means.
   *
   * @default "outline"
   */
  variant?: Variant | undefined;

  /**
   * Advisory intent, orthogonal to `variant`. `invalid` overrides it.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Not actionable. Rendered with the native `disabled` attribute, so it is out of the
   * tab order and omitted from form submission, and styled with `opacity` so a tooltip
   * can still explain why.
   */
  disabled?: boolean | undefined;

  /**
   * Focusable and selectable, but not editable. Rendered with the native `readonly`
   * attribute: unlike `disabled`, a read-only field is still submitted with the form and
   * is still announced as a field.
   */
  readOnly?: boolean | undefined;

  /**
   * Rendered with the native `required` attribute, so the browser's own validation and
   * `:user-invalid` styling work.
   *
   * Adds a visually hidden "Required" from the i18n catalog to the label. The asterisk
   * beside it is `aria-hidden`, so a screen reader hears the word rather than the symbol.
   */
  required?: boolean | undefined;

  /** Fills the width of the containing block. */
  fullWidth?: boolean | undefined;

  /**
   * Renders a `<textarea>` instead of an `<input>`.
   *
   * `type` does not apply and is dropped rather than silently forwarded, because a
   * `type` on a `<textarea>` is not a valid attribute.
   */
  multiline?: boolean | undefined;

  /**
   * Visible rows, when `multiline`.
   *
   * Left unset by default so the browser's own two-row default applies; a
   * `TextareaAutosize` behaviour is not reproduced. See `README.md`.
   */
  rows?: number | undefined;

  /**
   * Content placed before the text entry area.
   *
   * Rendered as a non-interactive, `aria-hidden` slot, so an icon or a unit cannot
   * steal a keystroke or add to the field's accessible name. Anything that *is*
   * interactive belongs after the field, as a sibling.
   */
  startAdornment?: ReactNode | undefined;

  /**
   * Content placed after the text entry area. Same rules as {@link startAdornment}.
   */
  endAdornment?: ReactNode | undefined;

  /**
   * Controlled value. `undefined` means uncontrolled; see `useControllableState`.
   *
   * Narrows the native `value` from `string | number | readonly string[]` to `string`,
   * which is what a text field can actually hold.
   */
  value?: string | undefined;

  /** Initial value when uncontrolled. */
  defaultValue?: string | undefined;

  /**
   * Called with the new value on every keystroke.
   *
   * Not `onChange`: the native `onChange` is a React event handler and is forwarded
   * untouched, so a component that reported the value through it would break every
   * consumer reading `event.target.value`. This follows `ToggleButton`'s `onPressedChange`.
   */
  onValueChange?: ((value: string) => void) | undefined;

  /**
   * Native input type. Ignored when `multiline`.
   *
   * @default "text"
   */
  type?: TextboxType | undefined;

  /** Merged onto the component root, never onto the `<input>`. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the `<input>`, or to the `<textarea>` when `multiline`.
   *
   * Documented as the union {@link TextboxElement} because the component picks the
   * element, and a consumer who needs the concrete type narrows it themselves.
   */
  ref?: Ref<TextboxElement> | undefined;
}

/**
 * Native `InputHTMLAttributes` are forwarded to the text entry element, not to the
 * root, so `name`, `form`, `placeholder`, `autoComplete`, `maxLength`, `inputMode` and
 * every `on*` handler behave exactly as they do on a bare `<input>`.
 *
 * `className` and `style` are excluded because the library's contract is that they
 * always land on the component root (`src/components/README.md`).
 *
 * Known narrowing, recorded rather than hidden: in `multiline` mode the textarea
 * receives the subset of these it supports, and the numeric-input attributes `min`,
 * `max` and `step` are accepted by the type but have no effect on a textarea.
 */
export type TextboxProps = TextboxOwnProps &
  Omit<InputHTMLAttributes<TextboxElement>, keyof TextboxOwnProps | "className" | "style">;
