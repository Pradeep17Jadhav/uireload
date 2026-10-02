/**
 * Popover.
 *
 * A surface positioned against an anchor: supplementary content, a small form, a list.
 *
 * It is deliberately not a dialog. A popover is *non-modal by default* — it leaves focus in
 * the page, lets `Tab` continue past it, and does not lock scroll — because that is what a
 * dropdown list needs. Pass `modal` for the dialog-like behaviour, or use `Dialog`, which is
 * centred rather than anchored and has a different keyboard contract.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Portal,
  computeOverlayPosition,
  cx,
  readDirection,
  useAnchorInView,
  useControllableState,
  useDismiss,
  useFocusTrap,
  useRepositionOnChange,
  useScrollLock,
  type PositionedOverlay,
} from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./popover.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by
 * `scripts/bundle-css.mjs`. Importing it from JavaScript would make the package
 * non-tree-shakeable and would duplicate the rules in every consumer bundle.
 */

import type { FocusTarget } from "../../types";
import type { PopoverProps, PopoverVirtualAnchor } from "./popover.types";

/** Everything `anchor` accepts: a ref, a node, a thunk, a bare rect, or nothing. */
type PopoverAnchor = FocusTarget | PopoverVirtualAnchor | null;

/**
 * A centred position, used before the first measurement.
 *
 * Deliberately the centre of the viewport rather than `top: 0; left: 0`. A popover whose
 * anchor has not been resolved yet is a real state — the anchor is inside a conditional that
 * has not rendered — and in the corner it reads as a broken element, whereas centred it reads
 * as "not quite ready". One frame at the centre is the smaller failure.
 */
const UNMEASURED: PositionedOverlay = {
  top: 50,
  left: 50,
  placement: "bottom",
  arrowStartPercent: 50,
  shifted: false,
};

/**
 * Resolve the anchor at call time, never during render.
 *
 * Four forms are accepted: a thunk, a ref object, a node, and nothing. The ref case is detected
 * structurally by looking for a `current` property rather than with `instanceof RefObject`,
 * which `react` does not export.
 *
 * A virtual anchor — a bare `{ getBoundingClientRect }` — resolves to itself. It is not an
 * `Element`, so everything downstream treats it as a position source and nothing else: it is
 * never read for `ownerDocument`, never observed, and never tested with `contains`.
 */
function resolveAnchor(anchor: PopoverAnchor): Element | PopoverVirtualAnchor | null {
  // A thunk may return `undefined`, so an anchor that is not yet mounted is a normal state.
  if (typeof anchor === "function") return anchor() ?? null;

  if (anchor !== null && typeof anchor === "object" && "current" in anchor) {
    return anchor.current ?? null;
  }

  return anchor ?? null;
}

/**
 * Whether a node reports a positionable rectangle.
 *
 * Structural rather than `instanceof Element`, so it works across realms — an anchor from an
 * iframe, or from a different jsdom instance in a micro-frontend, is not this realm's
 * `Element`. UI5 goes further and duck-types its own elements with `isUI5AbstractElement` for
 * the same reason.
 */
function isPositionSource(value: unknown): value is Element | PopoverVirtualAnchor {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Element).getBoundingClientRect === "function"
  );
}

/**
 * A position source that is also a real node, and so can be observed and hit-tested.
 *
 * A virtual anchor is a rect and nothing else: it has no `ownerDocument`, cannot be tested with
 * `contains`, and is not something a `ResizeObserver` can watch. Every code path that needs
 * those capabilities checks this first and simply does nothing for a virtual anchor, which is
 * correct — there is no node whose scroll-away should close the surface.
 */
function asElement(value: unknown): Element | null {
  return value !== null && typeof value === "object" && "nodeType" in value
    ? (value as Element)
    : null;
}

/**
 * A surface positioned against an anchor.
 *
 * ```html
 * <div class="uir-popover__backdrop" data-modal>          only when modal
 * <div class="uir-popover" role="dialog" aria-modal>…      the surface
 *   <div class="uir-popover__arrow" aria-hidden="true"></div>
 *   <div class="uir-popover__header"><h2 id>…</h2></div>
 *   <div class="uir-popover__content">…</div>
 *   <div class="uir-popover__footer">…</div>
 * </div>
 * ```
 *
 * `role="dialog"` is emitted for every popover, modal or not. A non-modal surface is still a
 * group of content that a screen reader should be able to enter and leave deliberately, and
 * `aria-modal` is what distinguishes the two — it is emitted only when `modal` is set,
 * because `aria-modal="false"` is noise and some assistive technology treats the mere
 * attribute as a claim of modality.
 */
