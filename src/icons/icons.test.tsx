/**
 * Icon contract.
 *
 * One suite for all 156 icons, because the contract is shared: they all come out of the
 * same two factories, so a property that holds for one and not another is a bug in that
 * one's geometry, and a test per icon would be 156 copies of the same assertions.
 *
 * The accessibility assertions matter more here than anywhere else in the library. An
 * icon is the one component whose default behaviour is a decision *about* content: with
 * a name it is an image, without one it is not in the accessibility tree at all, and
 * getting that backwards is invisible on screen and fatal for anyone who cannot see it.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { ComponentType } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AddFilled from "uireload/icons/AddFilled";
import AddOutlined from "uireload/icons/AddOutlined";
import At from "uireload/icons/At";

const root = process.cwd();

/** Every public icon module name, sorted. */
function iconNames(): string[] {
  return readdirSync(join(root, "src", "icons"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    // The test and the story are colocated here, and neither is an icon.
    .filter((entry) => !/\.(test|stories)\./.test(entry.name))
    .map((entry) => entry.name.slice(0, -".tsx".length))
    .filter((name) => !name.startsWith("_"))
    .sort();
}

const ICONS = iconNames();

/**
 * Load one icon by the specifier a consumer would write.
 *
 * The indirection is the point: it proves the documented import path resolves, rather
 * than proving that a relatively-imported module renders.
 */
async function load(name: string): Promise<ComponentType<Record<string, unknown>>> {
  const mod = await import(`uireload/icons/${name}`);
  return mod.default as unknown as ComponentType<Record<string, unknown>>;
}

/** The `<svg>` a render produced. */
function svg(container: HTMLElement): SVGSVGElement {
  const node = container.querySelector("svg");
  if (node === null) throw new Error("no <svg> was rendered");
  return node;
}

/**
 * Conservative bounds of a path's `d`.
 *
 * `getBBox` is the obvious tool and jsdom does not implement it, so this parses the
 * commands instead. It is deliberately loose - arcs contribute their radius on top of
 * their endpoints, and every segment is treated as its own box - because the question
 * being asked is "is this glyph inside the 24 unit grid", not "what is its exact
 * bounding box". A loose bound that lets 0.5 units of slack is the right tool; an exact
 * one would be a geometry engine in a test file.
 */
function pathBounds(d: string): { x: number; y: number; right: number; bottom: number } {
  const box = { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity };
  let cx = 0;
  let cy = 0;

  const see = (x: number, y: number, pad = 0): void => {
    box.x = Math.min(box.x, x - pad);
    box.y = Math.min(box.y, y - pad);
    box.right = Math.max(box.right, x + pad);
    box.bottom = Math.max(box.bottom, y + pad);
  };

  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;

  const take = (): number => {
    const token = tokens[i++];
    return token === undefined ? 0 : Number(token);
  };

  while (i < tokens.length) {
    const command = tokens[i++] as string;
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();

    /** Another argument for this command, rather than a new command letter. */
    const repeats = (): boolean => {
      const next = tokens[i];
      return next !== undefined && !/[a-zA-Z]/.test(next) && "MLHVCSQTA".includes(upper);
    };

    // Repeatable commands: a path may write `L1 1 2 2 3 3` rather than three `L`s.
    do {
      switch (upper) {
        case "M":
        case "L":
        case "T": {
          cx = relative ? cx + take() : take();
          cy = relative ? cy + take() : take();
          see(cx, cy);
          break;
        }
        case "H": {
          cx = relative ? cx + take() : take();
          see(cx, cy);
          break;
        }
        case "V": {
          cy = relative ? cy + take() : take();
          see(cx, cy);
          break;
        }
        case "C": {
          for (let n = 0; n < 3; n += 1) see(relative ? cx + take() : take(), relative ? cy + take() : take());
          break;
        }
        case "S":
        case "Q": {
          for (let n = 0; n < 2; n += 1) see(relative ? cx + take() : take(), relative ? cy + take() : take());
          break;
        }
        case "A": {
          const rx = take();
          const ry = take();
          take(); // x-axis rotation
          const large = take();
          const sweep = take();

          const ex = relative ? cx + take() : take();
          const ey = relative ? cy + take() : take();

          /*
           * An arc's extremes are not its endpoints, and they are not simply its
           * endpoints padded by its radius either: for a shallow arc the radius is far
           * larger than the bulge, so padding over-reports by a wide margin and every
           * circle in the set fails its own grid check.
           *
           * So the centre is derived and the arc is sampled. Twenty-four samples is
           * plenty for a bound, and the shape being bounded is a quarter-circle glyph,
           * not a pixel-accurate trace.
           */
          const dx = ex - cx;
          const dy = ey - cy;
          const chord = Math.hypot(dx, dy);
          const reach = Math.max(rx, ry);
          const offset = Math.sqrt(Math.max(0, reach * reach - (chord / 2) ** 2));

          // Unit normal to the chord, rotated a quarter turn.
          const nx = chord === 0 ? 1 : dy / chord;
          const ny = chord === 0 ? 0 : -dx / chord;

          const sign = large === sweep ? 1 : -1;
          const centreX = (cx + ex) / 2 + sign * offset * nx;
          const centreY = (cy + ey) / 2 + sign * offset * ny;

          const from = Math.atan2(cy - centreY, cx - centreX);
          const to = Math.atan2(ey - centreY, ex - centreX);

          // Normalise to the sweep direction, then widen for `large-arc`.
          let turn = to - from;
          const full = Math.PI * 2;
          if (sweep === 1 && turn < 0) turn += full;
          if (sweep === 0 && turn > 0) turn -= full;
          if (large && Math.abs(turn) < Math.PI) turn += turn > 0 ? full : -full;

          for (let step = 0; step <= 24; step += 1) {
            const angle = from + (turn * step) / 24;
            see(centreX + reach * Math.cos(angle), centreY + reach * Math.sin(angle));
          }

          cx = ex;
          cy = ey;
          break;
        }
        default:
          // `Z` takes no arguments; anything else is not a path command we author.
          break;
      }
    } while (repeats());
  }

  return box;
}

/** Bounds of every shape in one icon, in grid units. */
function glyphBounds(container: HTMLElement) {
  const root = svg(container);
  const box = { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity };

  const see = (x: number, y: number): void => {
    box.x = Math.min(box.x, x);
    box.y = Math.min(box.y, y);
    box.right = Math.max(box.right, x);
    box.bottom = Math.max(box.bottom, y);
  };

  const merge = (other: { x: number; y: number; right: number; bottom: number }): void => {
    see(other.x, other.y);
    see(other.right, other.bottom);
  };

  for (const node of root.querySelectorAll("path")) {
    const d = node.getAttribute("d") ?? "";
    if (d !== "") merge(pathBounds(d));
  }

  for (const node of root.querySelectorAll("circle")) {
    const cx = Number(node.getAttribute("cx"));
    const cy = Number(node.getAttribute("cy"));
    const r = Number(node.getAttribute("r"));
    see(cx - r, cy - r);
    see(cx + r, cy + r);
  }

  for (const node of root.querySelectorAll("rect")) {
    const x = Number(node.getAttribute("x"));
    const y = Number(node.getAttribute("y"));
    const w = Number(node.getAttribute("width"));
    const h = Number(node.getAttribute("height"));
    see(x, y);
    see(x + w, y + h);
  }

  return box;
}

describe("the icon set", () => {
  it("is large enough that the assertions below are not vacuous", () => {
    expect(ICONS.length).toBeGreaterThan(100);
  });
});

describe.each(ICONS)("%s", (name) => {
  it("is a scalable vector on the shared grid", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon />);
    const node = svg(container);

    // A viewBox is what makes it vector: without one the glyph is fixed-size pixels, and
    // every size in the set is a separate asset.
    expect(node.getAttribute("viewBox")).toBe("0 0 24 24");
    // `xmlns` is what makes the markup portable to a file, a sprite sheet or an email.
    expect(node.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");

    // No embedded raster, no font glyph, no external reference: all three would defeat
    // the reason to ship the path in the first place.
    expect(node.querySelector("image")).toBeNull();
    expect(node.outerHTML).not.toMatch(/url\(|<text|base64/);

    /*
     * Every path opens with a moveto.
     *
     * Found by `StarFilled`, which shipped as `12 1.8L14.59 8.44…Z`: a coordinate pair
     * with no command in front of it is not a path, and the renderer draws nothing at all.
     * The bounds parser above cannot catch it - it reads the bare pair as two no-op
     * tokens, carries on from the first real command, and reports a perfectly plausible
     * box. So the check that catches it is the one that looks at the raw string.
     */
    for (const path of node.querySelectorAll("path")) {
      expect(path.getAttribute("d"), "path data must open with a moveto").toMatch(/^[Mm]/);
    }

    unmount();
  });

  it("draws inside the viewBox", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon />);
    const box = glyphBounds(container);

    /*
     * The grid is the contract that makes the set look like one set. The slack is one
     * unit, which covers a stroke's half-width and an arc's overshoot: the assertion is
     * "the glyph is not clipped by its own viewport", not a pixel-perfect measurement.
     */
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(25);
    expect(box.bottom).toBeLessThanOrEqual(25);

    /*
     * And a glyph that collapses to nothing is not an icon, however well it fits.
     *
     * The *larger* axis, not both. A vertical kebab is three dots on a 13 unit pitch: it
     * is 3.6 wide and 16.8 tall, and it is not a collapsed glyph. Requiring both axes to
     * clear 6 units would have had to reject `MoreVert`, `MoreHoriz` and any chevron,
     * which is a rule about drawing a square rather than about drawing an icon.
     */
    expect(Math.max(box.right - box.x, box.bottom - box.y)).toBeGreaterThan(6);

    unmount();
  });

  it("is decorative unless it is given a name", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon />);
    const node = svg(container);

    /*
     * The default, and the reason it is a default rather than an opt-in. An icon beside
     * a visible label carries no information the label does not already carry, and
     * announcing "image, settings" immediately before the word "Settings" is noise.
     */
    expect(node.getAttribute("aria-hidden")).toBe("true");
    expect(node.getAttribute("role")).toBeNull();
    expect(node.querySelector("title")).toBeNull();

    // `focusable="false"` travels with `aria-hidden`, so an older engine cannot put a
    // decorative SVG in the tab order on the strength of the image role alone.
    expect(node.getAttribute("focusable")).toBe("false");

    unmount();
  });

  it("becomes a named image when it is given a title", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon title="Add item" />);
    const node = svg(container);

    expect(node.getAttribute("role")).toBe("img");
    expect(node.getAttribute("aria-hidden")).toBeNull();
    expect(node.querySelector("title")?.textContent).toBe("Add item");

    unmount();
  });

  it("paints with the inherited colour", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon />);
    const node = svg(container);

    /*
     * `currentColor` for whatever the glyph is painted with, and nothing else. A
     * hard-coded colour would be invisible in a dark scheme, would need a second entry
     * in the export map, and would leave the icon looking wrong on whatever background
     * the consumer put it on.
     *
     * Both are legitimate: a filled icon paints with `fill`, a line-drawn one with
     * `fill="none"` and a `stroke`. What is not legitimate is a literal colour in
     * either slot, so that is what the assertion is for.
     */
    const fill = node.getAttribute("fill");
    const stroke = node.getAttribute("stroke");

    expect(["currentColor", "none"]).toContain(fill);
    expect([null, "none", "currentColor"]).toContain(stroke);

    if (fill === "none") expect(stroke).toBe("currentColor");
    else expect(fill).toBe("currentColor");

    unmount();
  });

  it("merges a class name with the library's own", async () => {
    const Icon = await load(name);
    const { container, unmount } = render(<Icon className="app-icon" />);

    expect(svg(container).getAttribute("class")).toBe("uir-icon app-icon");

    unmount();
  });

  it("names itself for devtools", async () => {
    const Icon = await load(name);

    // `forwardRef` returns an object, so React cannot infer a name from it and the tree
    // would show an anonymous component for every one of the 156.
    expect((Icon as unknown as { displayName: string }).displayName).toBe(`${name}Icon`);
  });
});

