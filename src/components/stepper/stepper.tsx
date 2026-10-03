/**
 * Stepper.
 *
 * A progress strip for a sequence, plus optionally the step's content beneath it.
 *
 * The component is linear by default, and that default is about which steps exist as **buttons**
 * rather than about how they look. A linear stepper makes the steps behind the current one buttons —
 * going back is allowed, because a wizard you cannot return to in order to fix the address you typed
 * two steps ago is a wizard people abandon — and leaves the steps ahead as plain text, because
 * arriving there is the wizard's decision rather than the user's.
 *
 * So the strip's tab stops are exactly the steps a user can move to. The current step's own header is
 * always a `<div>`, because activating it would report a move that did not happen — and that is the
 * case worth writing down, since it is where an implementation that puts `aria-current` on the button
 * silently loses the only thing the component communicates.
 */

import { forwardRef, useId } from "react";
import { composeHandlers, cx } from "../../internal";
import { formatMessage, resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./stepper.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { StepperProps, StepperStep } from "./stepper.types";

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(props, ref) {
  const {
    steps,
    active = 0,
    onStepChange,
    navigation = "linear",
    orientation = "horizontal",
    labelPlacement: labelPlacementProp,
    showContent = false,
    children,
    announcePosition = true,
    stepLabel,
    label,
    disabled = false,
    className,
    style,
    ...rest
  } = props;

  const noun = stepLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.step");

  /*
   * Where the label goes, resolved per orientation when the consumer does not say.
   *
   * Horizontal: above the marker. It is the only horizontal placement that can carry a continuous
   * connector — with the label beside its marker, the label sits *between* two markers and any line
   * joining them crosses the text. So the default is the placement that draws a proper sequence.
   *
   * Vertical: beside the marker, which is the convention there and costs nothing, because in a
   * vertical strip the label is on the cross axis and the connector runs down the marker's inline
   * centre without meeting it.
   *
   * The same resolution `TabBar` uses for `activation`: a boolean-ish prop that flips meaning with the
   * orientation is worse than one that resolves to the right thing.
   */
  const labelPlacement =
    labelPlacementProp ?? (orientation === "vertical" ? "inline-end" : "block-start");

  /*
   * Per-instance, so two steppers on one page cannot collide on an error description's id — and a
   * collided id points `aria-describedby` at the other stepper's error, which announces the wrong
   * step's failure.
   */
  const baseId = useId();

  /*
   * `active` is clamped rather than trusted.
   *
   * It is a number a consumer passes, and a consumer whose step list shrank under a stale index would
   * otherwise render a strip where nothing is current and every header sits ahead of the user.
   */
  const last = Math.max(0, steps.length - 1);
  const current = Math.min(Math.max(0, active), last);
  const linear = navigation === "linear";

  /*
   * Whether a step's header can be activated.
   *
   * Linear: the steps behind the current one, and nothing ahead of it — going back is allowed, and
   * jumping ahead is not. Non-linear: everything reachable, because the whole point of non-linear is
   * that the user chooses.
   *
   * Either way the current step is excluded: it is not a destination.
   */
  const canEnter = (index: number): boolean => {
    if (disabled) return false;
    if (steps[index]?.disabled === true) return false;
    // The current step is not a destination; activating it would report a move that did not happen.
    if (index === current) return false;
    return linear ? index < current : true;
  };

  const go = (index: number): void => {
    if (!canEnter(index)) return;
    onStepChange?.(index);
  };

  /**
   * The marker.
   *
   * A tick, a number or an error mark depending on the state, and entirely `aria-hidden` — the
   * step's own text and the status region carry the meaning. A screen reader describing "a circle
   * with a tick in it" has told the user nothing about where they are in a wizard.
   */
  const marker = (index: number, state: string): React.ReactNode => (
    <span className="uir-stepper__marker" data-state={state} aria-hidden="true">
      {state === "completed" ? (
        /* Two borders rotated, so the tick is `currentcolor` and needs nothing in forced colours. */
        <span className="uir-stepper__tick" />
      ) : (
        <span className="uir-stepper__number">{index + 1}</span>
      )}
    </span>
  );

  const body = (item: StepperStep, index: number, state: string): React.ReactNode => (
    <>
      {marker(index, state)}
      <span className="uir-stepper__text">
        <span className="uir-stepper__label">{item.label}</span>
        {item.description === undefined ? null : (
          <span className="uir-stepper__description">{item.description}</span>
        )}
        {item.optional === true ? (
          /* `aria-hidden` because "optional" is a claim about the *rule*, not about this step; it is
             already in the header's accessible name. */
          <span className="uir-stepper__optional" aria-hidden="true" />
        ) : null}
      </span>
    </>
  );

  /** The state, shared by both element shapes so a step looks and reads the same either way. */
  const stateOf = (index: number): string =>
    index < current ? "completed" : index === current ? "current" : "upcoming";

  const renderStep = (item: StepperStep, index: number): React.ReactNode => {
    const state = stateOf(index);
    const errorId = `${baseId}-error-${index}`;

    /*
     * `aria-current="step"` on the current step only, and it goes on whichever element the step is.
     *
     * Not `aria-selected`, not `aria-pressed`: a stepper is a position indicator, and the same
     * reasoning as `Pagination`'s current page — a claim about where the user is, not about the state
     * of a control they pressed. Putting it on the button alone would mean it vanishes in `linear`
     * mode, which is the default and the case with no buttons at all.
     */
    const current_ = index === current ? "step" : undefined;

    /*
     * The step's accessible name.
     *
     * From its own visible label rather than from `aria-current`, because the label is what the user
     * is reading. A `ReactNode` has no string form and `String(node)` is `"[object Object]"` — a
     * worse name than none — so the node falls back to the number alone.
     */
    const name =
      typeof item.label === "string"
        ? `${noun} ${index + 1}: ${item.label}`
        : `${noun} ${index + 1}`;

    const shared = {
      "data-state": state,
      "data-optional": item.optional === true ? "" : undefined,
      "data-tone": item.tone ?? "neutral",
      "data-actionable": canEnter(index) ? "" : undefined,
    };

    /*
     * A `<div>` when the step cannot be entered.
     *
     * Not a disabled button: a disabled control is still announced as "unavailable", which claims
     * the step *cannot* be entered — true — while also telling the user it is a control, which is
     * false. A `<div>` says neither, and `Tab` skips it. This is what keeps the strip's tab stops
     * exactly equal to the steps a user can actually move to.
     */
    if (!canEnter(index)) {
      return (
        <div
          className="uir-stepper__step"
          {...shared}
          aria-current={current_}
          key={item.id ?? index}
        >
          {body(item, index, state)}
          {item.errorText === undefined ? null : (
            <span className="uir-stepper__error" id={errorId}>
              {item.errorText}
            </span>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id ?? index}
        type="button"
        className="uir-stepper__step uir-stepper__step--actionable"
        {...shared}
        aria-current={current_}
        aria-label={name}
        /*
         * `aria-describedby` for the error text, when there is one.
         *
         * A step in an error state that a screen reader cannot hear about is an error a screen reader
         * user cannot fix, which is the one failure a wizard cannot afford.
         */
        aria-describedby={item.errorText === undefined ? undefined : errorId}
        onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(() => go(index), undefined)}
      >
        {body(item, index, state)}
        {item.errorText === undefined ? null : (
          <span className="uir-stepper__error" id={errorId}>
            {item.errorText}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-stepper", className)}
      style={style}
      aria-label={label}
      data-orientation={orientation}
      data-navigation={navigation}
      data-label-placement={labelPlacement}
      data-disabled={disabled ? "" : undefined}
      data-has-content={showContent ? "" : undefined}
    >
      {/*
        The strip.

        An `<ol>`: the steps are an ordered sequence, and a screen reader announcing "list, 4 items"
        before each one is information — it is the difference between "step 2 of 4" read as an
        isolated fragment and read as the second of four things.
       */}
      <ol className="uir-stepper__strip">
        {steps.map((item, index) => (
          <li className="uir-stepper__item" key={item.id ?? index}>
            {renderStep(item, index)}
          </li>
        ))}
      </ol>

      {showContent ? <div className="uir-stepper__content">{children}</div> : null}

      {/*
        The status region.

        Always present when enabled, never conditionally mounted — a live region that appears with
        its content is the same failure `Snackbar` documents: assistive technology observes changes
        inside a region it already knows about, and an element that did not exist a moment ago has
        nothing to observe.
       */}
      {announcePosition ? (
        <span className="uir-stepper__status" role="status" aria-live="polite">
          {/*
            Composed through `formatMessage`, not concatenated: "Step 2 of 4" in English is not
            "Schritt 2 von 4" in German, and the word order is the translator's to choose.
           */}
          {formatMessage(
            `${noun} {current} ${resolveMessage(undefined, BASE_MESSAGES, "common.of")}`,
            { current: current + 1, total: steps.length }
          )}
        </span>
      ) : null}
    </div>
  );
});
