/**
 * Slider.
 *
 * A native `<input type="range">` per thumb, with the parts drawn in CSS around it.
 *
 * Two thumbs get two real range inputs rather than one proxy element with `aria-valuenow` swapped by
 * hand. That means the pointer maths, the step snapping, the keyboard, the form submission and the
 * screen reader value are all the platform's — and the two thumbs cannot disagree with each other
 * or with their own `aria-valuenow`. What has to be added on top is only what a native range input
 * cannot do: a visible track and thumbs, a two-thumb interaction that keeps the thumbs ordered,
 * and marks.
 */

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import {
  composeHandlers,
  composeRefs,
  cx,
  fractionFromPointer,
  nearestThumbIndex,
  useControllableState,
} from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./slider.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { SliderProps } from "./slider.types";

/** Where a thumb currently sits, as a fraction of the track. */
interface Fraction {
  value: number;
  at: number;
}

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * Clamp to the range and snap to the step grid.
 *
 * Two roundings, and the order matters. Clamping first stops a snap from pushing a value back
 * outside the range — `max` is not always a multiple of `step`, so snapping after clamping would let
 * `step={7}` on a `0..10` range produce 14, which is outside the slider.
 */
function snap(value: number, min: number, max: number, step: number | null): number {
  const clamped = Math.min(Math.max(value, min), max);

  /*
   * The two bounds are always reachable, snapped or not.
   *
   * `max` need not be a whole number of steps from `min` — `step={7}` on a `0..10` range is legal —
   * so snapping `10` gives `7`, and `Home` / `End` would stop one step short of the end of the rail.
   * A bound the user can reach by pressing `End` cannot also be a value the control refuses to take.
   */
  if (clamped === min || clamped === max) return clamped;

  if (step === null) {
    /*
     * Continuous, but rounded to two decimals anyway.
     *
     * `0.1 + 0.2` is not `0.3`, and a continuous slider that reports `0.30000000000000004` to
     * `aria-valuenow` and to `onValueChange` is reporting floating-point noise as if it were data.
     */
    return Math.round(clamped * 100) / 100;
  }

  const steps = Math.round((clamped - min) / step);
  /* The second clamp covers `max` not being a whole number of steps from `min`. */
  return Math.min(Math.max(min + steps * step, min), max);
}

/**
 * Put the values in a legal shape.
 *
 * Clamps to the range, snaps to the step grid, and sorts low-to-high.
 */
function normalize(
  values: readonly number[],
  min: number,
  max: number,
  step: number | null
): number[] {
  /*
   * Clamped, snapped, and sorted low-to-high — because a sorted array is what lets `move` treat a
   * thumb's neighbours as a floor and a ceiling, and an unsorted one would make those bounds cross.
   *
   * Duplicates are **kept**. Two thumbs meeting at one value is a collapsed range: the user can drag
   * them together, and they must then be able to drag apart again. Dropping a thumb would make the
   * control change shape mid-gesture, and would leave an uncontrolled slider permanently stuck at
   * one thumb.
   */
  return values.map((value) => snap(value, min, max, step)).sort((a, b) => a - b);
}

/** A value as a fraction of the range, guarding a zero-width range. */
function fraction(value: number, min: number, max: number): number {
  const span = max - min;
  return span === 0 ? 0 : (value - min) / span;
}

