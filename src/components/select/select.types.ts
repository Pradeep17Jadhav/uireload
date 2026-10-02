/**
 * Select prop types.
 *
 * API decomposition from MUI's `SelectProps` (`@mui/material/Select/Select.d.ts`); documented
 * behaviour, keyboard handling and the option/group model from UI5's `ui5-select`
 * (`@ui5/webcomponents/dist/Select.d.ts`). Reconciliation and the full citation list are in
 * `README.md`.
 */

import type { ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * One option.
 *
 * `value` is required and `label` is what the user reads. UI5 collapses these by using the text
 * content as both (`_applySelectionByValue` falls back to matching text content), which means a
 * value can silently change when someone rewords a label — so the two are separate here.
 *
 * Both reference libraries allow `children` on an option (`OptionCustom`, MUI's `renderValue`);
 * it is accepted here as content rendered *after* the label, and the label is what names the
 * option. An option whose whole content is arbitrary React would need its own item component and
 * its own announcement contract.
 */
export interface SelectOption {
  /** The value submitted with the form and reported by `onChange`. Required and stable. */
  value: string;
  /** What the user reads. */
  label: ReactNode;
  /**
   * Text announced for the option, when `label` is not plain text.
   *
   * Required only when `label` contains elements or images, because the accessible name of an
   * option is derived from its content and arbitrary content often yields nothing useful.
   */
  textValue?: string | undefined;
  /**
   * Not selectable.
   *
   * A disabled option is skipped by every keyboard path — arrows, Home/End and typeahead — which
   * is what makes it usable with a keyboard rather than merely visible.
   */
  disabled?: boolean | undefined;
  /** Rendered after the label. Decorative by default; see `textValue`. */
  children?: ReactNode | undefined;
}

/**
 * A labelled group of options.
 *
 * Rendered as a `role="group"` with an `aria-label`, which is the APG listbox grouping rather than
 * a nested listbox. UI5 uses `<ui5-option-group>` with a `headerText` slot and a `_groupCountText`
 * announcement ("3 options"); the count is not reproduced here, and the reason is recorded in
 * `README.md`.
 */
export interface SelectOptionGroup {
  /** Renders the options as a group. Discriminates this from a plain option. */
  group: true;
  /** The group's visible heading, and its accessible name. */
  label: ReactNode;
  /** Text announced for the group, when `label` is not plain text. */
  textValue?: string | undefined;
  /** The options in this group. */
  options: readonly SelectOption[];
}

/** Either an option or a group. */
export type SelectItem = SelectOption | SelectOptionGroup;

/** Whether a value is a group rather than an option. */
export /**
 * A Select, for consumers who need to branch on the item shape.
 *
 * Exported because the discriminated union is genuinely useful when mapping over `options`:
 * without a type guard, narrowing a `SelectItem` to its `options` array requires the check anyway.
 */
function isOptionGroup(item: SelectItem): item is SelectOptionGroup {
  return (item as SelectOptionGroup).group === true;
}

export interface SelectOwnProps {
  /**
   * Visible label, rendered as a real `<label for>` above the trigger.
   *
   * Needs an `id` to bind the label's `for`, which is also what `aria-labelledby` points at. The
   * same development warning as `Textbox` covers the case where `id` is missing.
   */
  label?: ReactNode | undefined;

  /** The options. Groups may be nested one level deep. */
  options: readonly SelectItem[];

  /**
   * Controlled selected value. `undefined` means uncontrolled.
   *
   * A value matching no option renders the placeholder, which is UI5's documented behaviour: "If
   * the given value does not match any existing option, no option will be selected and the Select
   * component will be displayed as empty."
   */
  value?: string | undefined;

  /** Initial value when uncontrolled. */
  defaultValue?: string | undefined;

  /**
   * Called with the newly selected value.
   *
   * Typed rather than an event handler, unlike `Textbox` and `Switch`, because a Select has no
   * meaningful change *event* to hand back: the native event is the trigger's `click` or the
   * listbox's `keydown`, and neither says which option was chosen. A value is the only thing a
   * consumer needs.
   */
  onChange?: ((value: string) => void) | undefined;

  /** Text shown when no option is selected. Also the accessible name of the listbox. */
  placeholder?: string | undefined;

  /**
   * Announced description, wired to `aria-describedby` when an `id` is present.
   *
   * The same contract as `Textbox`'s `helperText`: it exists to be announced, not merely rendered.
   */
  helperText?: ReactNode | undefined;

  /** Size. See `docs/foundations.md` section 2. */
  size?: Size | undefined;

  /**
   * Emphasis of the trigger's box, on the shared ladder.
   *
   * @default "outline"
   */
  variant?: Variant | undefined;

  /**
   * Advisory intent of the trigger.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * The current value failed validation.
   *
   * Sets `aria-invalid` and paints the trigger in the `danger` role set, whatever `tone` says.
   * Named for `aria-invalid` and `:invalid`, as on `Textbox`.
   */
  invalid?: boolean | undefined;

  /** Not actionable. Native `disabled`, so it is out of the tab order and not submitted. */
  disabled?: boolean | undefined;

  /**
   * Rendered with the native `required` attribute, so the browser's own form validation applies.
   *
   * Adds a visually hidden "Required" to the label.
   */
  required?: boolean | undefined;

  /** Fills the width of the containing block. */
  fullWidth?: boolean | undefined;

  /**
   * **Not implemented. Deliberately absent rather than broken.**
   *
   * A listbox that cannot be dismissed with Escape strands a keyboard user inside it, so Escape is
   * unconditional here and there is no prop to turn it off. UI5 documents Escape as "Closes the
   * drop-down without changing the selection" with no opt-out, and that is the right contract.
   *
   * Escape restores the *highlight* rather than committing it, which is what makes it a dismissal
   * rather than a selection.
   */
  closeOnEscape?: never;

  /**
   * Closes when the user clicks outside.
   *
   * @default true
   */
  closeOnOutsidePress?: boolean | undefined;

  /**
   * Closes when an option is chosen.
   *
   * @default true
   */
  closeOnSelect?: boolean | undefined;

  /**
   * Selects the first option matching what the user types, without opening the list.
   *
   * On by default, because it is the *only* way to change the value from the keyboard without
   * opening the list. The APG listbox pattern makes arrows open the listbox, and this component
   * honours that, so without typeahead a keyboard user could never change a value without seeing
   * and dismissing a popup — which is precisely what a native `<select>` lets them avoid, and the
   * whole reason the `typeahead` behaviour exists in browsers at all.
   *
   * The division of labour is therefore deliberate and worth stating: **typing commits, browsing
   * does not.** Typeahead selects; arrows, `Home` and `End` open the list and move the highlight.
   *
   * @default true
   */
  typeahead?: boolean | undefined;

  /**
   * Milliseconds of inactivity that end a typeahead burst.
   *
   * UI5 does the same with `_typingTimeoutID`, defaulting to 1000ms. Short enough that two
   * separate words do not become one search, long enough that a deliberate two-letter search works.
   *
   * @default 1000
   */
  typeaheadDelay?: number | undefined;

  /**
   * Name submitted with the form.
   *
   * A hidden `<input>` carries it, because the trigger is a `<button>` and a button submits
   * nothing. Without this the value never reaches the server.
   */
  name?: string | undefined;

  /** Rendered inside the trigger, after the selected option's label. */
  startAdornment?: ReactNode | undefined;

  /** Rendered inside the trigger, after the value. */
  endAdornment?: ReactNode | undefined;

  /** Merged onto the component root, never onto the trigger. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the trigger `<button>`.
   *
   * Named `ref` because the trigger is the element a consumer focuses imperatively, and there is no
   * proxy element to disambiguate from.
   */
  ref?: Ref<HTMLButtonElement> | undefined;
}

/**
 * Native `HTMLAttributes` are forwarded to the **trigger button**, not to the root, so `name`,
 * `form`, `aria-*` and every `on*` handler behave as they do on a bare `<button>`.
 *
 * `onChange` is excluded because this component redefines it to report a *value* rather than an
 * event — see {@link SelectOwnProps.onChange}. Native change events on the trigger would be
 * meaningless, since a `<button>` fires none.
 */
export type SelectProps = SelectOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof SelectOwnProps | "children" | "className" | "style" | "type" | "value"
  >;
