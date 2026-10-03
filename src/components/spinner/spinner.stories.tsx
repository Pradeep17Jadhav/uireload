/**
 * Spinner stories.
 *
 * The state that matters most is not a visual one: it is whether the spinner has a `label`, because that
 * decides whether it reaches the accessibility tree at all. Both forms are shown side by side so the
 * difference is a prop, not a mystery.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Spinner } from "uireload/components/spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    thickness: { control: "inline-radio", options: ["thin", "md", "thick"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    label: { control: "text" },
  },
  args: { size: "md", thickness: "md", tone: "accent" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The decorative form — no `label`.
 *
 * `aria-hidden`, because the text beside it already says what is happening and a second announcement of
 * the same fact is noise. This is the form to reach for by default.
 */
export const Default: Story = {};

/**
 * The labelled form.
 *
 * `role="progressbar"` with `aria-label` and **no** `aria-valuenow`, which is the specified indeterminate
 * form of the role. For a spinner that is the only thing on screen saying work is in flight.
 */
export const Labelled: Story = {
  args: { label: "Loading your projects" },
  render: (args) => (
    <div
      style={{ display: "grid", gap: "var(--uir-space)", justifyItems: "center", padding: "2rem" }}
    >
      <Spinner {...args} />
      <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>
        Fetching your projects&hellip;
      </span>
    </div>
  ),
};

/**
 * Both forms side by side, and the whole design in one picture.
 *
 * Same component, same pixels — the only difference is one prop, and it changes what a screen reader
 * says. Left: beside text that already explains, so hidden. Right: alone, so it has to speak for itself.
 */
export const DecorativeVersusLabelled: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space-xl)",
        gridTemplateColumns: "auto auto",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ display: "grid", gap: "0.5rem", justifyItems: "center" }}>
        <Spinner {...args} />
        <code style={{ color: "var(--uir-text-muted)" }}>no label</code>
        <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>aria-hidden</span>
      </div>
      <div style={{ display: "grid", gap: "0.5rem", justifyItems: "center" }}>
        <Spinner {...args} label="Loading" />
        <code style={{ color: "var(--uir-text-muted)" }}>label=&quot;Loading&quot;</code>
        <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>progressbar</span>
      </div>
    </div>
  ),
};

/** Beside a control, which is the case that decides whether `sm` has to exist at all. */
export const Inline: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}>
        <Spinner {...args} size="sm" />
        <span>Saving changes&hellip;</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}>
        <Spinner {...args} />
        <span>Uploading 3 of 6 files&hellip;</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}>
        <Spinner {...args} size="lg" />
        <span>Rebuilding the index&hellip;</span>
      </div>
    </div>
  ),
};

/**
 * Every size.
 *
 * The arc's gap has to stay open at `sm`. A fixed ring width closes it as the diameter shrinks until the
 * ring reads as a solid disc, which is why thickness is a fraction of the diameter here.
 */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space-xl)", padding: "2rem" }}
    >
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} style={{ display: "grid", gap: "0.5rem", justifyItems: "center" }}>
          <Spinner {...args} size={size} />
          <code style={{ color: "var(--uir-text-muted)" }}>{size}</code>
        </div>
      ))}
    </div>
  ),
};

/** Every thickness at every size — the combination most likely to close the gap. */
export const Thickness: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space-lg)", padding: "2rem" }}>
      {(["thin", "md", "thick"] as const).map((thickness) => (
        <div
          key={thickness}
          style={{ display: "flex", alignItems: "center", gap: "var(--uir-space-xl)" }}
        >
          <code style={{ color: "var(--uir-text-muted)", inlineSize: "4rem" }}>{thickness}</code>
          {(["sm", "md", "lg"] as const).map((size) => (
            <Spinner key={size} {...args} size={size} thickness={thickness} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Every tone. `neutral` is the one for a spinner where a coloured one would read as a status. */
export const Tones: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space-xl)", padding: "2rem" }}
    >
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone} style={{ display: "grid", gap: "0.5rem", justifyItems: "center" }}>
          <Spinner {...args} tone={tone} />
          <code style={{ color: "var(--uir-text-muted)" }}>{tone}</code>
        </div>
      ))}
    </div>
  ),
};

/**
 * In a card, which is where a spinner usually ends up.
 *
 * A spinner centred in a region whose height is set by content it does not affect is a spinner that jumps.
 * The reserved box is the caller's job, not this component's.
 */
export const InACard: Story = {
  render: (args) => (
    <div
      style={{
        border: "1px solid var(--uir-border)",
        borderRadius: "var(--uir-radius-lg)",
        display: "grid",
        gap: "var(--uir-space)",
        justifyItems: "center",
        maxWidth: "24rem",
        padding: "3rem 2rem",
      }}
    >
      <Spinner {...args} size="lg" />
      <span style={{ color: "var(--uir-text-muted)" }}>Fetching your projects&hellip;</span>
    </div>
  ),
};

/**
 * RTL and high contrast.
 *
 * The ring is drawn with `currentcolor` and no SVG, so it is already correct in both — this story exists
 * to show that, not to fix anything.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space-xl)",
        justifyItems: "center",
        padding: "2rem",
      }}
    >
      <Spinner {...args} size="lg" />
      <Spinner {...args} label="جارٍ تحميل المشاريع" />
      <Spinner {...args} size="lg" tone="positive" />
    </div>
  ),
};