export function Slider(props: SliderProps) {
  const {
    id,
    label,
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    marks,
    showLabels = true,
    getAriaValueText,
    valueLabelDisplay = "off",
    orientation = "horizontal",
    track: trackProp = "normal",
    disabled = false,
    tone = "neutral",
    size = "md",
    snapToStep = true,
    hideValueText = false,
    name,
    helperText,
    className,
    style,
    ref,
    onChange,
    onKeyDown: onKeyDownProp,
    ...rest
  } = props;

  const generatedId = useId();

  /*
   * `step === 0` falls back to 1.
   *
   * A zero step is a slider whose thumb cannot move, and `snap` would divide by it. It is reported
   * in development below and then treated as the default rather than throwing: a broken `step` is a
   * value mistake, not a reason to take the page down.
   */
  const effectiveStep = step === 0 ? 1 : step;

  const initial = useMemo(
    () => normalize(defaultValue ?? [min], min, max, effectiveStep),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only by design, like every default* prop
    []
  );

  const [raw, setRaw] = useControllableState<number[]>({
    value: valueProp === undefined ? undefined : normalize(valueProp, min, max, effectiveStep),
    defaultValue: initial,
    onChange: onValueChange,
  });

  const values = useMemo(
    () => normalize(raw, min, max, effectiveStep),
    [raw, min, max, effectiveStep]
  );

  /*
   * The thumb count comes from the normalised value, and nowhere else.
   *
   * A separate `thumbs` prop would be a second source of truth for one fact that could disagree with
   * the array, and every consumer would have to keep the two in step. Deriving it means a range
   * slider is a single-thumb slider with two values, which is also how the platform treats it.
   *
   * `Math.max(1, ...)` rather than trusting the array: an empty `value={[]}` is a mistake, and a
   * slider with no thumb has no value to report and no element to focus. One thumb at `min` is the
   * recoverable reading.
   */
  const thumbCount = Math.max(1, values.length);

  /* ---- Derived geometry ---------------------------------------------- */

  const rootRef = useRef<HTMLDivElement>(null);

  const thumbs = useMemo<Fraction[]>(
    () => values.map((value) => ({ value, at: fraction(value, min, max) })),
    [values, min, max]
  );

  /**
   * `inverted` only means something with two thumbs.
   *
   * A single thumb has no centre to be symmetrical about, so an inverted track would be a bar filled
   * from the middle to the thumb — which reads as "half the range" for a value that is not half.
   * Falling back to `normal` is right and `readme` records why.
   */
  const bipolar = trackProp === "inverted" && thumbCount > 1;
  /*
   * `data-track` reports what was asked for, not what was drawn.
   *
   * A consumer styling by `[data-track="inverted"]` needs to know what they set. Overwriting it with
   * `normal` for a single thumb would make the attribute lie about the prop it came from.
   */
  const midpoint = bipolar ? 0.5 : fraction(thumbs[0]?.value ?? min, min, max);
  const far = bipolar
    ? Math.max(...thumbs.map((thumb) => thumb.at), 0.5)
    : Math.max(...thumbs.map((thumb) => thumb.at), 0);

  const start = bipolar ? Math.min(midpoint, far) : 0;

  /* ---- Change plumbing ----------------------------------------------- */

  /**
   * The value before the current interaction began.
   *
   * `Escape` restores it, which is the documented slider behaviour and the only way out of a
   * half-finished drag that left the value somewhere the user did not want. Held in a ref rather
   * than state because nothing renders from it.
   */
  const beforeInteraction = useRef<number[]>(values);

  /**
   * Whether a pointer button is currently held down on the component.
   *
   * This is what separates a change in transit from a settled one. The platform fires `change`
   * identically for a drag and for an arrow press, so the event alone cannot tell them apart — but
   * a drag necessarily has a button down and an arrow press necessarily does not.
   *
   * A keyboard-only reading would have been to remember "a key was pressed" and let the next
   * `change` inherit it. That depends on the keydown handler running before the change handler,
   * which is not guaranteed: a listener running in the capture phase can change the value and fire
   * `change` before the event ever reaches the component. The button state has no such ordering
   * requirement.
   *
   * Without this, a keyboard user moves the thumb and `onValueCommit` never fires — so a form
   * submitted on blur has no committed value to read.
   */
  /**
   * Which thumb a pointer gesture owns, or `null` when none is in progress.
   *
   * An index rather than a boolean, because a two-thumb slider has to remember *which* one the
   * gesture claimed — a boolean can only say that something is moving.
   */
  const dragIndex = useRef<number | null>(null);

  /** The rail, which is the box the pointer maths is measured against. */
  const railRef = useRef<HTMLDivElement>(null);

  /** The real inputs, so a gesture can focus the thumb it owns. */
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emit = useCallback(
    (next: number[], phase: "change" | "commit") => {
      setRaw(next);
      if (phase === "commit") onValueCommit?.(next);
    },
    [onValueCommit, setRaw]
  );

  /**
   * Move one thumb, keeping the array ordered and the thumbs apart.
   *
   * A thumb cannot pass its neighbour: two thumbs on one step is a state the interaction cannot
   * produce, and the platform's two independent range inputs would happily allow it. Clamping
   * against the neighbour is what makes the pair behave as a range rather than as two unrelated
   * sliders that happen to be drawn together.
   */
  const move = useCallback(
    (index: number, next: number, phase: "change" | "commit") => {
      if (disabled) return;

      /*
       * Snap to the step grid unless `snapToStep` is off, in which case only the two-decimal
       * rounding in `snap` applies. `step={null}` already routes to the same place, so
       * `snapToStep={false}` is the version of "continuous" that keeps a nominal step around for
       * `PageUp` and for the input's own `step` attribute.
       */
      const grid = effectiveStep === null ? null : snapToStep ? effectiveStep : null;
      const target = snap(next, min, max, grid);

      /*
       * The neighbour clamp, as one interval rather than two comparisons applied in sequence.
       *
       * The low neighbour is the floor and the high neighbour the ceiling, with the range's own
       * `min`/`max` at the ends. This is what makes a pair behave as a range: two independent range
       * inputs will happily cross, and a slider whose thumbs have swapped is a slider reporting a
       * minimum above its maximum.
       */
      const floor = index > 0 ? (values[index - 1] as number) : min;
      const ceiling = index < values.length - 1 ? (values[index + 1] as number) : max;

      const ordered = [...values];
      ordered[index] = Math.min(Math.max(target, floor), ceiling);

      emit(ordered, phase);
    },
    [disabled, effectiveStep, emit, max, min, snapToStep, values]
  );

  /** A drag or key sequence has begun. */
  const beginInteraction = useCallback(() => {
    beforeInteraction.current = values;
  }, [values]);

  const handleKeyDown = composeHandlers<React.KeyboardEvent<HTMLDivElement>>((event) => {
    if (disabled) return;

    /*
     * `Home` / `End` act on the *focused* thumb, which is not necessarily the last one the user
     * touched — a keyboard user can move the low thumb, then reach for `End` on the high thumb.
     * Reading the thumb from the event target is what makes the key mean "this one".
     */
    const index = thumbIndexFrom(event.target);
    if (index === -1) return;
    const current = values[index] as number;

    const span = max - min;

    /*
     * Only the keys a native range input does not already handle.
     *
     * `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` / `Home` / `End` are the platform's, and
     * it fires `change` for each — so handling them here as well would move the thumb twice per
     * press and land on a value neither the step nor the user asked for. Every rule in this
     * component that could be the platform's, is.
     *
     * What is left is what the platform genuinely lacks: `PageUp` / `PageDown`, `Escape`, and
     * `+` / `-`.
     */
    switch (event.key) {
      case "PageUp":
        event.preventDefault();
        move(index, current + span / 10, "commit");
        return;
      case "PageDown":
        event.preventDefault();
        move(index, current - span / 10, "commit");
        return;
      case "+":
        event.preventDefault();
        move(index, current + (effectiveStep ?? span / 100), "commit");
        return;
      case "-":
        event.preventDefault();
        move(index, current - (effectiveStep ?? span / 100), "commit");
        return;
      case "Escape":
        /*
         * Restore the value from before the interaction began.
         *
         * Not a cancel of the whole component — just of the drag or key sequence in progress. It is
         * the only way back from a value the user passed through and did not mean to keep.
         */
        event.preventDefault();
        emit(beforeInteraction.current, "commit");
        return;
      default:
    }
  }, onKeyDownProp);

  /* ---- Pointer on the rail ------------------------------------------- */

  /**
   * The value under the pointer, from the rail's own box.
   *
   * The **rail**, not the root. The root also holds the header, the readout, the marks and the helper
   * text, so it is 64px tall where the rail is 4px; measuring the root mapped a press on the visible
   * line across a box sixteen times its height, which is what made a click land somewhere the user had
   * not clicked.
   *
   * `bottom - clientY` rather than `clientY - top` on the block axis, because a vertical slider's low
   * end is at the **bottom**: the value grows upward, which is what `--uir-slider-at` and the drawn thumb
   * both assume. Getting this backwards is why a vertical slider jumped between the two ends instead of
   * tracking the pointer.
   */
  const valueFromPointer = (event: React.PointerEvent<HTMLElement>): number | null => {
    const box = railRef.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0 || box.height === 0) return null;

    const vertical = orientation === "vertical";

    /*
     * Measured from the end the orientation implies: the inline start for a horizontal rail, and the
     * **bottom** for a vertical one, because a vertical slider's minimum is at the bottom. Reading the
     * block axis from the top is the obvious transcription and it transposes the two ends — which is why a
     * vertical slider used to snap between its extremes instead of tracking the pointer.
     *
     * The mapping is `fractionFromPointer`: a pure function, tested as one. It has to be, because this
     * environment cannot deliver a pointer gesture to a component at all — `jsdom` has no
     * `PointerEvent` and no `setPointerCapture`. See `src/internal/track.ts`.
     */
    const position = vertical ? box.bottom - event.clientY : event.clientX - box.left;

    const fraction = fractionFromPointer(
      { length: vertical ? box.height : box.width, thumb: vertical ? box.width : box.height },
      position
    );

    return min + fraction * (max - min);
  };

  /**
   * The thumb a gesture should move: the one nearest the pointer.
   *
   * This is the whole reason the pointer is handled here rather than by the native inputs. A range
   * slider draws two full-length `<input type="range">` elements over one rail, so exactly one of them
   * is on top and receives every pointer event — whichever is later in the DOM. The result was that
   * pressing the **left** thumb moved the **right** one, on every click and every drag, because the
   * right input was the only one the pointer ever reached.
   *
   * Narrowing the inputs would not fix it either: a native input maps its own value across its own
   * width, so giving each thumb half the rail would also halve the value range it could represent, and
   * the drawn thumb would stop agreeing with `aria-valuenow`.
   *
   * So the inputs keep the full range and the full rail and stop taking the pointer
   * (`pointer-events: none`, in the stylesheet), and the nearest-thumb rule is applied here where the
   * whole rail is one target. The inputs stay focusable and keep the platform keyboard and the form.
   */
  const nearestThumb = (value: number): number => nearestThumbIndex(values, value);

  /**
   * Begin a gesture.
   *
   * On the rail, so a press anywhere on the line — on a thumb or on the track beside one — is the same
   * gesture. `beginInteraction` runs here, on the *press*, so `Escape` has the value from before the
   * gesture rather than from one pixel into it.
   */
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (disabled) return;

    /*
     * `isPrimary === false`, not `!isPrimary`.
     *
     * The point is to ignore the *second* finger of a two-finger gesture. Treating a missing
     * `isPrimary` as "not primary" quietly disables the control outright in any environment that does not
     * populate the property — which is not hypothetical: it is exactly what happened under jsdom, where
     * `PointerEvent` drops it from the init dictionary, so every press was ignored and the suite passed
     * because it had no pointer tests at all. Unknown is not false.
     */
    if (event.isPrimary === false) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;

    const value = valueFromPointer(event);
    if (value === null) return;

    beginInteraction();

    const index = nearestThumb(value);
    dragIndex.current = index;

    /*
     * Capture on the rail, so a drag that leaves the rail still reports. Without it a pointer that
     * outruns the control stops moving the thumb and the value sticks where the pointer left the box.
     *
     * Wrapped because it can throw, and a throw here would take the rest of the handler with it — no
     * focus, no value, no gesture. Capture is an enhancement to the drag, not a precondition for it, so
     * failing to capture must still leave a working press.
     */
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* No capture available; the gesture still works while the pointer stays over the rail. */
    }

    /*
     * Focus the thumb this gesture owns, so the focus ring is on it and the arrow keys continue to work
     * from where the pointer left off. `preventDefault` first: the platform would otherwise also select
     * the rail's text on a drag.
     */
    event.preventDefault();
    inputRefs.current[index]?.focus({ preventScroll: true });

    move(index, value, "change");
  };

  /** Continue the gesture, against the thumb that claimed it. */
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const index = dragIndex.current;
    if (index === null || disabled) return;

    const value = valueFromPointer(event);
    if (value === null) return;

    move(index, value, "change");
  };

  /**
   * Commit once the pointer is released.
   *
   * The guard is "a gesture is in progress", not the event target: a `pointerup` on the rail can mean
   * either that a drag finished or that a press with no movement finished, and both are one completed
   * decision worth committing. `pointercancel` is the platform taking the gesture away, which is not a
   * decision the user made, so it commits nothing.
   */
  const onPointerSettled = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (dragIndex.current === null) return;
    dragIndex.current = null;

    if (event.type === "pointercancel") return;

    emit(values, "commit");
  };
  /* ---- A11y wiring --------------------------------------------------- */

  const baseId = id ?? generatedId;
  const labelId = `${baseId}-label`;
  const helperId = `${baseId}-helper`;

  const hasHelper = isRenderable(helperText);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    if (step === 0) {
      console.error(
        "Slider: `step` is 0, which means the thumb cannot move. Use `step={null}` for a " +
          "continuous slider, or omit `step` for the default of 1. A zero step is treated as 1."
      );
    }
    if (min > max) {
      console.error(
        `Slider: \`min\` (${min}) is greater than \`max\` (${max}). The range is inverted, ` +
          "so every value clamps to the same number and the thumb cannot move."
      );
    }
  }, [min, max, step]);

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cx("uir-slider", className)}
      style={style}
      data-orientation={orientation}
      data-size={size}
      data-tone={tone}
      data-disabled={disabled ? "" : undefined}
      data-range={thumbCount > 1 ? "" : undefined}
      data-track={trackProp}
      onKeyDown={handleKeyDown}
    >
      <div className="uir-slider__header">
        {/*
          A real `<label for>` pointing at the first thumb, plus the current value beside it.
          Not an `aria-label` on the root: the root is not the slider, each thumb is, and a label
          associated with the first input is what a browser and a screen reader both understand.
        */}
        <label className="uir-slider__label" id={labelId} htmlFor={`${baseId}-0`}>
          {label}
        </label>

        {hideValueText ? null : (
          <span className="uir-slider__readout">
            {thumbs.map((thumb, index) => (
              <span key={`readout-${index}`} className="uir-slider__readout-value">
                {getAriaValueText?.(thumb.value, index) ?? thumb.value}
              </span>
            ))}
          </span>
        )}
      </div>

      {/*
        The rail. `aria-hidden` because it is a picture of the track, not the control: every value
        it depicts is on the inputs below, and announcing the geometry as well would restate the
        thumb's own value in a second role.
      */}
      <div
        className="uir-slider__rail"
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerSettled}
        onPointerCancel={onPointerSettled}
      >
        <div
          aria-hidden="true"
          className="uir-slider__track"
          style={
            {
              "--uir-slider-from": start,
              "--uir-slider-to": far,
            } as React.CSSProperties
          }
        />
        {thumbs.map((thumb, index) => (
          <span
            key={`thumb-${index}`}
            aria-hidden="true"
            className="uir-slider__thumb"
            style={{ "--uir-slider-at": thumb.at } as React.CSSProperties}
          />
        ))}

        {/*
          The real controls: transparent, `pointer-events: none`, and full length.
          *
          * `pointer-events: none` because the rail above is the pointer target and a gesture has to
          * reach the *nearest* thumb. Two full-length inputs over one rail cannot do that — one is on
          * top and takes every event, so pressing one thumb moved the other. See `nearestThumb`.
          *
          * Still focusable, still the platform's keyboard, still a real form control, and still what
          * `aria-valuenow` reads. The value is written through `move`, so the drawn thumb and the
          * announced value cannot disagree — which is the property the native pointer maths used to
          * provide, and the reason it had to be given up deliberately rather than by accident.
          */}
        <div className="uir-slider__inputs">
          {thumbs.map((thumb, index) => (
            <input
              key={`input-${index}`}
              ref={composeRefs<HTMLInputElement>(
                (node: HTMLInputElement | null) => {
                  inputRefs.current[index] = node;
                },
                // Later thumbs get no consumer ref: one ref has to mean one thing.
                index === 0 ? ref : undefined
              )}
              id={`${baseId}-${index}`}
              type="range"
              className="uir-slider__input"
              aria-labelledby={labelId}
              aria-describedby={hasHelper ? helperId : undefined}
              min={min}
              max={max}
              step={effectiveStep ?? "any"}
              value={thumb.value}
              disabled={disabled}
              name={name === undefined ? undefined : thumbCount > 1 ? `${name}[${index}]` : name}
              aria-valuetext={getAriaValueText?.(thumb.value, index)}
              /*
               * The pointer-driven path.
               *
               * A native range input reports the value it has settled on in `change`, so this is
               * where a drag is reported. `beginInteraction` runs on `pointerdown` rather than here
               * so that `Escape` has a value from before the *gesture*, not from before the last
               * pixel of it — cancelling at the last pixel would cancel to a value the user has
               * already watched slide past.
               */
              onChange={composeHandlers<React.ChangeEvent<HTMLInputElement>>((event) => {
                /*
                 * A change with no button held down is already a finished decision — one arrow press,
                 * one step, no drag in progress — so it commits as well as changing. A change during a
                 * drag does not: it is mid-gesture, and its commit belongs to `pointerup`.
                 */
                const phase = dragIndex.current === null ? "commit" : "change";

                move(index, Number(event.target.value), phase);
              }, onChange)}
            />
          ))}
        </div>

        {/*
          The value bubble. Rendered only when asked for, and driven by CSS from the same
          `--uir-slider-at` custom property the thumb uses, so it cannot be positioned independently
          of the thumb it belongs to.
        */}
        {valueLabelDisplay === "off" ? null : (
          <div className="uir-slider__labels" aria-hidden="true">
            {thumbs.map((thumb, index) => (
              <span
                key={`bubble-${index}`}
                className="uir-slider__value-label"
                style={{ "--uir-slider-at": thumb.at } as React.CSSProperties}
              >
                {getAriaValueText?.(thumb.value, index) ?? thumb.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {marks && marks.length > 0 ? (
        <div className="uir-slider__marks" aria-hidden="true">
          {marks.map((mark) => (
            <span
              key={mark.value}
              className="uir-slider__mark"
              style={{ "--uir-slider-at": fraction(mark.value, min, max) } as React.CSSProperties}
            >
              {showLabels && isRenderable(mark.label) ? (
                <span className="uir-slider__mark-label">{mark.label}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      {hasHelper ? (
        <span className="uir-slider__helper" id={helperId}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

/** Which thumb an event came from, or -1. */
function thumbIndexFrom(target: EventTarget | null): number {
  if (!(target instanceof HTMLInputElement)) return -1;
  const dash = target.id.lastIndexOf("-");
  return dash === -1 ? -1 : Number(target.id.slice(dash + 1));
}