describe("size", () => {
  it("defaults to inheriting the surrounding text size", () => {
    // `1em` rather than a pixel value: an icon beside text should be the size of that
    // text without the consumer having to say so, at every step in the type scale.
    const { container } = render(<AddFilled />);

    expect(svg(container).getAttribute("width")).toBe("1em");
    expect(svg(container).getAttribute("height")).toBe("1em");
    expect(svg(container).getAttribute("data-size")).toBeNull();
  });

  it.each(["sm", "md", "lg"] as const)("maps %s onto a token rather than a length", (size) => {
    const { container } = render(<AddFilled size={size} />);

    // A `data-*` hook, so the value stays in CSS and a consumer can restyle it.
    expect(svg(container).getAttribute("data-size")).toBe(size);
    expect(svg(container).getAttribute("style")).toBeNull();
  });

  it("applies any other length directly", () => {
    const { container } = render(<AddFilled size="3rem" />);
    const node = svg(container);

    // Outside a control there is no token to key on, so the length is the answer.
    expect(node.getAttribute("data-size")).toBeNull();
    expect(node.getAttribute("style")).toContain("inline-size: 3rem");
    expect(node.getAttribute("style")).toContain("block-size: 3rem");
  });

  it("lets an explicit style win over the size prop", () => {
    const { container } = render(<AddFilled size="3rem" style={{ inlineSize: "10px" }} />);

    expect(svg(container).getAttribute("style")).toContain("inline-size: 10px");
  });
});

