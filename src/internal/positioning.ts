/**
 * Overlay positioning.
 *
 * The shared positioning problem behind `Popover`, `Select` and `Dialog`: given a rect to
 * anchor against and a box to place, decide where the box goes and which way the arrow
 * points.
 *
 * ## Why this is not CSS alone
 *
 * CSS `anchor()` is the right answer and is not available here: it is not in the baseline
 * across the engines this library supports, and a component that silently fails to position
 * in Firefox is worse than one that does it in JavaScript. Every value this returns is
 * written to an inline `style` on the surface, so a consumer can still override any of it
 * without `!important`.
 *
 * ## The algorithm
 *
 * One rule, in this order, and it is the rule APG's positioning guidance describes:
 *
 * 1. Try the requested placement.
 * 2. If it overflows the viewport and the opposite side fits, flip to the opposite side.
 * 3. Otherwise keep the requested placement and shift along the cross axis so the surface is
 *    inside the viewport, clamped to `viewportPadding`.
 *
 * Flipping is preferred over shifting because a surface that moved sideways while the arrow
 * still points at the anchor is confusing; a surface on the other side of the anchor is
 * legible, and the arrow is what says where it went. Only when neither side fits is a shift
 * the lesser evil, and at that point the content is too large for the viewport anyway.
 *
 * Everything is in logical terms (`start` / `end`) and resolved to physical coordinates only
 * at the very end, from the direction read off the DOM. That keeps RTL out of the
 * algorithm instead of patching it afterwards, which is what UI5 has to do with
 * `getRTLCorrectionLeft()`.
 */

/** A resolved, physical position plus the placement that produced it. */
export interface PositionedOverlay {
  /** Distance from the viewport's block-start edge, in pixels. */
  top: number;
  /**
   * Distance from the viewport's physical left edge, in pixels.
   *
   * Physical rather than logical on purpose: the caller writes it straight to `left` on a
   * `position: fixed` element, and a `left` offset is not mirrored by `dir`. Keeping it
   * physical here means the direction-dependent arithmetic stays in one function.
   */
  left: number;
  /** The placement actually used, which may differ from the one requested after a flip. */
  placement: OverlayPlacement;
  /**
   * Where the arrow should sit, as a percentage of the surface's length.
   *
   * A percentage rather than a pixel offset because the surface's size is not known until
   * after layout, and a percentage is correct at every size without a measurement.
   */
  arrowStartPercent: number;
  /** Whether the surface had to be shifted along the cross axis to stay in the viewport. */
  shifted: boolean;
}

/** The placement values, after a flip. */
export type OverlayPlacement = "top" | "bottom" | "start" | "end";

/** The four candidate placements, in the order a flip would try them. */
const OPPOSITE: Readonly<Record<OverlayPlacement, OverlayPlacement>> = {
  top: "bottom",
  bottom: "top",
  start: "end",
  end: "start",
};

/**
 * A physical side.
 *
 * Named separately from `OverlayPlacement` because the logical and physical vocabularies are
 * deliberately different types. Conflating them is what lets `direction` be forgotten at one
 * of the two places that has to know about it.
 */
type PhysicalSide = "top" | "bottom" | "left" | "right";

