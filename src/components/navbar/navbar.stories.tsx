/**
 * Navbar stories.
 *
 * The states that matter are not visual variations but the three decisions the
 * component exists to get right: a named landmark, exactly one `aria-current`, and
 * an honest element per item. Each of those gets a story.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Menu } from "uireload/components/menu";
import { Navbar, type NavbarItem } from "uireload/components/navbar";

const ITEMS: readonly NavbarItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "reports", label: "Reports", href: "#reports" },
  { id: "settings", label: "Settings", href: "#settings" },
];

const meta = {
  title: "Components/Navbar",
  component: Navbar,
  parameters: { layout: "fullWidth" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    position: { control: "inline-radio", options: ["static", "sticky", "fixed"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
  args: { items: ITEMS, label: "Main", orientation: "horizontal", position: "static" },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A horizontal bar with one current page.
 *
 * `<nav aria-label="Main">` holding a `<ul>`, with `aria-current="page"` on the current entry. That named
 * landmark is the point: a `<nav>` with no name is announced as "navigation" and nothing else, so a page with
 * a primary and a secondary bar gives the user no way to tell them apart.
 */
export const Default: Story = {
  args: { current: "projects" },
};

/**
 * With no current page.
 *
 * Worth stating that this is a legitimate state, not a bug: a navbar rendered on a page that is not in the
 * list. Exactly zero items carry `aria-current`, which is correct — marking one arbitrarily would be a lie.
 */
export const NoCurrentPage: Story = {};

/**
 * Controlled from outside.
 *
 * The links report the activated id and the navbar follows. Watch `requested` lag behind on the first click:
 * that is the controlled contract, not a bug.
 */
export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [current, setCurrent] = useState<string | undefined>("home");
    const [requested, setRequested] = useState<string>("home");

    return (
      <div style={{ display: "grid", gap: "var(--uir-space-sm)" }}>
        <p style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem", margin: 0 }}>
          requested: <code>{requested}</code> &middot; applied: <code>{current ?? "none"}</code>
        </p>
        <Navbar
          {...args}
          current={current}
          onClick={(event) => {
            const link = event.currentTarget as HTMLAnchorElement;
            const id = link.textContent?.toLowerCase() ?? "";
            setRequested(id);
            setCurrent(id);
            event.preventDefault();
          }}
        />
      </div>
    );
  },
};

/**
 * A vertical bar, for an application sidebar.
 *
 * The only difference is the axis: `data-orientation="vertical"` swaps the row for a column, moves the border
 * from block-end to inline-end, and reveals the `description` line that a horizontal bar has no room for.
 */
export const Vertical: Story = {
  args: { orientation: "vertical", size: "lg", current: "projects" },
  render: (args) => (
    <div style={{ blockSize: "22rem" }}>
      <Navbar
        {...args}
        brand={<strong>Acme</strong>}
        items={[
          { id: "home", label: "Home", href: "#home", description: "Overview and activity" },
          { id: "projects", label: "Projects", href: "#projects", description: "12 active" },
          { id: "reports", label: "Reports", href: "#reports", description: "Weekly digest" },
        ]}
      />
    </div>
  ),
};

/**
 * Honest elements: a destination is a link, an action is a button.
 *
 * "Sign out" is rendered as a `<button>` because it performs an action; as a link it would be a claim the
 * browser tries to follow, and it could not be middle-clicked or copied. "Coming soon" is inert text, because
 * a focusable element that does nothing is worse than a label.
 */
export const MixedItems: Story = {
  args: {
    current: "home",
    items: [
      { id: "home", label: "Home", href: "#home" },
      { id: "docs", label: "Documentation", href: "#docs" },
      { id: "signout", label: "Sign out", onSelect: () => undefined },
      { id: "soon", label: "Coming soon" },
    ],
  },
};

/**
 * A disabled entry.
 *
 * The `href` is **kept** and `aria-disabled` set, because an `<a>` without an `href` has no implicit link
 * role — dropping it would take the entry out of the accessibility tree rather than marking it unavailable.
 * A user tabbing through the bar still hears that it exists.
 */
