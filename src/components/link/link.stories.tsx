/**
 * Link stories.
 *
 * The states that matter are the three underlines and the external marker, because those are the only
 * decisions a link makes — everything else is the platform's.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "uireload/components/text";
import { Link } from "uireload/components/link";

const meta = {
  title: "Components/Link",
  component: Link,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    underline: { control: "inline-radio", options: ["inline", "hover", "always", "none"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    target: { control: "text" },
    rel: { control: "text" },
    external: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Read the documentation",
    href: "/docs",
    underline: "inline",
    tone: "accent",
    size: "md",
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * A real `<a>`. Role, focus stop, Enter and Space activation, the context menu and the middle-click
 * are all the platform's.
 */
export const Default: Story = {};

/**
 * Every underline mode.
 *
 * `hover` underlines on hover **and on focus** — the focus case is not optional, or a keyboard user
 * cannot see where the links are. Choose it deliberately: it is quieter in a screen of prose and
 * worse for a keyboard user.
 */
export const Underlines: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "40rem" }}>
      {(["inline", "hover", "always", "none"] as const).map((underline) => (
        <p key={underline}>
          <Text variant="h4" gutterBottom>
            {underline}
          </Text>
          A paragraph with a{" "}
          <Link {...args} underline={underline} href="#a">
            link inline
          </Link>{" "}
          and then{" "}
          <Link {...args} underline={underline} href="#b">
            another one
          </Link>{" "}
          so the difference is visible in running text.
        </p>
      ))}
    </div>
  ),
};

/** Inside a paragraph, which is the case the `hover` mode exists for. */
export const InProse: Story = {
  args: { underline: "hover" },
  render: (args) => (
    <p style={{ padding: "2rem", maxWidth: "38rem", lineHeight: 1.7 }}>
      A surface is a card, a tile, a panel — anything that groups content on a background. It is not
      a surface if it is only a background: a surface is what you can see the boundary of. See{" "}
      <Link {...args} href="#one">
        the foundations
      </Link>{" "}
      for why the elevation ladder has three tiers and not four, and{" "}
      <Link {...args} href="#two">
        the tile reference
      </Link>{" "}
      for why the default is a border and no shadow.
    </p>
  ),
};

/**
 * Leaves this page.
 *
 * The marker is the difference between a link the user chose and a link that surprised them.
 */
export const External: Story = {
  args: { href: "https://developer.mozilla.org/", external: true },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Link {...args}>MDN Web Docs</Link>
      <Link {...args} underline="none">
        A link that leaves the page and does not look like one
      </Link>
    </div>
  ),
};

/** Opens in a new tab. `rel` is yours to set; the component warns rather than choosing. */
export const NewTab: Story = {
  args: {
    href: "https://example.com",
    target: "_blank",
    rel: "noopener",
    external: true,
    children: "Opens in a new tab",
  },
};

/**
 * Not yet routed.
 *
 * An `<a>` with no `href` has no link role and no tab stop. That is the honest state for a link whose
 * destination a router has not resolved — and it is why `href` is optional rather than required.
 */
export const WithoutHref: Story = {
  args: { href: undefined, children: "Not yet routed" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Link {...args} />
    </div>
  ),
};

/** With a trailing adornment. Decorative, so it is not announced. */
export const WithEndIcon: Story = {
  args: { endIcon: <span aria-hidden="true">↗</span> },
};

/**
 * Disabled.
 *
 * Keeps its `href` — which is what keeps it focusable and keeps its link role — and stops the
 * navigation in the click handler. Removing the `href` would take the tab stop with it.
 */
export const Disabled: Story = {
  args: { disabled: true, children: "Unavailable" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Link {...args} />
      <Link {...args} underline="hover" />
    </div>
  ),
};

/** Every tone. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Link key={tone} {...args} tone={tone}>
          {tone}
        </Link>
      ))}
    </div>
  ),
};

/** Every size. */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "baseline", gap: "var(--uir-space)", padding: "2rem" }}
    >
      {(["sm", "md", "lg"] as const).map((size) => (
        <Link key={size} {...args} size={size}>
          Size {size}
        </Link>
      ))}
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Link {...args} href="#one">
        رابط داخل الصفحة
      </Link>
      <Link {...args} href="https://example.com" external>
        رابط خارج الصفحة
      </Link>
    </div>
  ),
};
