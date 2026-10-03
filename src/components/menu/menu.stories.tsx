/**
 * Menu stories.
 *
 * Every story needs a trigger, because a menu has no meaning without one — so each one is a real button plus
 * an open or closable menu. The two states worth demonstrating on their own are the checkable items, which do
 * not close the menu, and the disabled row, which stays reachable.
 */

import { useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Menu, type MenuEntry } from "uireload/components/menu";
import { Spinner } from "uireload/components/spinner";

/**
 * A trigger and a menu that the trigger owns.
 *
 * The button deliberately does **not** set `aria-haspopup` or `aria-expanded`: the menu writes both onto its
 * anchor, so that there is no copy-paste to get wrong. See the component README.
 */
function MenuDemo({
  items,
  trigger = "Actions",
  defaultOpen = false,
  placement,
  initialFocus,
  label,
  children,
}: {
  items: readonly MenuEntry[];
  trigger?: ReactNode;
  defaultOpen?: boolean;
  placement?: "top" | "bottom" | "start" | "end";
  initialFocus?: "first" | "last";
  label?: string;
  children?: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ display: "inline-block" }}>
      <Button ref={triggerRef} onClick={() => setOpen((current) => !current)}>
        {trigger}
      </Button>
      <Menu
        anchor={triggerRef}
        open={open}
        onOpenChange={setOpen}
        items={items}
        placement={placement}
        initialFocus={initialFocus}
        label={label ?? "Actions"}
      />
      {children}
    </div>
  );
}

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: { layout: "centered" },
  argTypes: {
    placement: { control: "inline-radio", options: ["top", "bottom", "start", "end"] },
    initialFocus: { control: "inline-radio", options: ["first", "last"] },
    offset: { control: { type: "number", min: 0, max: 24 } },
    label: { control: "text" },
  },
  /*
   * `items` and `anchor` are required props, so the meta has to supply them even though every story below
   * renders through `MenuDemo` and supplies its own. Without a default here, `StoryObj<typeof meta>` rejects a
   * story whose `render` never reads those args — the type is describing the props, not what a story uses.
   */
  args: { items: [], anchor: null },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A menu of actions, closed until the button is pressed.
 *
 * `role="menu"` with a name, and the trigger carries `aria-haspopup="menu"` and `aria-expanded` — written by
 * the menu onto its anchor. Enter and Space open it and land on the first row; Down does the same and Up lands
 * on the last.
 */
export const Default: Story = {
  render: () => (
    <MenuDemo
      label="Edit menu"
      items={[
        { id: "cut", label: "Cut" },
        { id: "copy", label: "Copy" },
        { id: "paste", label: "Paste" },
      ]}
    />
  ),
};

/** Shown open, so the story renders without a click. */
export const Open: Story = {
  render: () => (
    <MenuDemo
      label="Edit menu"
      defaultOpen
      items={[
        { id: "cut", label: "Cut" },
        { id: "copy", label: "Copy" },
        { id: "paste", label: "Paste" },
      ]}
    />
  ),
};

/**
 * Checkable items, and the reason they exist as roles rather than as bold text.
 *
 * `aria-checked` is always present — `"false"` when no `checked` is passed, because an unchecked box is false
 * rather than absent. Toggling one does **not** close the menu: someone adjusting three switches expects to
 * adjust three switches. `checked` is controlled, so press one and watch it not change — the button below is
 * what commits it.
 */
export const CheckableItems: Story = {
  render: function CheckableStory() {
    const [bold, setBold] = useState(false);
    const [wrap, setWrap] = useState(true);
    const [align, setAlign] = useState("left");

    return (
      <div style={{ display: "grid", gap: "var(--uir-space)", justifyItems: "center" }}>
        <MenuDemo
          label="View menu"
          defaultOpen
          items={[
            {
              id: "grid",
              label: "Grid",
              role: "menuitemradio",
              checked: align === "grid",
              onSelect: () => setAlign("grid"),
            },
            {
              id: "list",
              label: "List",
              role: "menuitemradio",
              checked: align === "list",
              onSelect: () => setAlign("list"),
            },
            { id: "sep1", type: "separator" },
            {
              id: "bold",
              label: "Bold",
              role: "menuitemcheckbox",
              checked: bold,
              onSelect: () => setBold((current) => !current),
            },
            {
              id: "wrap",
              label: "Wrap lines",
              role: "menuitemcheckbox",
              checked: wrap,
              onSelect: () => setWrap((current) => !current),
            },
          ]}
        />
        <p style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem", margin: 0 }}>
          align: <code>{align}</code> &middot; bold: <code>{String(bold)}</code> &middot; wrap:{" "}
          <code>{String(wrap)}</code>
        </p>
      </div>
    );
  },
};

/**
 * A disabled row, which is still reachable with the arrow keys.
 *
 * `aria-disabled` rather than the native attribute, because the pattern requires a disabled item to remain
 * focusable. A row missing from the arrow-key sequence is a gap the user cannot account for; a row they can
 * see and cannot use at least explains itself. Tab into the menu and press Down twice to land on it.
 */
export const WithADisabledItem: Story = {
  render: () => (
    <MenuDemo
      label="File menu"
      defaultOpen
      items={[
        { id: "new", label: "New" },
        { id: "open", label: "Open…" },
        { id: "sep", type: "separator" },
        { id: "lock", label: "Lock document", disabled: true },
        { id: "rename", label: "Rename" },
      ]}
    />
  ),
};