export const WithADisabledItem: Story = {
  args: {
    current: "home",
    items: [
      { id: "home", label: "Home", href: "#home" },
      { id: "billing", label: "Billing", href: "#billing", disabled: true },
      { id: "settings", label: "Settings", href: "#settings" },
    ],
  },
};

/** Brand before the items and controls after them — the usual arrangement. */
export const WithBrandAndActions: Story = {
  render: function BrandStory(args) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

    return (
      <Navbar
        {...args}
        current="reports"
        brand={
          <>
            <strong>Acme</strong>
            <span style={{ color: "var(--uir-text-muted)", fontWeight: 400 }}>Console</span>
          </>
        }
        actions={
          <>
            <Button
              ref={setAnchor}
              variant="ghost"
              size="sm"
              onClick={() => setOpen((current) => !current)}
            >
              Account
            </Button>
            {anchor !== null ? (
              <Menu
                anchor={anchor}
                open={open}
                onOpenChange={setOpen}
                label="Account menu"
                items={[
                  { id: "profile", label: "Your profile" },
                  { id: "prefs", label: "Preferences" },
                  { id: "sep", type: "separator" },
                  { id: "signout", label: "Sign out", disabled: true },
                ]}
              />
            ) : null}
          </>
        }
      />
    );
  },
};

/**
 * Icons beside the labels.
 *
 * The icon is `aria-hidden`, because `label` is the accessible name and the two would otherwise be announced
 * as one string with an unexplained glyph in it.
 */
export const WithIcons: Story = {
  args: {
    current: "home",
    items: [
      { id: "home", label: "Home", href: "#home", icon: "⌂" },
      { id: "projects", label: "Projects", href: "#projects", icon: "▤" },
      { id: "reports", label: "Reports", href: "#reports", icon: "◷" },
      { id: "settings", label: "Settings", href: "#settings", icon: "⚙" },
    ],
  },
};

/** Every size, for checking the bar's height against the controls it contains. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} style={{ borderBlockEnd: "1px solid var(--uir-border)" }}>
          <Navbar {...args} size={size} current="reports" />
        </div>
      ))}
    </div>
  ),
};

/**
 * Sticky and fixed.
 *
 * `fixed` removes the bar's space from the document, so whatever follows slides underneath it. Padding to
 * keep content clear is the consumer's to add — the bar cannot know what is below it, and guessing would add
 * a gap to every page that does not need one.
 */
export const Positions: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "3rem", padding: "1rem 0" }}>
      <div>
        <code style={{ color: "var(--uir-text-muted)", fontSize: "0.8125rem" }}>static</code>
        <Navbar {...args} position="static" current="home" />
      </div>
      <div>
        <code style={{ color: "var(--uir-text-muted)", fontSize: "0.8125rem" }}>sticky</code>
        <Navbar {...args} position="sticky" current="projects" />
      </div>
    </div>
  ),
};

/**
 * Two named landmarks on one page, which is the case that makes `label` matter.
 *
 * Without distinct names both are announced as "navigation", and a screen reader user has no way to tell
 * which bar they are in. That is the whole reason `label` exists.
 */
export const TwoLandmarks: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Navbar {...args} label="Primary" current="home" items={ITEMS} />
      <Navbar
        {...args}
        label="Footer"
        current="settings"
        items={[
          { id: "about", label: "About", href: "#about" },
          { id: "privacy", label: "Privacy", href: "#privacy" },
          { id: "terms", label: "Terms", href: "#terms" },
        ]}
      />
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Navbar
        {...args}
        label="التنقل الرئيسي"
        current="projects"
        brand={<strong>أكمي</strong>}
        items={[
          { id: "home", label: "الرئيسية", href: "#home" },
          { id: "projects", label: "المشاريع", href: "#projects" },
          { id: "reports", label: "التقارير", href: "#reports" },
        ]}
      />
      <Navbar {...args} label="التنقل الثانوي" orientation="vertical" current="settings" />
    </div>
  ),
};
