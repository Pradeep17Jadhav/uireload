/**
 * Avatar stories.
 *
 * The states that matter are the image-failed path and `interactive`, because those two change what
 * the element *is* — a `<div>` becomes a `<button>` — and a revoked gravatar is normal rather than
 * exceptional.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, initialsFrom } from "uireload/components/avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "fullWidth" },
  argTypes: {
    variant: { control: "inline-radio", options: ["circular", "rounded"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    interactive: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "circular",
    size: "md",
    tone: "neutral",
    interactive: false,
    disabled: false,
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Initials, from a name.
 *
 * First and last, not first and second: "Augusta Ada King" is "AK", because the last word is the
 * surname.
 */
export const Default: Story = {
  args: { initials: initialsFrom("Ada Lovelace") },
};

/** An image. `alt` is the person's name, and it replaces the initials entirely. */
export const WithImage: Story = {
  args: {
    initials: initialsFrom("Ada Lovelace"),
    src: "https://placehold.co/96x96/1e293b/f8fafc?text=AL",
    alt: "Ada Lovelace",
  },
};

/**
 * A broken image.
 *
 * `src` points nowhere on purpose. A revoked avatar URL is the *normal* failure, not an exception, and
 * a broken-image glyph is a worse answer than the initials the component already has.
 */
export const FailedImage: Story = {
  args: {
    initials: initialsFrom("Ada Lovelace"),
    src: "/this-file-does-not-exist.png",
    alt: "Ada Lovelace",
  },
};

/**
 * Decorative.
 *
 * `alt=""` is not a missing alt; it is the correct declaration that the image carries no information,
 * because the name is already visible beside it. The initials are not rendered either — announcing
 * "AL" beside a name that already says who this is is noise.
 */
export const Decorative: Story = {
  args: {
    initials: initialsFrom("Ada Lovelace"),
    src: "https://placehold.co/96x96/475569/f8fafc?text=AL",
    alt: "",
  },
};

/** Neither image nor initials: an empty glyph, for a record with no person behind it yet. */
export const Empty: Story = {};

/** Every size. `size` reads the control height ladder, so an avatar lines up with the button beside it. */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)", padding: "2rem" }}
    >
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar key={size} {...args} size={size} initials={initialsFrom("Ada Lovelace")} />
      ))}
    </div>
  ),
};

/** Every tone. The tone is the fill when there is no image, so it is only visible on initials. */
export const Tones: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)", padding: "2rem" }}
    >
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Avatar key={tone} {...args} initials={initialsFrom("Ada Lovelace")} tone={tone} />
      ))}
    </div>
  ),
};

/**
 * Interactive.
 *
 * A real `<button type="button">` — one tab stop, Space and Enter activate it natively, none of which
 * a `<div>` gets without a tabindex, a role and a keydown handler written by hand.
 */
export const Interactive: Story = {
  args: { initials: initialsFrom("Ada Lovelace"), interactive: true },
};

/** Interactive and disabled: no clicks, and skipped by Tab. */
export const InteractiveDisabled: Story = {
  args: { initials: initialsFrom("Ada Lovelace"), interactive: true, disabled: true },
};

/** Explicit initials, bypassing the derivation. For names in scripts `initialsFrom` cannot split. */
export const ExplicitInitials: Story = {
  args: { initials: "ع" },
};

/** A badge, for an unread count. `aria-hidden`, because a presence dot has no announcement. */
export const WithBadge: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-space)", padding: "2rem" }}>
      <Avatar
        {...args}
        initials={initialsFrom("Ada Lovelace")}
        badge={
          <span
            style={{
              background: "var(--uir-danger)",
              borderRadius: "999px",
              color: "var(--uir-danger-contrast)",
              fontSize: "0.65rem",
              lineHeight: "1.4",
              padding: "0 0.3rem",
            }}
          >
            3
          </span>
        }
      />
    </div>
  ),
};

/** An account row: the avatar beside the name and status it stands for. */
export const AccountRow: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)" }}>
          <Avatar
            initials={initialsFrom("Ada Lovelace")}
            interactive
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
          />
          <div>
            <div style={{ fontWeight: 600 }}>Ada Lovelace</div>
            <div style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>
              {open ? "Menu open" : "Click the avatar"}
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/** A group of faces, where consistent sizing is what makes the row read as one thing. */
export const Group: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "0.25rem", padding: "2rem" }}>
      {["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson"].map((who) => (
        <Avatar key={who} {...args} initials={initialsFrom(who)} size="sm" />
      ))}
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)", padding: "2rem" }}
    >
      <Avatar {...args} initials={initialsFrom("أدا لوفلايس")} tone="accent" />
      <Avatar {...args} initials="ع" interactive />
      <Avatar {...args} initials={initialsFrom("أدا لوفلايس")} tone="danger" />
    </div>
  ),
};