export function Popover(props: PopoverProps) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    anchor,
    placement = "bottom",
    align = "center",
    offset = 8,
    viewportPadding = 8,
    modal = false,
    closeOnOutsidePress = true,
    closeOnEscape = true,
    closeOnAnchorOutOfView = true,
    autoFocus = true,
    restoreFocus = true,
    label,
    title,
    tone = "neutral",
    header,
    footer,
    arrow = false,
    className,
    style,
    onClose,
    children,
    id,
    ref,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const surfaceRef = useRef<HTMLDivElement | null>(null);

  /*
   * The resolved anchor, in two forms.
   *
   * `anchorRef` is whatever can report a rect — an element or a virtual anchor — and is the
   * only thing positioning reads. `anchorElementRef` is the subset that is a real node, and is
   * what the observer and the outside-press check use. Splitting them means a virtual anchor
   * needs no null-checks scattered through three call sites: it simply has no element, so
   * nothing observes it and a press on it is not an "inside" press.
   */
  const anchorRef = useRef<Element | PopoverVirtualAnchor | null>(null);
  const anchorElementRef = useRef<Element | null>(null);

  /*
   * Whether the surface node exists *yet*.
   *
   * `Portal` renders nothing on its first pass — it has to, or the server and the client would
   * disagree — so the surface arrives one commit after `open` becomes true. Anything that
   * depends on the node existing has to depend on this rather than on `open`, because `open`
   * and "the surface is in the DOM" are two different moments and a layout effect keyed off
   * `open` alone runs before the node is there.
   *
   * `useFocusTrap` was exactly this bug: it activates on `open`, finds a null container, and
   * never re-runs, because its dependencies did not change. A modal popover opened by a click
   * then never received focus at all.
   */
  const [surfaceNode, setSurfaceNode] = useState<HTMLDivElement | null>(null);

  const attachSurface = useCallback((node: HTMLDivElement | null) => {
    surfaceRef.current = node;
    setSurfaceNode(node);
  }, []);

  const [position, setPosition] = useState<PositionedOverlay>(UNMEASURED);

  /**
   * Re-measure and reposition.
   *
   * Reads the anchor and the surface from the DOM rather than from props, because both are
   * only knowable after layout. Everything it touches is inside an effect or an observer
   * callback, so no DOM read happens during render and the component is SSR safe.
   */
  const measure = useCallback(() => {
    const surface = surfaceRef.current;
    const anchorNode = anchorRef.current;

    if (surface === null) return;

    /*
     * The viewport comes from the surface's own document, not the global one. An anchor inside
     * an iframe belongs to that iframe's viewport, and `window.innerWidth` would be the host's
     * — placing the surface against coordinates from a different window.
     */
    const view = surface.ownerDocument.defaultView ?? window;

    if (!isPositionSource(anchorNode)) {
      // No anchor: centred rather than pinned to a corner. See UNMEASURED.
      setPosition({ ...UNMEASURED, top: view.innerHeight / 2, left: view.innerWidth / 2 });
      return;
    }

    /*
     * Direction comes from the anchor's DOM subtree when there is one, and from the surface's
     * otherwise.
     *
     * Read on every measure rather than cached in state, because it is a DOM fact that can
     * change while the surface is open — an ancestor switching to RTL is a real thing in a
     * shell that lets the user change language — and a cached copy would be stale for reasons
     * the caller cannot see. A virtual anchor has no subtree, so the surface's own direction
     * is the best available answer.
     */
    const element = asElement(anchorNode);

    setPosition(
      computeOverlayPosition({
        anchorRect: anchorNode.getBoundingClientRect(),
        surfaceWidth: surface.offsetWidth,
        surfaceHeight: surface.offsetHeight,
        viewportWidth: view.innerWidth,
        viewportHeight: view.innerHeight,
        placement,
        offset,
        viewportPadding,
        align,
        direction: readDirection(element ?? surface),
      })
    );
  }, [align, offset, placement, viewportPadding]);

  /*
   * Resolve the anchor, then measure.
   *
   * A layout effect rather than an effect, so the surface is positioned in the same frame it is
   * inserted. An effect would place it at the centre for one painted frame and then jump, which
   * is exactly the flicker every portalled component has to avoid.
   *
   * Skipped on the server: there is no layout to measure, and the unmeasured position is the
   * correct answer there anyway.
   */
  useLayoutEffect(() => {
    if (!open) return;

    const node = resolveAnchor(anchor);
    anchorRef.current = isPositionSource(node) ? node : null;
    // Synced here rather than read through a getter, because this value is handed to
    // `useAnchorInView` and `useDismiss`, whose effects run after a layout effect and so must
    // already see the resolved element.
    anchorElementRef.current = asElement(anchorRef.current);

    measure();
  }, [anchor, measure, open]);

  /* ---- Repositioning ------------------------------------------------- */

  /* ---- Repositioning ------------------------------------------------- */

  useRepositionOnChange([surfaceRef, anchorElementRef], open, measure);

  useAnchorInView(anchorElementRef, open && closeOnAnchorOutOfView, () => {
    setOpen(false);
    onClose?.("outside-press");
  });

  /* ---- Modality ------------------------------------------------------ */

  useScrollLock(open && modal);

  /*
   * A ref object built from `surfaceNode` rather than `surfaceRef`, so `useFocusTrap`'s effect
   * re-runs when the node actually appears. Its dependency is the ref *identity*, and a ref
   * whose `.current` changes in place produces no new identity — so passing `surfaceRef`
   * directly meant the trap activated against a null container and never looked again.
   */
  const trapContainerRef = useRef<HTMLDivElement | null>(surfaceNode);
  trapContainerRef.current = surfaceNode;

  useFocusTrap({
    active: open && modal && autoFocus && surfaceNode !== null,
    containerRef: trapContainerRef,
    // Only restore focus for a modal surface: a non-modal one never took focus, so restoring it
    // would move it somewhere it was never asked to go.
    restoreFocus: modal && restoreFocus,
  });

  useDismiss({
    active: open,
    onDismiss: (reason) => {
      setOpen(false);
      onClose?.(reason);
    },
    containerRef: surfaceRef,
    // A press on the anchor must not count as an outside press, or clicking a trigger while
    // its popover is open closes it and the click immediately reopens it.
    ignoreRef: anchorElementRef,
    escape: closeOnEscape,
    outsidePress: closeOnOutsidePress,
  });

  /*
   * The id of the rendered heading, and only when a heading is actually rendered.
   *
   * Derived from `title` rather than from `id` alone: emitting `aria-labelledby="surface-title"`
   * for a surface with no heading points at a reference that does not exist, and assistive
   * technology falls back to nothing — which is worse than having no `aria-labelledby` at all,
   * because the `aria-label` is then suppressed in favour of a dangling reference.
   */
  const titleId = title !== undefined && id !== undefined ? `${id}-title` : undefined;

  /*
   * The surface's accessible name, and the reason it is resolved here rather than inline.
   *
   * `aria-label` is written *after* `{...rest}` in the JSX, because it must not be emitted when a
   * heading exists — a dangling `aria-labelledby` suppresses the `aria-label` rather than falling
   * back to it. But "written after the spread" also means it would *overwrite* a consumer's own
   * `aria-label`, silently dropping the name and leaving an unnamed `role="dialog"`. So the
   * consumer's value is read out of `rest` and used as the fallback rather than being clobbered.
   *
   * Caught by the axe suite, which is the argument for running it against `document.body` rather
   * than against the render container.
   */
  const consumerAriaLabel = rest["aria-label"];
  const consumerAriaLabelledBy = rest["aria-labelledby"];
  const accessibleName = label ?? consumerAriaLabel;
  const labelledBy = titleId ?? consumerAriaLabelledBy;

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !open) return;
    if (title !== undefined || label !== undefined) return;

    console.warn(
      "Popover: no accessible name. Pass `title` (rendered as a visible heading) or `label`. " +
        'A `role="dialog"` with no name is announced as "dialog" and nothing else.'
    );
  }, [label, open, title]);

  /*
   * Nothing is rendered when closed. Not `display: none`, not an empty portal: a surface in the
   * DOM with `aria-hidden` is still reachable by some assistive technology and still creates
   * a node for a consumer's own `:first-child` selector to trip over.
   */
  if (!open) return null;

  const resolved = resolveAnchor(anchor);
  const hasAnchor = isPositionSource(resolved);

  return (
    <Portal>
      {modal ? <div className="uir-popover__backdrop" data-uir-popover-backdrop="" /> : null}

      <div
        {...rest}
        ref={attachSurface}
        id={id}
        className={cx("uir-popover", className)}
        style={{
          ...style,
          // Positioning is the one thing the component must win, so it is written after the
          // consumer's `style`. A consumer who needs to move the surface can override it from
          // CSS, which is the documented escape hatch.
          position: "fixed",
          top: position.top,
          left: position.left,
        }}
        role="dialog"
        aria-modal={modal || undefined}
        aria-label={labelledBy === undefined ? accessibleName : undefined}
        aria-labelledby={labelledBy}
        data-placement={position.placement}
        data-modal={modal ? "" : undefined}
        data-shifted={position.shifted ? "" : undefined}
        data-tone={tone}
        data-align={align}
        // `data-unpositioned` is what lets a consumer tell "not measured yet" from "measured
        // and centred", which look identical otherwise.
        data-unpositioned={hasAnchor ? undefined : ""}
      >
        {arrow ? (
          <span
            className="uir-popover__arrow"
            aria-hidden="true"
            style={{ insetInlineStart: `${position.arrowStartPercent}%` }}
          />
        ) : null}

        {header !== undefined ? <div className="uir-popover__header">{header}</div> : null}

        {titleId !== undefined ? (
          <div className="uir-popover__header">
            <h2 className="uir-popover__title" id={titleId}>
              {title}
            </h2>
          </div>
        ) : null}

        <div className="uir-popover__content">{children}</div>

        {footer !== undefined ? <div className="uir-popover__footer">{footer}</div> : null}
      </div>
    </Portal>
  );
}
