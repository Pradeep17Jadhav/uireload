/**
 * Radio group.
 *
 * "Choose exactly one" from a small set. A `<fieldset>` of real `<input type="radio">`, with the
 * APG radio-group keyboard contract on top: one tab stop, and arrow keys that move focus *and*
 * selection.
 *
 * A real input per option rather than one input and a proxy, so `name`/`value` grouping, form
 * submission and `:checked` are the platform's — and so a form with no JavaScript still submits
 * the right value.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { composeHandlers, cx, useControllableState } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./radio-group.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { RadioGroupProps, RadioOption } from "./radio-group.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/** The values of every option that can be reached. */
function selectable(options: readonly RadioOption[]): string[] {
  return options.filter((option) => option.disabled !== true).map((option) => option.value);
}

/**
 * A single-choice group.
 *
 * ```html
 * <fieldset class="uir-radio-group" role="radiogroup" data-orientation data-size data-tone>
 *   <legend class="uir-radio-group__label" id>…</legend>
 *   <div class="uir-radio-group__options">
 *     <span class="uir-radio-group__option" data-checked data-disabled>
 *       <input class="uir-radio-group__input" type="radio" role="radio" />
 *       <span class="uir-radio-group__dot" aria-hidden="true"></span>
 *       <label class="uir-radio-group__option-label" for>…</label>
 *     </span>
 *   </div>
 *   <div class="uir-radio-group__helper" id>…</div>
 * </fieldset>
 * ```
 */