/** Separators dividing groups of items. Not focusable — a focusable divider is a row you cannot use. */
export const WithSeparators: Story = {
  render: () => (
    <MenuDemo
      label="Insert menu"
      defaultOpen
      items={[
        { id: "image", label: "Image" },
        { id: "video", label: "Video" },
        { id: "sep1", type: "separator" },
        { id: "table", label: "Table" },
        { id: "chart", label: "Chart" },
        { id: "sep2", type: "separator" },
        { id: "code", label: "Code block" },
        { id: "embed", label: "Embed" },
      ]}
    />
  ),
};

/** Icons, and a second line of text under the label. */
export const WithIconsAndDescriptions: Story = {
  render: () => (
    <MenuDemo
      label="Share menu"
      defaultOpen
      items={[
        { id: "link", label: "Copy link", icon: "#", description: "Anyone with the link" },
        { id: "email", label: "Email", icon: "@", description: "Send to a recipient" },
        { id: "sep", type: "separator" },
        { id: "embed", label: "Embed", icon: "<>" },
      ]}
    />
  ),
};

/**
 * Every placement.
 *
 * `placement` is in logical terms, so `start` and `end` swap sides in RTL with no second prop.
 */
export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "4rem",
        gridTemplateColumns: "repeat(2, max-content)",
        justifyContent: "center",
        padding: "3rem",
      }}
    >
      {(["bottom", "top", "start", "end"] as const).map((placement) => (
        <div key={placement} style={{ display: "grid", gap: "0.5rem", justifyItems: "center" }}>
          <MenuDemo
            label={`${placement} menu`}
            placement={placement}
            defaultOpen
            items={[
              { id: "one", label: "First item" },
              { id: "two", label: "Second item" },
            ]}
          />
          <code style={{ color: "var(--uir-text-muted)", fontSize: "0.8125rem" }}>{placement}</code>
        </div>
      ))}
    </div>
  ),
};

/** Focused on the last row, which is what a trigger opened with the Up Arrow should pass. */
export const InitialFocusLast: Story = {
  render: () => (
    <MenuDemo
      label="Edit menu"
      defaultOpen
      initialFocus="last"
      items={[
        { id: "cut", label: "Cut" },
        { id: "copy", label: "Copy" },
        { id: "paste", label: "Paste" },
      ]}
    />
  ),
};

/**
 * The full keyboard contract, printed.
 *
 * The menu's behaviour is entirely in the keys, and none of it is visible in a screenshot — so it is stated
 * here rather than left in the README where nobody looks while using the component.
 */
export const KeyboardContract: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "34rem", padding: "2rem" }}>
      <MenuDemo
        label="Edit menu"
        items={[
          { id: "cut", label: "Cut" },
          { id: "copy", label: "Copy" },
          { id: "sep", type: "separator" },
          { id: "paste", label: "Paste", disabled: true },
          { id: "bold", label: "Bold", role: "menuitemcheckbox" },
        ]}
      />
      <table style={{ borderCollapse: "collapse", fontSize: "0.8125rem" }}>
        <tbody>
          {[
            ["Enter / Space", "Activate the focused row"],
            ["ArrowDown / ArrowUp", "Next / previous row, wrapping"],
            ["Home / End", "First / last row"],
            ["Any letter", "Jump to the next row starting with it"],
            ["Escape", "Close, and return focus to the trigger"],
            ["Tab", "Close, then move on"],
            ["Ctrl / Cmd / Alt + Arrow", "Nothing — declined"],
          ].map(([keys, what]) => (
            <tr key={keys}>
              <td style={{ color: "var(--uir-text-muted)", padding: "0.25rem 1rem 0.25rem 0" }}>
                <code>{keys}</code>
              </td>
              <td>{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: () => (
    <div style={{ display: "grid", gap: "2rem", justifyItems: "center", padding: "2rem" }}>
      <MenuDemo
        label="قائمة التحرير"
        defaultOpen
        items={[
          { id: "cut", label: "قص" },
          { id: "copy", label: "نسخ" },
          { id: "sep", type: "separator" },
          { id: "bold", label: "عريض", role: "menuitemcheckbox", checked: true },
        ]}
      />
      <MenuDemo
        label="قائمة العرض"
        placement="start"
        defaultOpen
        items={[
          { id: "grid", label: "شبكة", role: "menuitemradio", checked: true },
          { id: "list", label: "قائمة", role: "menuitemradio" },
        ]}
      />
    </div>
  ),
};

/**
 * A row that is composing its own busy state.
 *
 * `MenuItem.label` is a `ReactNode`, so a caller who wants a spinner inside a row supplies one. This is why
 * there is no `loading` prop on the item type: the row's content is the caller's, and `disabled` is the honest
 * signal for a row that cannot be used.
 */
export const WithAComposedBusyRow: Story = {
  render: function BusyStory() {
    const [saving, setSaving] = useState(false);

    return (
      <MenuDemo
        label="Document menu"
        defaultOpen={!saving}
        items={[
          { id: "rename", label: "Rename" },
          {
            id: "save",
            label: saving ? <Spinner size="sm" /> : "Save",
            disabled: saving,
            onSelect: () => {
              setSaving(true);
              setTimeout(() => setSaving(false), 1500);
            },
          },
          { id: "sep", type: "separator" },
          { id: "delete", label: "Delete", disabled: saving },
        ]}
      />
    );
  },
};
