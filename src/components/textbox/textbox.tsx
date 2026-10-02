/**
 * Textbox.
 *
 * A single-line or multi-line text field with a visible label, an announced
 * description, and a validation state.
 *
 * Renders a real `<input>` (or `<textarea>`) with no proxy element, so form
 * participation, native constraint validation, native focus order, native IME
 * composition and the browser's own autofill all apply without this component
 * reimplementing any of them. Every non-text concern is a wrapper the browser already
 * agrees with.
 */

import { forwardRef, useCallback, useEffect, type ChangeEvent } from "react";
import { composeHandlers, cx, useControllableState } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./textbox.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by
 * `scripts/bundle-css.mjs`. Importing it from JavaScript would make the package
 * non-tree-shakeable (`sideEffects: false` would be a lie) and would duplicate the
 * rules in every consumer bundle. A story relies on the assembled stylesheet instead.
 */

import type { TextboxElement, TextboxProps } from "./textbox.types";

/**
 * Whether a slot has anything to render.
 *
 * `0` and `""` count as renderable, because they render as `0` and as an empty label;
 * only `undefined`, `null` and `false` mean "not supplied". A truthiness check would
 * silently drop a label of `"0"`.
 */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * A single-line or multi-line text field.
 *
 * Structure, which is also the CSS contract:
 *
 * ```html
 * <div class="uir-textbox" data-size data-variant data-tone data-invalid>
 *   <label class="uir-textbox__label" for>…</label>
 *   <div class="uir-textbox__control">
 *     <span class="uir-textbox__adornment uir-textbox__adornment--start" aria-hidden="true">…</span>
 *     <input class="uir-textbox__input" />
 *     <span class="uir-textbox__adornment uir-textbox__adornment--end" aria-hidden="true">…</span>
 *   </div>
 *   <div class="uir-textbox__helper" id>…</div>
 * </div>
 * ```
 *
 * The wrapper exists so the border, the background and the adornment slots can surround
 * the text entry area. The focus ring is drawn by the `<input>` itself, offset inwards
 * so it lands inside the border rather than outside it; see `textbox.css`.
 */
