/**
 * Tile stories.
 *
 * The states that matter are the three elevations and the three interactive forms, because the element
 * a tile renders is decided by `interactive` and `href` — not by how it looks.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Text } from "uireload/components/text";
import { Tile } from "uireload/components/tile";

const meta = {
  title: "Components/Tile",
  component: Tile,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    elevation: { control: "inline-radio", options: ["flat", "raised", "floating"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
    interactive: { control: "boolean" },
    loading: { control: "boolean" },
    maxHeight: { control: "text" },
  },
  args: {
    children:
      "A surface that groups related content. It is not a surface if it is only a background.",
    elevation: "flat",
    tone: "neutral",
    padding: "md",
  },
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a border and no shadow. */
export const Default: Story = {};

/**
 * Every elevation.
 *
 * `flat` is the default because elevation is the most expensive visual decision in a design system: a
 * page of raised cards reads as a page of popups, and nothing else on the page is raised.
 */
export const Elevations: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
        padding: "2rem",
      }}
    >
      {(["flat", "raised", "floating"] as const).map((elevation) => (
        <Tile key={elevation} {...args} elevation={elevation}>
          <Text variant="h4" gutterBottom>
            {elevation}
          </Text>
          {args.children}
        </Tile>
      ))}
    </div>
  ),
};

/**
 * Activatable.
 *
 * A real `<button type="button">`, so the whole surface is one tab stop and Space and Enter activate
 * it. A `<div>` with a click handler would need `tabIndex`, a `role` and key handling added by hand,
 * and would still lose the platform's activation semantics.
 */
export const Interactive: Story = {
  args: { interactive: true },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
      }}
    >
      <Tile {...args}>
        <Text variant="h4" gutterBottom>
          A button tile
        </Text>
        {args.children}
      </Tile>
      <Tile {...args} tone="accent">
        <Text variant="h4" gutterBottom>
          With a tone
        </Text>
        {args.children}
      </Tile>
    </div>
  ),
};

/**
 * A link tile.
 *
 * An `<a>`, so the destination is announced, the context menu works and the middle-click opens a new
 * tab — none of which a `<button>` with a click handler can do.
 */
export const Link: Story = {
  args: { href: "/docs/components/tile", children: "Read the tile reference" },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
      }}
    >
      <Tile {...args} />
      <Tile
        {...args}
        href="https://example.com"
        target="_blank"
        rel="noopener"
        children="Opens in a new tab"
      />
    </div>
  ),
};

/**
 * Every tone.
 *
 * The tone is a bar down the block-start edge, not a tinted fill. A tinted background on a large
 * surface is the fastest way to make a page unreadable, and the edge is where a status is scanned for.
 */
export const Tones: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
        padding: "2rem",
      }}
    >
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Tile key={tone} {...args} tone={tone}>
          <Text variant="h4" gutterBottom>
            {tone}
          </Text>
          {args.children}
        </Tile>
      ))}
    </div>
  ),
};

/** Every padding tier. The header and footer own their own insets. */
export const Paddings: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
        padding: "2rem",
      }}
    >
      {(["none", "sm", "md", "lg"] as const).map((padding) => (
        <Tile
          key={padding}
          {...args}
          padding={padding}
          header={<Text variant="h5">{padding}</Text>}
          footer={<Text variant="h6">footer</Text>}
        >
          {args.children}
        </Tile>
      ))}
    </div>
  ),
};

/** Header, body and footer, with hairline separators. */
export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
      }}
    >
      <Tile
        {...args}
        header={<Text variant="h4">Release 2.4</Text>}
        footer={<Button size="sm">Install</Button>}
      >
        {args.children}
      </Tile>
      <Tile
        {...args}
        tone="positive"
        header={<Text variant="h4">Installed</Text>}
        footer={
          <Button size="sm" variant="outline">
            Uninstall
          </Button>
        }
      >
        {args.children}
      </Tile>
    </div>
  ),
};

/**
 * Loading.
 *
 * The body is `aria-hidden` and the root is `aria-busy`. No live region: a region inside every
 * loading tile is a screen reader talking over itself, and the tile's *arrival* is what a consumer
 * announces.
 */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
      }}
    >
      <Tile {...args} header={<Text variant="h4">Loading</Text>} />
      <Tile {...args} tone="danger" header={<Text variant="h4">Failed to load</Text>} />
    </div>
  ),
};

/** A tile in a list, which is the reason `as` exists. */
export const InAList: Story = {
  render: (args) => (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: "2rem",
        display: "grid",
        gap: "var(--uir-space)",
      }}
    >
      {[1, 2, 3].map((n) => (
        <li key={n}>
          <Tile {...args} as="article" header={<Text variant="h5">Item {n}</Text>}>
            {args.children}
          </Tile>
        </li>
      ))}
    </ul>
  ),
};

/**
 * A bounded, scrolling tile.
 *
 * `maxHeight` is a prop rather than a token because the bound has to be set conditionally — a tile
 * that scrolls at 320px and does not at 480px is a real case.
 */
export const Bounded: Story = {
  args: { maxHeight: 160 },
  render: (args) => (
    <div style={{ padding: "2rem", maxWidth: "24rem" }}>
      <Tile {...args}>
        {Array.from({ length: 12 }, (_, i) => (
          <Text key={i} variant="h6" gutterBottom>
            Log line {i + 1} — the body scrolls rather than growing the tile without bound.
          </Text>
        ))}
      </Tile>
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--uir-space)",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
      }}
    >
      <Tile {...args} tone="danger" header={<Text variant="h4">خطأ</Text>}>
        {args.children}
      </Tile>
      <Tile {...args} elevation="floating" interactive header={<Text variant="h4">تفاعلي</Text>}>
        {args.children}
      </Tile>
    </div>
  ),
};
