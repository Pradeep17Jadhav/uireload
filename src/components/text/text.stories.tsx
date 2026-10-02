/**
 * Text stories.
 *
 * The states that matter are the levels and the tones — and the fact that a heading renders a real
 * heading element, which is what the "Outline" story demonstrates by letting a reader navigate it.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "uireload/components/text";

const meta = {
  title: "Components/Text",
  component: Text,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["body", "h1", "h2", "h3", "h4", "h5", "h6"] },
    tone: { control: "inline-radio", options: ["inherit", "default", "muted", "subtle"] },
    align: { control: "inline-radio", options: ["start", "center", "end", "justify"] },
    measure: { control: "inline-radio", options: ["none", "short", "long"] },
    noWrap: { control: "boolean" },
    overline: { control: "boolean" },
    gutterBottom: { control: "boolean" },
    as: { control: "text", description: "Escape hatch. Changes the element, not the styling." },
  },
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
    variant: "body",
    tone: "inherit",
    align: "start",
    measure: "none",
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * A `<p>` reading `--uir-font-size` and `--uir-line-height`, both of which vary by colour scheme.
 */
export const Default: Story = {};

/**
 * Every heading level.
 *
 * Each renders the element of the same name, so the visual hierarchy and the document outline are one
 * fact rather than two that can disagree. Try navigating this story by heading: what a screen reader
 * offers is exactly what is on screen.
 */
export const Scale: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((variant) => (
        <Text key={variant} variant={variant}>
          {variant} — the quick brown fox
        </Text>
      ))}
      <Text>The quick brown fox jumps over the lazy dog.</Text>
    </div>
  ),
};

/** Every semantic tone. `inherit` is the default and the only one that defers to the context. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["inherit", "default", "muted", "subtle"] as const).map((tone) => (
        <Text key={tone} {...args} tone={tone}>
          {tone} — the quick brown fox jumps over the lazy dog.
        </Text>
      ))}
    </div>
  ),
};

/**
 * A document outline, in the order a heading-navigating reader would meet it.
 *
 * This is the story that proves the component: the nesting below is real HTML nesting, not a visual
 * arrangement.
 */
export const Outline: Story = {
  render: () => (
    <article style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Text variant="h1">Release notes</Text>
      <Text tone="muted">
        What changed, and what to do about it. Use your screen reader&apos;s heading list to
        navigate this page.
      </Text>

      <Text variant="h2">Breaking changes</Text>
      <Text>
        Anything removed or renamed goes here first. A consumer reading only this section should
        know whether they need to change code.
      </Text>

      <Text variant="h3">Renamed props</Text>
      <Text>Each entry names the old prop, the new one, and the version that changed it.</Text>

      <Text variant="h3">Removed exports</Text>
      <Text>Anything no longer exported, with the replacement if there is one.</Text>

      <Text variant="h2">Additions</Text>
      <Text>New components and new props, in no particular order.</Text>

      <Text variant="h4">Notes on the type scale</Text>
      <Text>
        Sizes are literals rather than tokens: a heading scale is a fixed relationship between six
        sizes, and expressing it as six tokens would add indirection with nothing to configure.
      </Text>
    </article>
  ),
};

/**
 * The measure cap.
 *
 * `ch`, not pixels — the readability of a line is a function of how many characters it holds, so a
 * pixel cap means a different character count at every font size, and again in every language.
 */
export const Measure: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["none", "long", "short"] as const).map((measure) => (
        <div key={measure}>
          <Text variant="h4" gutterBottom>
            {measure}
          </Text>
          <Text {...args} measure={measure}>
            The quick brown fox jumps over the lazy dog, and then it does the same thing again for a
            while, because a paragraph has to be long enough to show what a measure cap actually
            does to it.
          </Text>
        </div>
      ))}
    </div>
  ),
};

/** One line, truncated. No `title` is set — see the README. */
export const Truncated: Story = {
  args: { noWrap: true },
  render: (args) => (
    <div style={{ maxWidth: "14rem", display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Text {...args} variant="h4">
        A heading far longer than its container
      </Text>
      <Text {...args}>Body text far longer than its container, on one line.</Text>
    </div>
  ),
};

/** An overline above a heading — the label / heading pair. */
export const Overline: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <div>
        <Text {...args} overline>
          Section
        </Text>
        <Text variant="h2">How it works</Text>
      </div>
      <div>
        <Text {...args} overline variant="h3">
          Note
        </Text>
        <Text tone="muted">
          The overline reduces the size on a heading too. Uppercase 24px with 0.08em of tracking is
          neither small nor readable.
        </Text>
      </div>
    </div>
  ),
};

/** Every alignment. Logical, so all of them mirror correctly in RTL. */
export const Alignments: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["start", "center", "end", "justify"] as const).map((align) => (
        <div key={align}>
          <Text variant="h4" gutterBottom>
            {align}
          </Text>
          <Text {...args} align={align}>
            The quick brown fox jumps over the lazy dog, and the sentence keeps going for a little
            longer so that justify has something to justify.
          </Text>
        </div>
      ))}
    </div>
  ),
};

/**
 * The `as` escape hatch.
 *
 * Changes the element without changing the styling. Used for a heading inside a `summary`, for a
 * heading whose real rank must differ from its visual level, or for a `span` of text inside a heading.
 */
export const CustomElement: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Text variant="h2" as="div">
        A div that looks like an h2
      </Text>
      <Text variant="h2" as="h4">
        A visual h2 that is really an h4
      </Text>
      <details>
        <summary>
          <Text variant="h3" as="span">
            A heading inside a summary
          </Text>
        </summary>
        <Text tone="muted">
          `as` is what makes this possible: the heading cannot be a child of summary.
        </Text>
      </details>
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: () => (
    <article style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Text variant="h1">ملاحظات الإصدار</Text>
      <Text tone="muted">ما الذي تغيّر، وما الذي يجب عليك فعله.</Text>
      <Text variant="h2"> تغييرات كاسرة</Text>
      <Text>أُزيل كل ما كان م removido. اقرأ هذا القسم أولاً.</Text>
    </article>
  ),
};