export function RadioGroup(props: RadioGroupProps) {
  const {
    id,
    label,
    options,
    value: valueProp,
    defaultValue,
    onValueChange,
    labelId,
    disabled = false,
    required = false,
    orientation = "vertical",
    size = "md",
    tone = "neutral",
    name,
    helperText,
    clearable = false,
    className,
    style,
    ref,
    onClick,
    onChange,
    ...rest
  } = props;

  /*
   * `onClick` and `onChange` are handled on the fieldset, not on each input, and the input they
   * came from is read off `event.target`.
   *
   * Two reasons, and the second is the important one:
   *
   * 1. A consumer writes one handler for the group, not one per option, so declaring them per
   *    option would give the option's handler types a parameter type a consumer has no reason to
   *    know about.
   * 2. Events bubble, so a handler on the fieldset sees every option's events anyway — but
   *    bubbling delivers them **after** the input's own handlers. The library-wide rule is
   *    consumer-first with `preventDefault()` as the opt-out, and that rule cannot be honoured by a
   *    handler that runs second. Handling it here is what makes `preventDefault()` actually veto
   *    the selection.
   */

  const [selected, setSelected] = useControllableState<string | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const reachable = useMemo(() => selectable(options), [options]);

  /*
   * Where the group's single tab stop sits.
   *
   * Derived, not stored: the selected option, or the first selectable one when nothing is
   * selected. Deriving is what makes "Tab enters the group once, at the current answer" true by
   * construction rather than by a synchronisation effect that can drift.
   */
  const selectedIndex = options.findIndex((option) => option.value === selected);
  const tabStop =
    selectedIndex !== -1 ? selectedIndex : options.findIndex((o) => o.disabled !== true);

  const select = useCallback(
    (value: string | null) => {
      /*
       * A radio cannot be unchecked by pressing it. That is APG radio-group behaviour and the
       * reason single selection uses radios rather than pressed buttons — so `clearable` is opt-in
       * rather than the default, because making it the default would let a keyboard user empty a
       * required field by pressing the answer they already chose.
       */
      if (value === selected && !clearable) return;
      setSelected(value);
    },
    [clearable, selected, setSelected]
  );

  const focusOption = useCallback((value: string): void => {
    const node = containerRef.current?.querySelector<HTMLInputElement>(
      `input[data-uir-value="${CSS.escape(value)}"]`
    );
    node?.focus({ preventScroll: true });
  }, []);

  /**
   * Move the selection one step, wrapping.
   *
   * Wrapping is correct here and only here: a radio group is a closed cycle, so stepping past the
   * last option has to arrive somewhere. `Home` and `End` are the non-wrapping escape hatch, and
   * both are implemented below.
   */
  const step = useCallback(
    (delta: number): void => {
      if (reachable.length === 0) return;

      /*
       * Arrows move *from where focus already is*, not from the selection.
       *
       * Those are the same thing once something is selected — and they are not the same thing
       * before it: with nothing selected, focus sits on the tab stop (the first selectable option)
       * while the selection is nowhere. Stepping from the selection would then compute
       * `(-1 + 1) % 3 === 0` and re-select the option the user is already standing on, so the
       * first ArrowDown would appear to do nothing. Anchoring to the tab stop makes the first
       * press move exactly one option, which is what the key was pressed for.
       */
      const anchor = selectedIndex !== -1 ? selected : options[tabStop]?.value;
      const at = reachable.indexOf(anchor as string);
      const next = reachable[(Math.max(at, 0) + delta + reachable.length) % reachable.length];
      if (next === undefined) return;

      setSelected(next);
      focusOption(next);
    },
    [focusOption, options, reachable, selected, selectedIndex, setSelected, tabStop]
  );

  const goTo = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setSelected(value);
      focusOption(value);
    },
    [focusOption, setSelected]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled || reachable.length === 0) return;

    /*
     * Both arrow axes are accepted regardless of `orientation`.
     *
     * A vertical group that ignored Left/Right would be right on a desktop and wrong for anyone
     * arrowing through a list; the cost of accepting both is that a horizontal group also answers
     * Up/Down, which moves between rows in a settings list and is what they meant anyway. So
     * `orientation` chooses the axis the API *advertises* and the layout, not a set of keys the
     * component refuses.
     */
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        step(1);
        return;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        step(-1);
        return;
      case "Home":
        event.preventDefault();
        goTo(reachable[0]);
        return;
      case "End":
        event.preventDefault();
        goTo(reachable[reachable.length - 1]);
        return;
      default:
    }
  };

  const hasLabel = isRenderable(label);
  const hasHelper = isRenderable(helperText);
  const legendId = hasLabel && id !== undefined ? `${id}-label` : undefined;
  const helperId = hasHelper && id !== undefined ? `${id}-helper` : undefined;

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (hasLabel || labelId !== undefined || rest["aria-label"] !== undefined) return;

    console.warn(
      "RadioGroup: no accessible name. Pass `label` (rendered as a visible legend), `labelId`, " +
        '`aria-label` or `aria-labelledby`. A `role="radiogroup"` with no name is announced as ' +
        '"radio group" with no indication of what the choices are for.'
    );
  }, [hasLabel, labelId, rest]);

  /*
   * `name` defaults from `id` so that two groups on one page are two groups, with no call site
   * having to remember a unique `name`. The platform needs a shared `name` for its own radio
   * grouping; ours is built on it rather than re-implemented.
   */
  const groupName = name ?? (id === undefined ? undefined : `uir-radio-${id}`);

  /** The option an event came from, if it came from one at all. */
  const optionFrom = (event: React.SyntheticEvent<HTMLFieldSetElement>): string | null =>
    event.target instanceof HTMLInputElement ? event.target.value : null;

  const handleClick = composeHandlers<React.MouseEvent<HTMLFieldSetElement>>((event) => {
    /*
     * `click`, not `change`, carries the clear.
     *
     * A radio that is already checked fires **no** `change` event when clicked — the platform
     * treats "activate the thing that is on" as a no-op — so `onChange` alone could never empty a
     * group and `clearable` would be a prop that silently does nothing. `click` is the only event
     * that fires in both directions.
     *
     * Guarded on `checked`, because an unchecked option's click reaches here too and reporting
     * `null` for it would be wrong.
     */
    const value = optionFrom(event);
    if (value === null) return;

    if (clearable && (event.target as HTMLInputElement).checked) select(null);
  }, onClick);

  const handleChange = composeHandlers<React.ChangeEvent<HTMLFieldSetElement>>((event) => {
    const value = optionFrom(event);
    if (value === null) return;
    select(value);
  }, onChange);

  return (
    <fieldset
      {...rest}
      ref={ref}
      id={id}
      onClick={handleClick}
      onChange={handleChange}
      className={cx("uir-radio-group", className)}
      style={style}
      /*
       * A fieldset, not a div with `role="radiogroup"`.
       *
       * The fieldset supplies the form semantics and the legend a div cannot, and it already has
       * the implicit `group` role — so `role="radiogroup"` is stated explicitly for the
       * announcement and for the arrow-key expectation the role implies.
       */
      role="radiogroup"
      aria-labelledby={legendId ?? labelId ?? rest["aria-labelledby"]}
      aria-describedby={rest["aria-describedby"] ?? helperId}
      aria-orientation={orientation}
      aria-required={required || undefined}
      data-orientation={orientation}
      data-size={size}
      data-tone={tone}
      data-disabled={disabled ? "" : undefined}
      data-required={required ? "" : undefined}
    >
      {hasLabel ? (
        <legend className="uir-radio-group__label" id={legendId}>
          {label}
          {required ? (
            <>
              {/* The symbol is decorative and the word is the signal, as on `Textbox`. */}
              <span aria-hidden="true"> *</span>
              <span className="uir-visually-hidden">
                {` ${resolveMessage(undefined, BASE_MESSAGES, "common.required")}`}
              </span>
            </>
          ) : null}
        </legend>
      ) : null}

      <div className="uir-radio-group__options" ref={containerRef} onKeyDown={onKeyDown}>
        {options.map((option, index) => (
          <Option
            key={option.value}
            option={option}
            id={id === undefined ? undefined : `${id}-${CSS.escape(option.value)}`}
            groupName={groupName}
            checked={option.value === selected}
            disabled={disabled || option.disabled === true}
            required={required}
            isTabStop={index === tabStop}
          />
        ))}
      </div>

      {hasHelper ? (
        <div className="uir-radio-group__helper" id={helperId}>
          {helperText}
        </div>
      ) : null}
    </fieldset>
  );
}