export const Textbox = forwardRef<TextboxElement, TextboxProps>(function Textbox(props, ref) {
  const {
    id,
    label,
    helperText,
    invalid = false,
    size = "md",
    variant = "outline",
    tone = "neutral",
    disabled = false,
    readOnly = false,
    required = false,
    fullWidth = false,
    multiline = false,
    rows,
    startAdornment,
    endAdornment,
    value: valueProp,
    defaultValue,
    onValueChange,
    type = "text",
    className,
    style,
    onChange,
    ...rest
  } = props;

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  const hasLabel = isRenderable(label);
  const hasHelper = isRenderable(helperText);

  /*
   * The description is wired to the field, not merely rendered next to it.
   *
   * `helperText` exists to be announced. A visually present message that no
   * `aria-describedby` points at is the most common way a form field passes a visual
   * review and fails a screen-reader one.
   *
   * A consumer's own `aria-describedby` wins outright rather than being merged: the
   * alternative is guessing an order for two description lists authored independently,
   * and a wrong order is worse than one that is merely not ours.
   */
  const helperId = hasHelper && id !== undefined ? `${id}-helper` : undefined;
  const describedBy = rest["aria-describedby"] ?? helperId;

  /*
   * `aria-invalid` is derived from `invalid`, so a field cannot look invalid to a
   * sighted user while not being announced as invalid. A directly passed `aria-invalid`
   * still applies when `invalid` is false, because that is the consumer describing
   * server-side state this component cannot know about.
   */
  const ariaInvalid = invalid ? true : rest["aria-invalid"];

  /*
   * Both `label` and `helperText` need an `id` to do their job: the label's `for` and
   * the description's `aria-describedby` are both references by id. Without one the
   * markup renders correctly and announces nothing, which is the worst outcome,
   * because it is invisible in review.
   *
   * A development warning rather than a thrown error, following `ToggleButtonGroup`: a
   * consumer who associated the field by wrapping it in their own `<label>`, or with
   * `aria-label`, has satisfied a requirement this check cannot see.
   *
   * No id is generated. React's `useId` emits identifiers containing `:` (or `«»`,
   * depending on the major version), and either breaks `document.querySelector("#" + id)`
   * in whatever consumer code reads the field back. Requiring an explicit id keeps the
   * contract honest. This is a trade every comparable library makes.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || id !== undefined) return;

    if (hasLabel) {
      console.warn(
        "Textbox: `label` was passed without an `id`, so the visible label is not " +
          "programmatically associated with the field and a screen reader announces the " +
          "input with no name. Pass an `id` so the label's `for` matches it."
      );
    } else if (hasHelper) {
      console.warn(
        "Textbox: `helperText` was passed without an `id`, so it is rendered but never " +
          "announced. Pass an `id` so `aria-describedby` can point at it."
      );
    }
  }, [hasHelper, hasLabel, id]);

  const handleChange = (event: ChangeEvent<TextboxElement>): void => {
    setValue(event.target.value);
  };

  /*
   * A callback ref rather than a cast.
   *
   * `ref` is typed as the union of both elements a Textbox can render, which is honest
   * about what the component decides but is not assignable to either element's own
   * `ref` prop — and casting to a union does not help, because a `RefCallback` is
   * contravariant in its parameter, so a union of callbacks is still not a `RefCallback`
   * for either member.
   *
   * Going through one callback that accepts the union is the only formulation that
   * type-checks, and it also happens to be the correct one: React hands the callback
   * whichever element it rendered, and the component does not care which.
   */
  const elementRef = useCallback(
    (node: TextboxElement | null): void => {
      if (typeof ref === "function") ref(node);
      else if (ref !== null && ref !== undefined) {
        // `RefObject.current` is readonly in the type system; the cast is the standard
        // escape hatch and is safe because React owns this object. Matches
        // `composeRefs`'s own handling.
        (ref as { current: TextboxElement | null }).current = node;
      }
    },
    [ref]
  );

  /*
   * Everything the `<input>` and the `<textarea>` must agree on, declared once so the
   * two branches cannot drift. An inferred object type rather than
   * `Record<string, unknown>`, so the JSX spread stays type-checked.
   */
  const shared = {
    id,
    value,
    disabled,
    readOnly,
    required,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    onChange: composeHandlers(handleChange, onChange),
  };

  return (
    <div
      className={cx("uir-textbox", className)}
      style={style}
      data-size={size}
      data-variant={variant}
      data-tone={tone}
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-full-width={fullWidth ? "" : undefined}
      data-multiline={multiline ? "" : undefined}
    >
      {hasLabel ? (
        <label className="uir-textbox__label" htmlFor={id}>
          {label}
          {required ? (
            <>
              {/*
                The symbol is decorative and the word is the signal. A bare
                `*` from CSS (`InputLabel`'s `::after`), which tells a screen reader
                nothing; `docs/foundations.md` section 8 requires every state to carry
                text as well as colour.
              */}
              <span aria-hidden="true"> *</span>
              <span className="uir-visually-hidden">
                {` ${resolveMessage(undefined, BASE_MESSAGES, "common.required")}`}
              </span>
            </>
          ) : null}
        </label>
      ) : null}

      <div className="uir-textbox__control">
        {isRenderable(startAdornment) ? (
          <span className="uir-textbox__adornment uir-textbox__adornment--start" aria-hidden="true">
            {startAdornment}
          </span>
        ) : null}

        {/*
          `type` is dropped rather than forwarded in multiline mode: it is not a valid
          attribute on a `<textarea>`, and React would pass it through as one.
        */}
        {multiline ? (
          <textarea
            {...rest}
            {...shared}
            ref={elementRef}
            className="uir-textbox__input"
            rows={rows}
          />
        ) : (
          <input
            {...rest}
            {...shared}
            ref={elementRef}
            className="uir-textbox__input"
            type={type}
          />
        )}

        {isRenderable(endAdornment) ? (
          <span className="uir-textbox__adornment uir-textbox__adornment--end" aria-hidden="true">
            {endAdornment}
          </span>
        ) : null}
      </div>

      {hasHelper ? (
        <div className="uir-textbox__helper" id={helperId}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
});
