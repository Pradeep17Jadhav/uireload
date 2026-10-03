/**
 * The icon set, as a gallery.
 *
 * One story rather than 156, because the question a reviewer is answering is not "is
 * `AddFilled` correct" - the unit tests answer that - it is "does this set look like one
 * set". That is a question about the grid, the weights and the optical sizes across a
 * whole shelf, and it can only be read by looking at the whole shelf.
 *
 * No stylesheet is imported: `.storybook/preview.tsx` loads the assembled
 * `dist/index.css`, so what this renders is what a consumer gets.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { SIZES } from "../foundations";
import { ICON_NAMES, ICON_SET } from "./_set";
import type { IconSize } from "./_create-icon";

const meta = {
  title: "Icons/Gallery",
  parameters: {
    docs: {
      description: {
        component:
          "Every icon is a vector on a shared 24 unit grid, sized in `em` so it matches the text " +
          "beside it. Supply `title` to give one an accessible name; omit it and it is " +
          "decorative, which is what an icon beside a visible label almost always is.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** One icon in a cell, with its module name underneath. */
function cell(name: keyof typeof ICON_SET, size: IconSize) {
  const Icon = ICON_SET[name];
  if (Icon === undefined) return null;

  return (
    <figure style={{ margin: 0, width: "5.75rem", textAlign: "center" }}>
      <Icon size={size} />
      <figcaption style={{ fontSize: "0.625rem", opacity: 0.55, marginTop: "0.35rem" }}>{name}</figcaption>
    </figure>
  );
}

/** The whole shelf, at each token size in turn. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {SIZES.map((size) => (
        <section key={size}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", opacity: 0.6 }}>
            size=&quot;{size}&quot;
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
            {ICON_NAMES.map((name) => (
              <div key={name}>{cell(name, size)}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

/**
 * Decorative and named, side by side.
 *
 * The left row is what ships by default and appears in no accessibility tree; the right
 * is the same glyphs with a name. Both look identical, which is the intended outcome -
 * being nameable should cost nothing visually.
 */
export const AccessibleNames: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "max-content max-content" }}>
      <div style={{ display: "flex", gap: "1.25rem" }}>
        <ICON_SET.AddFilled size="lg" />
        <ICON_SET.AlertOutlined size="lg" />
        <ICON_SET.CheckedFilled size="lg" />
      </div>
      <div style={{ display: "flex", gap: "1.25rem" }}>
        <ICON_SET.AddFilled size="lg" title="Add item" />
        <ICON_SET.AlertOutlined size="lg" title="Warning" />
        <ICON_SET.CheckedFilled size="lg" title="Done" />
      </div>
    </div>
  ),
};

/**
 * At a size no control uses.
 *
 * The grid check is not the same as the scaling check: a glyph can sit inside its 24 unit
 * box and still fall apart at 64px, where a one-unit stroke is visible as a step.
 */
export const Large: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      <ICON_SET.AddFilled size="4rem" />
      <ICON_SET.AlertOutlined size="4rem" />
      <ICON_SET.At size="4rem" />
      <ICON_SET.CircleOutlined size="4rem" />
      <ICON_SET.BugFilled size="4rem" />
    </div>
  ),
};

/**
 * In both schemes.
 *
 * An icon paints with `currentColor` and nothing else, so the only thing that can go
 * wrong in a dark scheme is a literal colour somewhere in the set. This is where that
 * shows up.
 */
export const Schemes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {ICON_NAMES.map((name) => {
          const Icon = ICON_SET[name];
          return Icon === undefined ? null : <Icon key={name} size="lg" />;
        })}
      </div>
      <div data-uir-scheme="dark" style={{ background: "#16181d", color: "#eef0f4", padding: "1rem", display: "flex", gap: "0.75rem" }}>
        {ICON_NAMES.map((name) => {
          const Icon = ICON_SET[name];
          return Icon === undefined ? null : <Icon key={name} size="lg" />;
        })}
      </div>
    </div>
  ),
};