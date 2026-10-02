/**
 * Switch.
 *
 * A control for a binary setting that takes effect immediately, as distinct from a
 * checkbox, which is part of a form the user submits later.
 *
 * Renders a real `<input type="checkbox" role="switch">` with the track and handle as
 * presentational siblings. Nothing is reimplemented: form participation, the Space key,
 * the tab order, `:disabled` and the browser's own forced-colours handling are the
 * platform's.
 */

import { forwardRef, useEffect, type ChangeEvent } from "react";
import { composeHandlers, cx, useControllableState } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./switch.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by
 * `scripts/bundle-css.mjs`. Importing it from JavaScript would make the package
 * non-tree-shakeable and would duplicate the rules in every consumer bundle.
 */

import type { SwitchProps } from "./switch.types";

/**
 * Whether a slot has anything to render. `0` and `""` count as renderable; only
 * `undefined`, `null` and `false` mean "not supplied".
 */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * A binary setting.
 *
 * Structure, which is also the CSS contract:
 *
 * ```html
 * <span class="uir-switch" data-size data-tone data-checked data-label-position>
 *   <input class="uir-switch__input" type="checkbox" role="switch" />
 *   <span class="uir-switch__track" aria-hidden="true">
 *     <span class="uir-switch__handle"></span>
 *   </span>
 *   <label class="uir-switch__label" for>…</label>
 * </span>
 * ```
 *
 * The track is `aria-hidden` because `aria-checked` on the input already states the
 * position, and announcing both would say the same thing twice.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, ref) {
  const {
    id,
    label,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    disabled = false,
    required = false,
    size = "md",
    tone = "neutral",
    labelPosition = "end",
    className,
    style,
    onChange,
    ...rest
  } = props;

  /*
   * `readOnly` is destructured and dropped.
   *
   * It is a genuine gap rather than an oversight, and the reason is a real blocker rather than an
   * oversight of effort. `readonly` has no effect on a checkbox in the HTML spec, so implementing it
   * means *refusing* a toggle the browser has already performed. Three approaches were implemented
   * and measured, and all three end with the switch visually checked while announcing
   * `aria-checked="false"`:
   *
   * 1. `event.target.checked = checked` in the change handler. React snapshots a controlled
   *    checkbox's value when it dispatches `change` and restores that snapshot at the end of the
   *    event. In React 19 that restore runs from a scheduled callback, so it lands after the handler,
   *    after effects, and after any synchronous correction.
   * 2. The same write from a `useEffect`. Measured `false` inside the effect and `true` one
   *    microtask later.
   * 3. An uncontrolled input with `preventDefault()`, so React has no snapshot. The write then has
   *    to race the platform's activation behaviour, and whether the veto landed proved to depend on
   *    details outside this component's control.
   *
   * A fourth approach — recreating the input node with a `key` — does work, but it hands the
   * consumer a different DOM node on every refused toggle, which breaks node identity for their own
   * refs and measurement. A broken read-only state is worse than an absent one, so the prop is
   * absent. Recorded here and in `README.md`; revisit if React's controlled-input behaviour changes.
   */

  const [checked, setChecked] = useControllableState<boolean>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  const hasLabel = isRenderable(label);
  const labelledBy = rest["aria-label"] ?? rest["aria-labelledby"];

  /*
   * The consumer's handler runs first, then the state follows the toggle.
   *
   * `preventDefault()` here deliberately does *not* veto the switch, and the README explains why
   * at length: under React's controlled-input machinery a veto cannot hold, because the value has
   * already been snapshotted and will be restored whatever this handler does. Honouring it would
   * leave the switch looking one way and announcing `aria-checked="false"`, which is worse than not
   * offering it. A consumer who needs to refuse a change controls `checked` and declines by not
   * updating it — the standard React contract, and the only one that holds.
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChecked(event.target.checked);
  };

  /*
   * A switch with no name is announced only as "switch, on", which tells a user nothing
   * about what they are turning on. Warns in development, never throws, because a consumer
   * who labelled it by wrapping the control has satisfied a requirement this cannot see.
   * Same rule as `ToggleButtonGroup` and `Textbox`.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (hasLabel || labelledBy !== undefined) return;

    console.warn(
      "Switch: no accessible name. Pass `label`, `aria-label` or `aria-labelledby`. " +
        'A `role="switch"` with `aria-checked` says what the control is, but never what it ' +
        'is for, so it is announced as "switch, on" and nothing more.'
    );
  }, [hasLabel, labelledBy]);

  return (
    <span
      className={cx("uir-switch", className)}
      style={style}
      data-size={size}
      data-tone={tone}
      data-checked={checked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-required={required ? "" : undefined}
      data-label-position={labelPosition}
    >
      {/*
        `type="checkbox"` with `role="switch"` rather than a `<div role="switch">` plus a
        separate hidden checkbox. A real input gives native form participation, the Space key, the
        tab order and `:checked` for free, and it means there is exactly one focusable element
        rather than two that have to be kept in agreement.
      */}
      <input
        {...rest}
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        className="uir-switch__input"
        checked={checked}
        disabled={disabled}
        required={required}
        aria-checked={checked}
        onChange={composeHandlers(handleChange, onChange)}
      />

      <span className="uir-switch__track" aria-hidden="true">
        <span className="uir-switch__handle" />
      </span>

      {hasLabel ? (
        <label className="uir-switch__label" htmlFor={id}>
          {label}
          {required ? (
            <>
              {/*
                The symbol is decorative and the word is the signal, exactly as on
                `Textbox`. A CSS-generated asterisk cannot be announced at all.
              */}
              <span aria-hidden="true"> *</span>
              <span className="uir-visually-hidden">
                {` ${resolveMessage(undefined, BASE_MESSAGES, "common.required")}`}
              </span>
            </>
          ) : null}
        </label>
      ) : null}
    </span>
  );
});
