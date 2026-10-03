/**
 * Shared icon machinery. Private.
 *
 * The `_` prefix keeps this module out of the export map, the entry-point list and the
 * published surface, which is the same signal `_template` uses in `src/components`.
 * Every icon module is one call to one of the two factories below, so all of
 * them share one accessibility contract, one sizing contract and one class name and
 * cannot drift apart.
 */

import { forwardRef } from "react";
import type { CSSProperties, ReactNode, Ref, SVGProps } from "react";
import { isSize } from "../foundations";
import type { Size } from "../types";

/*
 * Imported from the module rather than from `src/internal`.
 *
 * The barrel is right for components, which need most of it. An icon needs one
 * twenty-line function, and going through the barrel drags the focus trap, the overlay
 * positioning maths and the scroll lock into every icon's chunk - fifteen kilobytes a
 * consumer of a single glyph never runs.
 */
import { cx } from "../internal/classnames";

/**
 * Size.
 *
 * The three token names resolve to `--uir-icon-size-*`, so an icon in a control matches
 * the control it sits in. Any other string is a CSS length and is applied directly, which
 * is what makes an icon usable outside a control - in prose, in a gallery, at 3rem.
 *
 * Omitted entirely means `1em`, so an icon beside text is the size of that text without
 * the consumer having to say so.
 */
export type IconSize = Size | (string & {});

export interface IconOwnProps {
  /**
   * Size: `sm` | `md` | `lg` for the shared icon tokens, or any CSS length.
   *
   * @default "1em"
   */
  size?: IconSize | undefined;

  /**
   * Accessible name.
   *
   * Supplying it makes the icon an image with a name (`role="img"` plus a `<title>`).
   * Omitting it makes the icon decorative, which is what an icon beside a visible label
   * almost always is: a screen reader announcing "image, settings" immediately before the
   * word "Settings" is noise, not information.
   *
   * A decorative icon is removed from the accessibility tree entirely. An icon that is
   * the only content of a control is not decorative and needs this, or `aria-label` on
   * the control around it.
   */
  title?: string | undefined;

  /** Merged onto the `<svg>`. */
  className?: string | undefined;

  /** Inline styles for the `<svg>`. `size` is merged in first, so this wins. */
  style?: CSSProperties | undefined;

  /** Forwarded to the `<svg>` element. */
  ref?: Ref<SVGSVGElement> | undefined;
}

export type IconProps = IconOwnProps &
  Omit<SVGProps<SVGSVGElement>, keyof IconOwnProps | "children">;

/**
 * Presentation attributes a single icon overrides.
 *
 * Most icons need none. A glyph whose only honest form is a stroke - a paperclip, a
 * Bluetooth rune, a lightning bolt - overrides `fill` and `strokeWidth` instead of being
 * redrawn as a silhouette, because a silhouette of one of those marks is not a better
 * icon, it is a worse one.
 */
export interface IconTuning {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "bevel" | "miter";
}

/** Every icon is drawn on this grid, so the set shares one optical scale. */
const VIEW_BOX = "0 0 24 24";

/** Stroke weight for a line-drawn glyph. */
const LINE_WEIGHT = 1.75;

/** Stroke weight for the `Filled` form of a glyph that has no solid form. */
const HEAVY_WEIGHT = 2.6;

function createIcon(name: string, children: ReactNode, tuning: IconTuning) {
  const { fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin } = tuning;

  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size, title, className, style, ...rest },
    ref
  ) {
    /*
     * A named icon is an image; an unnamed one is decoration.
     *
     * Both halves are set together and cannot be set independently on purpose: a
     * `role="img"` with no name is announced as an unlabelled image, which is the one
     * outcome worse than either alternative.
     */
    const named = title !== undefined && title !== "";

    /*
     * A token size is a `data-*` hook so the value lives in CSS and stays overridable;
     * a raw length has no token to key on and becomes an inline size.
     */
    const token = isSize(size) ? size : undefined;
    const length = token === undefined && size !== undefined ? size : undefined;

    const fromSize: CSSProperties | undefined =
      length === undefined ? undefined : { inlineSize: length, blockSize: length };

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={VIEW_BOX}
        width="1em"
        height="1em"
        /*
         * `focusable="false"` alongside `aria-hidden` so an older engine cannot put a
         * decorative SVG in the tab order on the strength of the image role alone. It is
         * ignored by current engines, which is why it can stay.
         */
        focusable="false"
        role={named ? "img" : undefined}
        aria-hidden={named ? undefined : true}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        /*
         * Consumer attributes land last so `fill`, `stroke` and `strokeWidth` on an
         * individual icon can be overridden without a fork of the set.
         */
        {...rest}
        ref={ref}
        className={cx("uir-icon", className)}
        style={fromSize === undefined ? style : { ...fromSize, ...style }}
        data-size={token}
      >
        {named ? <title>{title}</title> : null}
        {children}
      </svg>
    );
  });

  Icon.displayName = `${name}Icon`;

  return Icon;
}

/**
 * A `Filled` icon.
 *
 * Solid geometry wherever a solid form reads. The default is `fill: currentColor` with no
 * stroke, so a filled icon picks up the colour of whatever it sits in, in both schemes,
 * without knowing about either.
 */
export function filledIcon(name: string, children: ReactNode, tuning: IconTuning = {}) {
  return createIcon(name, children, { fill: "currentColor", ...tuning });
}

/**
 * An `Outlined` icon.
 *
 * A 1.75 stroke with round caps and joins. The weight is the same everywhere in the set,
 * because an outline that is 2 in one icon and 1.5 in the next does not read as two
 * weights, it reads as two sets.
 */
export function outlinedIcon(name: string, children: ReactNode, tuning: IconTuning = {}) {
  return createIcon(name, children, {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: LINE_WEIGHT,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...tuning,
  });
}

/**
 * A `Filled` form for a glyph that is a mark rather than a shape.
 *
 * Same construction as {@link outlinedIcon}, at the heavier weight. Exported so the
 * heavier weight is named once rather than spelled as a literal in every icon that needs
 * it.
 */
export function heavyIcon(name: string, children: ReactNode, tuning: IconTuning = {}) {
  return createIcon(name, children, {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: HEAVY_WEIGHT,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...tuning,
  });
}