interface OptionProps {
  option: RadioOption;
  id: string | undefined;
  groupName: string | undefined;
  checked: boolean;
  disabled: boolean;
  required: boolean;
  isTabStop: boolean;
}

/**
 * One option.
 *
 * A real `<input type="radio">`. The native element already has the `radio` role, so stating it is
 * redundant for correctness — but the roving tabindex below has to put `tabIndex="0"` on one
 * *specific* input, and an explicit role makes that the contract rather than an implication.
 */
function Option({ option, id, groupName, checked, disabled, required, isTabStop }: OptionProps) {
  const name = option.textValue ?? (typeof option.label === "string" ? option.label : undefined);

  return (
    <span
      className="uir-radio-group__option"
      data-checked={checked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      <input
        /*
         * `data-uir-value` rather than a generated per-option id: the group's arrow-key handler
         * has to find an input by value, and a value can contain characters that are awkward in an
         * id and in an attribute selector. This is the `data-uir-*` namespace doing its job.
         */
        data-uir-value={option.value}
        id={id}
        type="radio"
        role="radio"
        className="uir-radio-group__input"
        name={groupName}
        value={option.value}
        checked={checked}
        disabled={disabled}
        required={required}
        aria-checked={checked}
        aria-label={name}
        /*
         * The roving tabindex: exactly one option is tabbable, so Tab enters the group once and
         * leaves on the next. Tab is not trapped — the arrows move within the group, which is what
         * the APG radio-group pattern specifies.
         */
        tabIndex={isTabStop && !disabled ? 0 : -1}
      />

      <span className="uir-radio-group__dot" aria-hidden="true" />

      <label className="uir-radio-group__option-label" htmlFor={id}>
        {option.label}
        {isRenderable(option.children) ? (
          <span className="uir-radio-group__option-detail">{option.children}</span>
        ) : null}
      </label>
    </span>
  );
}
