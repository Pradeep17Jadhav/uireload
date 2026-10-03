/**
 * Skeleton stories.
 *
 * The states that matter are the variants, because a skeleton shaped unlike what it replaces is
 * worse than no skeleton: the page jumps when the content arrives, which is the reflow the component
 * exists to prevent.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Skeleton } from "uireload/components/skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "fullWidth" },
  argTypes: {
    variant: { control: "inline-radio", options: ["text", "rounded", "circular"] },
    animate: { control: "boolean" },
    lines: { control: { type: "number", min: 0, max: 10 } },
  },
  args: { variant: "text", animate: true, lines: 1 },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A single line of prose.
 *
 * `role="status"` with `aria-busy="true"`, named "Loading". Every bar is `aria-hidden` — the whole
 * point, because a screen reader describing four grey rectangles has told the user nothing.
 */
export const Default: Story = {};

/**
 * Multiple lines.
 *
 * Only the **last** line is shortened, because a paragraph's last line is short and four equal bars
 * read as four separate items rather than one block of text.
 */
export const Multiline: Story = {
  args: { lines: 5 },
};

/** A block. For an image, a card, or anything that is not prose. */
export const Rounded: Story = {
  args: { variant: "rounded", width: "100%", height: 160 },
};

/** A dot. For an avatar or an icon. */
export const Circular: Story = {
  args: { variant: "circular", width: 48, height: 48 },
};

/**
 * Every variant together, which is the story that shows the shapes are distinguishable at a glance.
 *
 * They have to be: a consumer choosing between them is choosing what the page looks like before the
 * data arrives.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["text", "rounded", "circular"] as const).map((variant) => (
        <div
          key={variant}
          style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}
        >
          <code style={{ inlineSize: "6rem" }}>{variant}</code>
          <Skeleton
            {...args}
            variant={variant}
            lines={variant === "text" ? 3 : undefined}
            width={variant === "text" ? "100%" : 64}
            height={variant === "text" ? undefined : 64}
          />
        </div>
      ))}
    </div>
  ),
};

/**
 * A loading card.
 *
 * The realistic composition: a circular avatar beside lines of text, so the placeholder occupies
 * exactly the box the loaded content will.
 */
export const Card: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "48px 1fr",
        maxWidth: "24rem",
        padding: "2rem",
      }}
    >
      <Skeleton {...args} variant="circular" width={48} height={48} />
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <Skeleton {...args} lines={1} width="60%" />
        <Skeleton {...args} lines={3} />
      </div>
    </div>
  ),
};

/** A loading table, where the row rhythm matters more than any single placeholder. */
export const Table: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "36rem" }}>
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          style={{
            display: "grid",
            gap: "var(--uir-space)",
            gridTemplateColumns: "1fr 1fr 80px",
            alignItems: "center",
          }}
        >
          <Skeleton {...args} lines={1} />
          <Skeleton {...args} lines={1} />
          <Skeleton {...args} variant="rounded" width={80} height={24} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Not animating.
 *
 * For content that arrives once and stays — a page load, a first paint — a shimmer that keeps
 * pulsing after the data is already visible is noise.
 */
export const Static: Story = {
  args: { animate: false, lines: 4 },
};

/**
 * A custom label.
 *
 * "Loading" alone is a shrug. "Loading your projects" tells the user what they are waiting for, which
 * is the question they actually have.
 */
export const CustomLabel: Story = {
  args: { label: "Loading your projects", lines: 3 },
};

/** Every variant in every size of placeholder, for spotting rhythm problems at a glance. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {[32, 48, 64, 96].map((size) => (
        <div key={size} style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}>
          <code style={{ inlineSize: "4rem" }}>{`${size}px`}</code>
          <Skeleton {...args} variant="circular" width={size} height={size} />
          <Skeleton {...args} variant="rounded" width={size} height={size} />
        </div>
      ))}
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "24rem" }}>
      <Skeleton {...args} label="جارٍ تحميل المشاريع" lines={4} />
      <Skeleton {...args} variant="circular" width={48} height={48} />
      <Skeleton {...args} variant="rounded" width="100%" height={120} animate={false} />
    </div>
  ),
};
