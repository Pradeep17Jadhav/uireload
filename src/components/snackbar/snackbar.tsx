/**
 * Snackbar.
 *
 * A transient message, portalled to the bottom of the page, in a live region so it is announced.
 *
 * Two things carry the whole design, and both are about *not losing the user's place*:
 *
 * 1. **The timer pauses** while the pointer is over it or focus is inside it. A countdown that keeps
 *    running while someone is reading the message, or has tabbed into its action, removes the thing
 *    they were interacting with — and the second case is the worse one, because a focused element
 *    vanishing from the tab order takes the user's place with it.
 * 2. **The close reason is reported.** A timed-out message and a dismissed one want different
 *    responses, and a consumer that cannot tell them apart gets the behaviour wrong in a way that is
 *    very hard to see.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { composeHandlers, cx, Portal, useControllableState } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./snackbar.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { SnackbarProps, SnackbarCloseReason } from "./snackbar.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * The shortest a message may stay up.
 *
 * 5000ms, floored rather than validated. Below that a message is more likely to disappear while it is
 * being read than to have been read, and the failure is invisible to the person who set the timer.
 */
const MIN_DURATION = 5000;

const DEFAULT_DURATION = 7000;

export function Snackbar(props: SnackbarProps) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onClose,
    onDismiss,
    duration = DEFAULT_DURATION,
    placement = "bottom-end",
    tone = "neutral",
    showClose = true,
    closeLabel,
    dismissOnClickOutside = false,
    pauseOnHover = true,
    live = "polite",
    action,
    icon,
    className,
    style,
    ref,
    onKeyDown,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
  });

  const baseId = useId();
  const closeName = closeLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.close");

  /*
   * The remaining time, as a ref rather than state.
   *
   * Pausing needs to remember *how much was left*, and re-rendering on every tick to hold that number
   * would mean a state update every frame of the countdown. Nothing renders from it, so a ref is the
   * right tool: the timer is read by the effect, and the effect re-runs only when it is restarted.
   */
  const remaining = useRef<number | null>(null);
  const startedAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** How long the message may stay up, floored. */
  const total = duration === null ? null : Math.max(duration, MIN_DURATION);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  /**
   * Ask to close, once.
   *
   * The `closed` ref is what makes a controlled snackbar safe: a timer expiring and the user pressing
   * Escape in the same tick would otherwise call `onClose` twice, and a consumer that enqueues an undo
   * on `onClose` would offer it twice.
   */
  const closed = useRef(false);

  /*
   * Whether the countdown is currently frozen.
   *
   * State rather than read off `timer.current` during render: a ref read while rendering is not a
   * render-visible value, so a pause that happened between renders would paint the wrong attribute and
   * nothing would correct it until the next render. One boolean, set in two places, is the whole cost.
   */
  const [paused, setPaused] = useState(false);

  const requestClose = useCallback(
    (reason: SnackbarCloseReason) => {
      if (closed.current) return;
      closed.current = true;
      clear();

      /*
       * Both callbacks, both always.
       *
       * `onClose` is the request and `onDismiss` is the fact. In uncontrolled mode the component acts
       * on the request; in controlled mode it does not, and the consumer must — so `onDismiss` exists
       * to be the one a consumer can rely on having fired by the time the snackbar is gone.
       */
      onClose?.(reason);
      if (openProp === undefined) setOpen(false);

      /*
       * `onDismiss` fires here rather than at each call site, so it cannot be missed by a reason added
       * later — and so a consumer can rely on it having fired for *every* close, not just the ones
       * someone remembered to wire up.
       */
      onDismiss?.(reason);
    },
    [clear, onClose, onDismiss, openProp, setOpen]
  );

  /**
   * Start the timer.
   *
   * `restarted` is the total on a fresh start and whatever was left on a resume — which is the whole
   * of the pause behaviour, and the reason the remaining time is tracked at all.
   */
  const start = useCallback(
    (restarted: number) => {
      clear();
      if (total === null) return;

      startedAt.current = Date.now();
      remaining.current = restarted;

      timer.current = setTimeout(() => {
        requestClose("timeout");
      }, restarted);
    },
    [clear, requestClose, total]
  );

  /* ---- Open state ---------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      // A closed snackbar's timer state must not survive into the next open, or a re-opened message
      // would resume a countdown that was already spent.
      clear();
      remaining.current = null;
      closed.current = false;
      return;
    }

    closed.current = false;
    start(total ?? MIN_DURATION);

    return clear;
  }, [clear, open, start, total]);

  /* ---- Pause and resume ---------------------------------------------- */

  /**
   * Freeze the countdown, remembering what was left.
   *
   * The elapsed time is measured from `startedAt` rather than counted in ticks, so a timer that was
   * throttled by a background tab resumes from where it actually was rather than from where the throttled
   * callbacks got to.
   */
  const pause = useCallback(() => {
    if (!pauseOnHover) return;
    if (timer.current === null || remaining.current === null) return;

    clear();
    remaining.current = Math.max(remaining.current - (Date.now() - startedAt.current), 0);
    setPaused(true);
  }, [clear, pauseOnHover]);

  const resume = useCallback(() => {
    if (!pauseOnHover) return;
    // Nothing to resume when the timer never started: `duration={null}` is not paused.
    if (remaining.current === null) return;

    setPaused(false);
    start(remaining.current);
  }, [pauseOnHover, start]);

  /* ---- Keyboard ------------------------------------------------------ */

  /**
   * Escape dismisses.
   *
   * On the root rather than on `document`, because the snackbar must not steal Escape from whatever
   * the user was doing when it appeared — and because the snackbar is portalled, a document-level
   * listener would close it from a keystroke aimed at a dialog behind it.
   *
   * `preventDefault` is called first: a bare Escape in a page should not also cancel a pending network
   * request the browser thinks it owns.
   */
  const handleKeyDown = composeHandlers<React.KeyboardEvent<HTMLDivElement>>((event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    requestClose("escape");
  }, onKeyDown);

  /* ---- Click away ---------------------------------------------------- */

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!dismissOnClickOutside) return;
    if (!event.currentTarget.contains(event.target as Node)) requestClose("dismiss");
  };

  return (
    /*
     * Portalled to the end of the body.
     *
     * Not for z-index reasons — the fixed positioning would handle that. It is so a snackbar rendered
     * inside a container with `overflow: hidden` or a stacking context is still fully visible, and so a
     * `transform` on an ancestor does not become the containing block for something that is meant to be
     * pinned to the viewport. A transient message is a property of the page, not of the subtree that
     * happened to trigger it.
     */
    <Portal>
      <div
        {...rest}
        ref={ref}
        className={cx("uir-snackbar", className)}
        style={style}
        data-placement={placement}
        data-tone={tone}
        data-live={live}
        data-open={open ? "" : undefined}
        data-paused={paused ? "" : undefined}
        data-has-action={isRenderable(action) ? "" : undefined}
        /*
         * A live region, and `aria-live` is on the element **from the first render**, not added when the
         * message appears.
         *
         * A live region created at the same moment as its content is frequently not announced at all:
         * assistive technology observes changes inside a region it already knows about, and a region that
         * did not exist a moment ago has nothing to observe. This is the single most common way a toast
         * message is silently dropped.
         *
         * `visibility: hidden` while closed rather than unmounting, for the same reason — see
         * `snackbar.css`. A removed region and a re-added one is a new region.
         */
        aria-live={live === "off" ? undefined : live}
        aria-atomic="true"
        id={baseId}
        onKeyDown={handleKeyDown}
        onPointerDown={onPointerDown}
        /*
         * The hover pair.
         *
         * `onPointerLeave` rather than `onMouseLeave`, because a touch pointer fires neither and would
         * leave the timer paused forever after the first tap.
         */
        onPointerEnter={pause}
        onPointerLeave={resume}
        /*
         * `focus` / `blur` bubble, so a tab into the action inside the snackbar pauses the timer through
         * the same pair. That is the case the pause exists for.
         */
        onFocus={pause}
        onBlur={resume}
      >
        {/*
        The tone glyph.
        *
        * Drawn in CSS rather than imported, and suppressed for a neutral tone: an information mark
        * beside text that says nothing is decoration. `aria-hidden`, because the tone is not something
        * a screen reader can usefully relay and the message text already carries the meaning.
      */}
        {isRenderable(icon) ? (
          <span className="uir-snackbar__icon" aria-hidden="true">
            {icon}
          </span>
        ) : tone === "neutral" ? null : (
          <span className="uir-snackbar__glyph" data-tone={tone} aria-hidden="true" />
        )}

        <div className="uir-snackbar__message">{children}</div>

        {isRenderable(action) ? <div className="uir-snackbar__action">{action}</div> : null}

        {showClose ? (
          <button
            type="button"
            className="uir-snackbar__close"
            aria-label={closeName}
            onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>((event) => {
              event.stopPropagation();
              requestClose("dismiss");
            }, undefined)}
          >
            <span className="uir-snackbar__close-glyph" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </Portal>
  );
}
