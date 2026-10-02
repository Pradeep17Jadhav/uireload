/**
 * Checkbox.
 *
 * A binary value that is part of a form the user submits later, as distinct from `Switch`, whose
 * change takes effect immediately.
 *
 * Renders a real `<input type="checkbox">` with the box and the tick drawn in CSS. Nothing is
 * reimplemented: form participation, the Space key, the tab order, `:disabled`, `:checked` and the
 * browser's own forced-colours handling are the platform's.
 */

import { forwardRef, useCallback, useEffect, useRef, type ChangeEvent } from "react";
import {
  composeHandlers,
  cx,
  useControllableState,
  useIsomorphicLayoutEffect,
} from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./checkbox.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`. Importing
 * it from JavaScript would make the package non-tree-shakeable and would duplicate the rules in
 * every consumer bundle.
 */

import type { CheckboxProps } from "./checkbox.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * A binary form value.
 *
 * Structure, which is also the CSS contract:
 *
 * ```html
 * <span class="uir-checkbox" data-size data-tone data-checked data-indeterminate data-disabled>
 *   <input class="uir-checkbox__input" type="checkbox" />
 *   <span class="uir-checkbox__box" aria-hidden="true"></span>
 *   <label class="uir-checkbox__label" for>…</label>
 * </span>
 * ```
 *
 * The box is `aria-hidden` because the input's own checkedness already states the value, and
 * announcing both would say the same thing twice.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const {
    id,
    label,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    indeterminate = false,
    disabled = false,
    required = false,
    tone = "neutral",
    size = "md",
    labelPosition = "end",
    value,
    name,
    helperText,
    className,
    style,
    onChange,
    ...rest
  } = props;

  /*
   * `readOnly` is destructured and dropped; see the long note on it in `checkbox.types.ts`.
   */

  const [checked, setChecked] = useControllableState<boolean>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  const hasLabel = isRenderable(label);
  const hasHelper = isRenderable(helperText);
  const labelledBy = rest["aria-label"] ?? rest["aria-labelledby"];
  const helperId = hasHelper && id !== undefined ? `${id}-helper` : undefined;
  const labelId = hasLabel && id !== undefined ? `${id}-label` : undefined;

  /*
   * `indeterminate` is a DOM **property**, not an attribute: there is no `indeterminate=""`
   * reflection, so it cannot be expressed in JSX and has to be set imperatively.
   *
   * Two pieces rather than one, deliberately:
   *
   * - A *stable* ref callback, so React does not detach and reattach the node on every render. An
   *   inline callback closes over `indeterminate` and therefore changes identity each render, which
   *   makes React null the ref and re-run it — churn on every keystroke in a form.
   * - A layout effect that syncs the property, so an `indeterminate` flipped from outside is
   *   applied before paint rather than after it.
   */
  const inputNode = useRef<HTMLInputElement | null>(null);
  const consumerRef = useRef<typeof ref>(ref);
  consumerRef.current = ref;

  const indeterminateRef = useRef(indeterminate);
  indeterminateRef.current = indeterminate;

  const attachInput = useCallback((node: HTMLInputElement | null): void => {
    inputNode.current = node;
    if (node !== null) node.indeterminate = indeterminateRef.current;

    const target = consumerRef.current;
    if (typeof target === "function") target(node);
    else if (target !== null && target !== undefined) {
      (target as { current: HTMLInputElement | null }).current = node;
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    // No-op when the node is gone, which is the point of the guard.
    if (inputNode.current !== null) inputNode.current.indeterminate = indeterminate;
  }, [indeterminate]);

  /*
   * A checkbox with no name is announced only as "checkbox, checked", which tells a user nothing
   * about what they are agreeing to. Warns in development, never throws, because a consumer who
   * labelled it by wrapping the control has satisfied a requirement this cannot see. Same rule as
   * `Switch` and `Textbox`.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (hasLabel || labelledBy !== undefined) return;

    console.warn(
      "Checkbox: no accessible name. Pass `label`, `aria-label` or `aria-labelledby`. " +
        "A checkbox with `aria-checked` says what the control is, but never what it is for, " +
        'so it is announced as "checkbox, checked" and nothing more.'
    );
  }, [hasLabel, labelledBy]);

  return (
    <span
      className={cx("uir-checkbox", className)}
      style={style}
      data-size={size}
      data-tone={tone}
      data-checked={checked && !indeterminate ? "" : undefined}
      data-indeterminate={indeterminate ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-required={required ? "" : undefined}
      data-label-position={labelPosition}
    >
      <input
        {...rest}
        ref={attachInput}
        id={id}
        type="checkbox"
        className="uir-checkbox__input"
        checked={checked}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        /*
         * `aria-checked="mixed"` is the only way to express indeterminate to assistive technology,
         * and it is emitted **only** when indeterminate. For the two ordinary states the native
         * checkedness already maps to `aria-checked`, and writing it by hand would mean two places
         * that can disagree.
         *
         * The ordering rule from `CheckBox.d.ts` is honoured by the markup above: checked and
         * indeterminate together paint as partially checked, and unchecked wins over
         * indeterminate.
         */
        aria-checked={indeterminate ? "mixed" : undefined}
        aria-labelledby={labelId ?? rest["aria-labelledby"]}
        aria-describedby={rest["aria-describedby"] ?? helperId}
        onChange={composeHandlers((event: ChangeEvent<HTMLInputElement>) => {
          setChecked(event.target.checked);
        }, onChange)}
      />

      {/*
        Drawn entirely in CSS — a bordered box with a rotated pseudo-element for the tick — so
        there is no icon to import, no request and nothing to theme. `aria-hidden` because the
        input carries the state.
      */}
      <span className="uir-checkbox__box" aria-hidden="true" />

      {hasLabel ? (
        <label className="uir-checkbox__label" id={labelId} htmlFor={id}>
          {label}
          {required ? (
            <>
              {/*
                The symbol is decorative and the word is the signal, exactly as on `Textbox` and
                `Switch`. A CSS-generated asterisk cannot be announced at all.
              */}
              <span aria-hidden="true"> *</span>
              <span className="uir-visually-hidden">
                {` ${resolveMessage(undefined, BASE_MESSAGES, "common.required")}`}
              </span>
            </>
          ) : null}
        </label>
      ) : null}

      {hasHelper ? (
        <span className="uir-checkbox__helper" id={helperId}>
          {helperText}
        </span>
      ) : null}
    </span>
  );
});
