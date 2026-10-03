/**
 * Snackbar stories.
 *
 * The states that matter are the close reason and the pause, because both are invisible until they are
 * wrong — a snackbar that disappears while it is being read does not announce itself as broken.
 */

import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Snackbar, type SnackbarCloseReason } from "uireload/components/snackbar";

const meta = {
  title: "Components/Snackbar",
  component: Snackbar,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    placement: {
      control: "inline-radio",
      options: [
        "top-start",
        "top-center",
        "top-end",
        "bottom-start",
        "bottom-center",
        "bottom-end",
      ],
    },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    live: { control: "inline-radio", options: ["off", "polite", "assertive"] },
    duration: { control: "number" },
    showClose: { control: "boolean" },
    dismissOnClickOutside: { control: "boolean" },
    pauseOnHover: { control: "boolean" },
  },
  args: {
    children: "Settings saved.",
    open: false,
    placement: "bottom-end",
    tone: "neutral",
    live: "polite",
    /*
     * `null`, not a number.
     *
     * Every story here is a static `open: true` that mounts once and is never re-opened. With a real
     * duration the snackbar closed after seven seconds and then stayed closed for the rest of the
     * visit, so the canvas went blank and looked like a broken component rather than an expired
     * timer. `AutoDismiss` is where the timer is shown, because "it closes itself" is a behaviour
     * worth seeing and not worth paying for on the other nine stories.
     */
    duration: null,
    showClose: true,
    dismissOnClickOutside: false,
    pauseOnHover: true,
  },
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default, closed.
 *
 * Hidden rather than absent, and that is the whole of the live-region contract: a region created at the
 * same moment as its text has nothing to observe, so the message is frequently dropped entirely. The
 * region has to exist first.
 */
export const Default: Story = {};

/** Open, with an action. */
export const WithAction: Story = {
  args: {
    open: true,
    children: "3 items archived.",
    action: <Button size="sm">Undo</Button>,
  },
};

/**
 * The timer, running.
 *
 * The one story that keeps a real duration, because "it closes itself after a while" is behaviour a
 * user needs to see and cannot see anywhere else. Re-open it from the canvas controls to watch it
 * again.
 */
export const AutoDismiss: Story = {
  args: { open: true, duration: 7000 },
};

/** Every tone. The glyph is the only thing that changes — the surface stays dark and opaque. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Snackbar key={tone} {...args} open tone={tone} />
      ))}
    </div>
  ),
};

/** Every placement. Logical, so the set mirrors in RTL without a second prop. */
export const Placements: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(
        [
          "top-start",
          "top-center",
          "top-end",
          "bottom-start",
          "bottom-center",
          "bottom-end",
        ] as const
      ).map((placement) => (
        <div key={placement} style={{ minHeight: "4rem", position: "relative" }}>
          <Snackbar {...args} open placement={placement} />
        </div>
      ))}
    </div>
  ),
};

/**
 * The close reasons, which a consumer cannot otherwise tell apart.
 *
 * `onClose` is the request and `onDismiss` is the fact, and both fire for one dismissal — so this
 * story exists to show the reason arriving on each.
 */
export const CloseReasons: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const [last, setLast] = useState<string | null>(null);

    const show = useCallback((reason: SnackbarCloseReason) => {
      setLast(reason);
      setOpen(false);
      // Reopen on a timer so the story can be run through all three reasons in one visit.
      setTimeout(() => setOpen(true), 1200);
    }, []);

    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "var(--uir-text-muted)", marginBlockEnd: "var(--uir-space)" }}>
          Last dismissal: <code>{last ?? "none yet"}</code>
        </p>

        <Snackbar
          {...args}
          open={open}
          onClose={show}
          onDismiss={(reason) => setLast(`onDismiss: ${reason}`)}
          dismissOnClickOutside
        />
      </div>
    );
  },
};

/**
 * No timer.
 *
 * `duration={null}` explicitly, for a message that must be dealt with: a validation failure, a
 * destructive action's confirmation. Auto-dismissing those is how a user misses the one thing the
 * page said to them.
 */
export const Permanent: Story = {
  args: {
    open: true,
    duration: null,
    tone: "danger",
    children: "3 files could not be uploaded. Retry to try again.",
  },
};

/** Dismiss on a click outside, which is what a toast wants and a message does not. */
export const DismissOnClickOutside: Story = {
  args: { open: true, dismissOnClickOutside: true },
};

/** Assertive, for the one tone that should interrupt. */
export const Assertive: Story = {
  args: { open: true, live: "assertive", tone: "danger", children: "Payment failed." },
};

/** RTL and high contrast. The surface is dark and opaque in every scheme, by design. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: {
    open: true,
    tone: "positive",
    children: "تم حفظ الإعدادات.",
    action: <Button size="sm">تراجع</Button>,
  },
};