export interface ComputePositionOptions {
  /** The anchor's rect, in viewport coordinates. */
  anchorRect: DOMRectReadOnly;
  /** The surface's size, in pixels. */
  surfaceWidth: number;
  surfaceHeight: number;
  /** The viewport's size, in pixels. */
  viewportWidth: number;
  viewportHeight: number;
  /** The requested placement, in logical terms. */
  placement: OverlayPlacement;
  /** Gap between the anchor and the surface. */
  offset: number;
  /** Minimum gap to the viewport edge. */
  viewportPadding: number;
  /** Cross-axis alignment. `stretch` pins the inline edges and skips arrow placement. */
  align: "center" | "stretch";
  /** `"rtl"` resolves `start` / `end` to the physical left / right. */
  direction: "ltr" | "rtl";
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Resolve a logical placement to a physical side.
 *
 * The only place direction enters the algorithm: `start` and `end` swap, `top` and `bottom`
 * do not. Everything downstream works in physical terms, which is why there is no RTL
 * branch in the positioning code itself.
 */
export function resolvePlacement(
  placement: OverlayPlacement,
  direction: "ltr" | "rtl"
): PhysicalSide {
  if (direction === "rtl") {
    if (placement === "start") return "right";
    if (placement === "end") return "left";
  } else {
    if (placement === "start") return "left";
    if (placement === "end") return "right";
  }
  return placement;
}

/**
 * The logical name of a physical side, so a reported placement stays direction-agnostic.
 *
 * The direction is required, and its absence was a real bug: mapping physical `right` to
 * logical `end` regardless of direction means an RTL popover that was asked for `start`,
 * flipped onto the physical right, reports `end` — so a consumer reading the resolved
 * placement is told the opposite of what it asked for.
 */
function logicalOf(physical: PhysicalSide, direction: "ltr" | "rtl"): OverlayPlacement {
  if (physical === "left") return direction === "rtl" ? "end" : "start";
  if (physical === "right") return direction === "rtl" ? "start" : "end";
  return physical;
}

export function computeOverlayPosition({
  anchorRect,
  surfaceWidth,
  surfaceHeight,
  viewportWidth,
  viewportHeight,
  placement,
  offset,
  viewportPadding,
  align,
  direction,
}: ComputePositionOptions): PositionedOverlay {
  const requested = resolvePlacement(placement, direction);
  const opposite = resolvePlacement(OPPOSITE[placement], direction);

  const gap = offset;

  /**
   * Candidate coordinates for one physical side, as `{ top, left }`.
   *
   * Written with `left` rather than a logical start edge because the result goes straight
   * to the `left` style property of a `position: fixed` element, and `dir` does not mirror
   * that property. All the direction-dependent arithmetic happens in the two places that ask
   * for it, rather than being patched up afterwards the way `ui5-popover` has to do with
   * `getRTLCorrectionLeft()`.
   */
  const candidate = (side: PhysicalSide): { top: number; left: number } => {
    /*
     * The cross axis is implied by the side: a surface above or below its anchor is aligned
     * along the inline axis, and one beside it along the block axis. Deriving the axis rather
     * than passing it in is what makes `align` a single prop instead of UI5's two enums
     * (`PopoverVerticalAlign` and `PopoverHorizontalAlign`).
     */
    if (side === "top" || side === "bottom") {
      const top =
        side === "bottom" ? anchorRect.bottom + gap : anchorRect.top - surfaceHeight - gap;

      if (align === "center") {
        return { top, left: anchorRect.left + anchorRect.width / 2 - surfaceWidth / 2 };
      }

      /*
       * `stretch` pins the surface's inline-start edge to the anchor's, which is the
       * physical right edge in RTL. That is what makes a stretched dropdown in an RTL
       * layout line up under its trigger rather than off to the wrong side of it.
       */
      const anchorInlineStart = direction === "rtl" ? anchorRect.right : anchorRect.left;
      return { top, left: anchorInlineStart };
    }

    const left = side === "right" ? anchorRect.right + gap : anchorRect.left - surfaceWidth - gap;

    if (align === "center") {
      return { top: anchorRect.top + anchorRect.height / 2 - surfaceHeight / 2, left };
    }

    // Stretched beside the anchor: the block-start edge lines up. The block axis has no
    // direction of its own to mirror.
    return { top: anchorRect.top, left };
  };

  /** Does a candidate stay inside the viewport on both axes? */
  const fits = ({ top, left }: { top: number; left: number }): boolean =>
    top >= viewportPadding &&
    left >= viewportPadding &&
    top + surfaceHeight <= viewportHeight - viewportPadding &&
    left + surfaceWidth <= viewportWidth - viewportPadding;

  let side = requested;
  let position = candidate(requested);

  /*
   * Step 2: flip rather than shift. Only when the opposite side fits too, which is the
   * common case for a popover near a screen edge and the reason a dropdown at the bottom of
   * a short viewport opens upwards instead of being squashed.
   */
  if (!fits(position)) {
    const flipped = candidate(opposite);
    if (fits(flipped)) {
      side = opposite;
      position = flipped;
    }
  }

  /*
   * Step 3: clamp. `shifted` is reported so a consumer can tell a popover that had to move
   * from one that landed where it asked, which matters for a consumer that positions a caret
   * or a tooltip and needs to know it is no longer adjacent to the anchor.
   */
  const minLeft = viewportPadding;
  const maxLeft = Math.max(minLeft, viewportWidth - surfaceWidth - viewportPadding);
  const minTop = viewportPadding;
  const maxTop = Math.max(minTop, viewportHeight - surfaceHeight - viewportPadding);

  const clampedLeft = clamp(position.left, minLeft, maxLeft);
  const clampedTop = clamp(position.top, minTop, maxTop);
  const shifted = clampedLeft !== position.left || clampedTop !== position.top;

  /*
   * The arrow, as a percentage of the surface along its own axis.
   *
   * A surface above or below its anchor tracks the anchor's centre along the inline axis; a
   * surface beside it tracks along the block axis. The percentage is then clamped to keep the
   * arrow inside the surface's own corners, because an arrow hanging off the end points at
   * nothing.
   *
   * A zero-sized surface is not hypothetical: a surface measured in the same tick it renders
   * reports 0x0, and dividing by that yields `Infinity` or `NaN`, which reaches the `left`
   * style property and drops the arrow at an arbitrary position. An unmeasured surface gets a
   * centred arrow, which is the least surprising answer until it has a size.
   */
  let arrowStartPercent: number;
  const alongAxis = side === "top" || side === "bottom" ? surfaceWidth : surfaceHeight;

  if (alongAxis <= 0) {
    arrowStartPercent = 50;
  } else {
    const anchorCentre =
      side === "top" || side === "bottom"
        ? anchorRect.left + anchorRect.width / 2
        : anchorRect.top + anchorRect.height / 2;

    const surfaceStart = side === "top" || side === "bottom" ? clampedLeft : clampedTop;

    arrowStartPercent = ((anchorCentre - surfaceStart) / alongAxis) * 100;
  }

  // A surface narrower than twice the arrow's inset can only centre the arrow.
  const limit = 100 - ARROW_EDGE_MARGIN_PERCENT * 2;
  arrowStartPercent = clamp(arrowStartPercent, ARROW_EDGE_MARGIN_PERCENT, limit);

  return {
    top: clampedTop,
    left: clampedLeft,
    placement: logicalOf(side, direction),
    arrowStartPercent,
    shifted,
  };
}

/**
 * How far from a surface's edge the arrow may sit, as a percentage.
 *
 * Chosen so the arrow always lands on the surface rather than on its rounded corner, given
 * the arrow's own width. There is no token for the arrow's size yet because only one
 * component draws an arrow; a second would promote it to `tokens.css` under
 * `docs/foundations.md` §11 step 6.
 *
 * Declared after `computeOverlayPosition` because it is only read there, and hoisting is
 * not worth the indirection.
 */
const ARROW_EDGE_MARGIN_PERCENT = 12;
