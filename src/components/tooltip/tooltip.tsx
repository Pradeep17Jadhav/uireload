/**
 * Tooltip.
 *
 * A short text that appears on hover or focus, portalled and positioned by the shared overlay
 * algorithm.
 *
 * Three decisions carry the component, and all three are about not making the tooltip an attack:
 *
 * 1. **A delay before it opens.** A tooltip that appears with no delay fires on every pass of the
 *    pointer across a toolbar.
 * 2. **A grace period before it closes.** Moving the pointer onto the tooltip — to read it, or to
 *    select its text — must not dismiss it. Without this, the tooltip is only readable if you already
 *    know what it says.
 * 3. **The delay is hover-only.** Focus shows it immediately, because a keyboard user has deliberately
 *    arrived at the element and there is no accidental-pass-through equivalent.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  composeRefs,
  computeOverlayPosition,
  cx,
  Portal,
  readDirection,
  useControllableState,
  useIsomorphicLayoutEffect,
  type OverlayPlacement,
} from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./tooltip.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { TooltipProps, TooltipPlacement } from "./tooltip.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/** The component's placement vocabulary, mapped onto the shared overlay one. */
function toOverlay(placement: TooltipPlacement): OverlayPlacement {
  switch (placement) {
    case "top":
      return "top";
    case "bottom":
      return "bottom";
    case "inline-start":
      return "start";
    case "inline-end":
      return "end";
  }
}

