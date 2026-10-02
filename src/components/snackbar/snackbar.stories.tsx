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
    duration: 7000,
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

/**
 * Open, with an action.
 *
 * The common case: a message and one thing to do about it. Hovering pauses the timer — which matters
 * here more than anywhere, because the action is a button and a countdown that runs while the pointer is
 * over it is a countdown aimed at the control the user is reaching for.
 */
export const WithAction: Story = {
  args: {
    open: true,
    children: "3 items archived.",
    action: <Button size="sm">Undo</Button>,
  },
};

/** Every tone. The glyph is the only thing that changes — the surface stays dark and opaque. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ padding: "2rem", display: "grid", gap: "var(--uir-space)" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone}>
          <Button size="sm" onClick={() => undefined}>
            Show {tone}
          </Button>
          <Snackbar {...args} open={false} tone={tone} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Every placement.
 *
 * Logical, so `bottom-end` is the bottom of the reading direction's trailing edge and mirrors in RTL
 * without a second prop.
 */
export const Placements: Story = {
  render: (args) => (
    <div style={{ padding: "2rem", minBlockSize: "18rem", position: "relative" }}>
      <Text_ />
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
        <div key={placement}>
          <Snackbar {...args} open={false} placement={placement} />
        </div>
      ))}
    </div>
  ),
};

/**
 * The close reason.
 *
 * A timed-out message and a dismissed one want different responses, and a consumer that cannot tell
 * them apart gets the behaviour wrong in a way that is very hard to see. This story prints the reason
 * it was last given.
 */
export const CloseReasons: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const note = useCallback((reason: SnackbarCloseReason) => {
      setLog((current) => [reason, ...current].slice(0, 5));
    }, []);

    return (
      <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
        <div style={{ display: "flex", gap: "var(--uir-space)" }}>
          <Button onClick={() => setOpen(true)}>Show for 6s</Button>
          <Button onClick={() => setOpen(true)} variant="outline">
            Show permanently
          </Button>
        </div>

        <div style={{ fontFamily: "var(--uir-font-family)", fontSize: "0.875rem" }}>
          {log.length === 0 ? (
            <span style={{ color: "var(--uir-text-muted)" }}>
              Close reasons, most recent first. A timeout and a dismissal are different facts.
            </span>
          ) : (
            <ol>
              {log.map((reason, i) => (
                <li key={`${reason}-${i}`}>{reason}</li>
              ))}
            </ol>
          )}
        </div>

        <Snackbar
          open={open}
          duration={6000}
          onClose={(reason) => {
            note(reason);
            if (reason !== "timeout") setOpen(false);
          }}
          onDismiss={note}
          action={<Button size="sm">Undo</Button>}
        >
          Archived 3 items.
        </Snackbar>
      </div>
    );
  },
};

/**
 * Never closes on a timer.
 *
 * For anything the user must act on. A message the user has to read before acting cannot be one that
 * removes itself.
 */
export const Permanent: Story = {
  args: {
    open: true,
    duration: null,
    children: "Your session expires in 2 minutes. Stay signed in?",
  },
};

/**
 * Dismiss on click outside.
 *
 * Off by default, and deliberately: it is a convenience on a message with no controls and a hazard on
 * one with them, because a stray click on a message carrying a button throws away what the user was
 * reaching for.
 */
export const DismissOnClickOutside: Story = {
  args: { open: true, dismissOnClickOutside: true },
};

/**
 * Assertive.
 *
 * Interrupts whatever is being read. Right for an error the user must know about now, wrong for
 * everything else.
 */
export const Assertive: Story = {
  args: { open: true, live: "assertive", tone: "danger", children: "Payment failed." },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: { open: true, children: "تم حفظ الإعدادات.", action: <Button size="sm">تراجع</Button> },
};

/* A spacer, so the placement story has something to sit over. */
function Text_() {
  return (
    <p style={{ color: "var(--uir-text-muted)", fontFamily: "var(--uir-font-family)" }}>
      The strip is fixed to the viewport and portalled to the end of the body, so it is not pushed
      off the bottom of the page by a long form and is not trapped inside an ancestor&apos;s
      overflow.
    </p>
  );
}
