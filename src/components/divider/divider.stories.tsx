/**
 * Divider stories.
 *
 * The states that matter are the two a screenshot cannot tell apart: a decorative divider and a
 * semantic one render identically and are announced completely differently.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Divider } from "uireload/components/divider";

const meta = {
  title: "Components/Divider",
  component: Divider,
  parameters: { layout: "fullWidth" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    weight: { control: "inline-radio", options: ["thin", "thick"] },
    decorative: { control: "boolean" },
  },
  args: {
    orientation: "horizontal",
    weight: "thin",
    decorative: false,
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A plain horizontal rule.
 *
 * `role="separator"` and nothing else. `aria-orientation` is *absent* rather than set to
 * "horizontal", because that is the default and stating it is redundant markup on every rule in an
 * app.
 */
export const Default: Story = {};

/**
 * A decorative rule.
 *
 * `role="presentation"`, not `aria-hidden` — `aria-hidden` still lets some screen readers announce a
 * hidden element when focus lands inside it, and the role-based way to remove decoration is to say
 * it has no role at all. Visually identical to `Default`.
 */
export const Decorative: Story = {
  args: { decorative: true },
};

/**
 * A labelled rule.
 *
 * `role="separator"` is a **structure** role, and structure roles do not take their name from their
 * contents. The label therefore has to be stated as an `aria-label` explicitly — the text inside the
 * rule is not its accessible name, however obviously it looks like one.
 */
export const Labelled: Story = {
  args: { label: "or continue with" },
};

/** A vertical rule between side-by-side items — the second most common case after `Default`. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)", padding: "2rem" }}
    >
      <span>Home</span>
      <Divider {...args} />
      <span>Docs</span>
      <Divider {...args} />
      <span>About</span>
    </div>
  ),
};

/**
 * A labelled rule forced horizontal.
 *
 * The types forbid `orientation="vertical"` with a label, and the component coerces rather than
 * throwing: a consumer who flips `orientation` while a label is present gets a usable rule. The
 * coercion is silent, so this story exists to show where it happens.
 */
export const LabelledForcesHorizontal: Story = {
  args: { orientation: "vertical", label: "or" },
  render: (args) => (
    <div style={{ padding: "2rem", inlineSize: "20rem" }}>
      <Divider {...args} />
    </div>
  ),
};

/** Thick. Reserved for a division that carries meaning, not for a panel edge. */
export const Thick: Story = {
  args: { weight: "thick" },
};

/** Every combination of the three props, which is the whole surface. */
export const Matrix: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["thin", "thick"] as const).map((weight) =>
        (["horizontal", "vertical"] as const).map((orientation) => (
          <div key={`${orientation}-${weight}`} style={{ display: "flex", gap: "1rem" }}>
            <code style={{ inlineSize: "10rem" }}>{`${orientation} / ${weight}`}</code>
            <Divider {...args} orientation={orientation} weight={weight} />
          </div>
        ))
      )}
      <Divider {...args} label="or" />
      <Divider {...args} decorative />
    </div>
  ),
};

/** Dividing a form into sections, which is the reason the component exists. */
export const FormSections: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "28rem" }}>
      <h2 style={{ margin: 0 }}>Account</h2>
      <Divider {...args} />
      <h2 style={{ margin: 0 }}>Billing</h2>
      <Divider {...args} />
      <h2 style={{ margin: 0 }}>Notifications</h2>
      <Divider {...args} decorative />
      <p style={{ color: "var(--uir-text-muted)", margin: 0 }}>
        The last rule is decorative: it follows the last heading and separates nothing.
      </p>
    </div>
  ),
};

/** RTL and high contrast. The rule runs the same way; only the page's alignment changes. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Divider {...args} />
      <Divider {...args} weight="thick" />
      <Divider {...args} label="أو تابع" />
      <div style={{ display: "flex", gap: "var(--uir-space)", blockSize: "2rem" }}>
        <span>الرئيسية</span>
        <Divider {...args} orientation="vertical" />
        <span>التوثيق</span>
      </div>
    </div>
  ),
};