export function Tooltip(props: TooltipProps) {
  const {
    children,
    label,
    placement = "top",
    offset = 8,
    delay = 400,
    hideDelay = 200,
    open: openProp,
    onOpenChange,
    describe = "tooltip",
    className,
    style,
    ref,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });

  const baseId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [position, setPosition] = useState<{ top: number; left: number; side: string } | null>(
    null
  );

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  /* ---- Open and close ------------------------------------------------ */

  /**
   * Open after the delay, or immediately for a keyboard user.
   *
   * The `immediate` flag is the whole of the focus-versus-hover distinction. A keyboard user has
   * arrived deliberately and there is no "passed over the element by accident" case to guard against;
   * a pointer user has both.
   */
  const show = useCallback(
    (immediate = false) => {
      clearTimers();
      if (immediate) {
        setOpen(true);
        return;
      }
      openTimer.current = setTimeout(() => setOpen(true), delay);
    },
    [clearTimers, delay, setOpen]
  );

  const hide = useCallback(() => {
    clearTimers();

    closeTimer.current = setTimeout(() => setOpen(false), hideDelay);
  }, [clearTimers, hideDelay, setOpen]);

  useEffect(() => clearTimers, [clearTimers]);

  /* ---- Keyboard ------------------------------------------------------ */

  /**
   * Escape dismisses.
   *
   * A tooltip is not dismissable content, so it takes no focus and traps nothing — but a user who
   * dismisses a tooltip they are reading wants it gone, not waiting out the grace period. Without this
   * the only way to dismiss it is to move the pointer, which a keyboard user cannot do.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.key !== "Escape") return;
    clearTimers();
    setOpen(false);
  };

  /* ---- Position ------------------------------------------------------ */

  /**
   * Measure and place the surface against the trigger.
   *
   * A function rather than an effect body, because it has to run from **two** places and an effect can
   * only be keyed on one set of dependencies.
   *
   * The reason it is not enough to key on `open`: `Portal` renders `null` on its first pass so the
   * server and the client produce the same markup. On a tooltip that is open from the first render —
   * which is what `open` and the "always described" story both do — the positioning effect ran while
   * `surfaceRef.current` was still `null`, returned at its first line, and never ran again because
   * none of `open`, `offset` or `placement` had changed. The surface kept no `style` at all and
   * rendered as a static block at the end of `<body>`: correct role, correct content, wrong place.
   */
  const measure = useCallback((): void => {
    const trigger = triggerRef.current;
    const surface = surfaceRef.current;
    if (trigger === null || surface === null) return;

    const anchorRect = trigger.getBoundingClientRect();
    const box = surface.getBoundingClientRect();

    /*
     * The *owning* window, not the global one.
     *
     * A component rendered inside an iframe measures against that iframe's viewport; `window` would
     * be the host's, and a tooltip positioned against the wrong viewport lands outside the frame. The
     * same reasoning as `Popover`, which is why both do it the same way.
     */
    const view = surface.ownerDocument.defaultView ?? window;

    const direction = readDirection(trigger);

    const next = computeOverlayPosition({
      anchorRect,
      surfaceWidth: box.width,
      surfaceHeight: box.height,
      viewportWidth: view.innerWidth,
      viewportHeight: view.innerHeight,
      placement: toOverlay(placement),
      offset,
      viewportPadding: 8,
      align: "center",
      direction,
    });

    setPosition({ top: next.top, left: next.left, side: next.placement });
  }, [offset, placement]);

  /**
   * Place the surface as soon as it exists.
   *
   * A callback ref, because that is the only moment at which the surface is guaranteed to be in the
   * document. It also covers the ordinary case — opening a tooltip that starts closed — where the
   * effect below would have done.
   */
  const attachSurface = useCallback(
    (node: HTMLDivElement | null): void => {
      surfaceRef.current = node;
      if (node !== null && open) measure();
    },
    [measure, open]
  );

  /*
   * And again whenever the inputs to the calculation change, including on close — where the position
   * is dropped so a re-opened tooltip is re-measured rather than flashed at its previous coordinates
   * for a frame.
   */
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    measure();
  }, [measure, open]);

  /*
   * Re-measure when the page scrolls or resizes.
   *
   * A tooltip is positioned once on open and then belongs to the viewport, so a scroll moves it away
   * from the thing it describes — and it would follow nothing, because nothing about the trigger
   * changed and React has no reason to re-render.
   */
  useEffect(() => {
    if (!open) return;

    const view = surfaceRef.current?.ownerDocument.defaultView ?? window;

    view.addEventListener("scroll", measure, true);
    view.addEventListener("resize", measure);

    return () => {
      view.removeEventListener("scroll", measure, true);
      view.removeEventListener("resize", measure);
    };
  }, [measure, open]);

  const hasLabel = isRenderable(label);
  const tooltipId = `${baseId}-tooltip`;

  return (
    <>
      <span
        {...rest}
        /*
         * Both refs, and `triggerRef` is not optional here.
         *
         * The positioning effect measures the trigger, so the trigger has to actually be in the DOM as
         * something this component holds a reference to. Passing only the consumer's `ref` left
         * `triggerRef.current` permanently `null`, the measuring effect returned at its first line
         * every time, and the surface never received a `position` — so it rendered as a static block
         * at the end of `<body>`, at whatever horizontal position that happened to be. That is the
         * "the tooltip appears at the far right of the screen" symptom, and it is why every test
         * passed: the tests assert attributes and roles, and a tooltip in the wrong place still has
         * the right role.
         */
        ref={composeRefs<HTMLSpanElement>(triggerRef, ref)}
        className={cx("uir-tooltip-trigger", className)}
        style={style}
        tabIndex={0}
        /*
         * `aria-describedby` while `aria-label` when the tooltip *is* the name.
         *
         * The two are not interchangeable. A described-by supplements a name, so an icon button with
         * no name and a tooltip still has no name; `aria-label` supplies one, and for a tooltip that
         * is the name it is the correct attribute. `describe` chooses between them because getting it
         * wrong produces a button announced as "button" and nothing else.
         *
         * `describedby` is only set when open: a description that points at an absent element is an
         * invalid reference, and every reader handles a stale one by saying nothing at all.
         */
        aria-describedby={describe === "tooltip" && open ? tooltipId : undefined}
        aria-label={describe === "label" && typeof label === "string" ? label : undefined}
        data-open={open ? "" : undefined}
        onPointerEnter={() => show(false)}
        onPointerLeave={hide}
        onFocus={() => show(true)}
        onBlur={hide}
        onKeyDown={onKeyDown}
      >
        {children}
      </span>

      {/*
        Portalled, and rendered on every pass whether or not it is open.
       *
        The surface is always in the DOM — hidden when closed — because a description that appears and
        disappears with its element is the same live-region problem `Snackbar` documents: assistive
        technology observes changes inside a region it already knows about, and an element that did
        not exist a moment ago has nothing to observe.
       */}
      {hasLabel ? (
        <Portal>
          <div
            ref={attachSurface}
            id={tooltipId}
            role="tooltip"
            className="uir-tooltip"
            data-placement={position?.side ?? placement}
            hidden={!open}
            style={
              /*
               * Coordinates only. `position: fixed` is in the stylesheet, so the surface is already
               * shrink-to-fit at the moment it is measured — measuring a static block read its
               * container's width instead of its own and put the tooltip beside its trigger.
               */
              position === null ? undefined : { top: position.top, left: position.left }
            }
          >
            {label}
          </div>
        </Portal>
      ) : null}
    </>
  );
}