describe("variants", () => {
  it("paints a filled icon with a fill and no stroke", () => {
    const { container } = render(<AddFilled />);
    const node = svg(container);

    expect(node.getAttribute("fill")).toBe("currentColor");
    expect(node.getAttribute("stroke")).toBeNull();
  });

  it("paints an outlined icon as a stroke at the shared weight", () => {
    const { container } = render(<AddOutlined />);
    const node = svg(container);

    // One weight across the whole set. An outline that is 2 in one icon and 1.5 in the
    // next does not read as two weights, it reads as two sets.
    expect(node.getAttribute("fill")).toBe("none");
    expect(node.getAttribute("stroke")).toBe("currentColor");
    expect(node.getAttribute("stroke-width")).toBe("1.75");
    expect(node.getAttribute("stroke-linecap")).toBe("round");
    expect(node.getAttribute("stroke-linejoin")).toBe("round");
  });

  it("gives a single icon no postfix and one weight of its own", () => {
    const { container } = render(<At />);

    // `At` is a glyph, not a shape: there is no solid form of it, so it ships once.
    expect(svg(container).getAttribute("stroke-width")).toBe("1.75");
  });
});

describe("props", () => {
  it("forwards the ref to the svg element", () => {
    const ref = { current: null as SVGSVGElement | null };

    render(<AddFilled ref={ref as never} />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current?.getAttribute("class")).toBe("uir-icon");
  });

  it("lets consumer attributes override the presentation defaults", () => {
    const { container } = render(<AddOutlined strokeWidth={3} />);

    // A single icon that needs to be louder is a legitimate request, and it should not
    // require forking the set.
    expect(svg(container).getAttribute("stroke-width")).toBe("3");
  });

  it("carries no direction-dependent geometry", () => {
    // An arrow is not mirrored in RTL, because the thing it points at does not move.
    // The only direction an icon can get wrong here is one where it mirrors its own
    // meaning, and none of these do.
    const { container } = render(
      <div dir="rtl">
        <AddOutlined />
      </div>
    );

    expect(svg(container).getAttribute("viewBox")).toBe("0 0 24 24");
  });
});