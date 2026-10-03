/**
 * Alert stories.
 *
 * The states that matter are the tone and the urgency, because they are the same fact stated twice:
 * `tone="danger"` becomes `role="alert"` without being asked, and letting the two disagree is how an
 * error banner ends up waiting its turn to be read.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Alert } from "uireload/components/alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "fullWidth" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    variant: { control: "inline-radio", options: ["subtle", "outlined", "solid"] },
    urgency: { control: "inline-radio", options: ["polite", "assertive"] },
    dismissible: { control: "boolean" },
    titleLevel: { control: { type: "select" }, options: ["h2", "h3", "h4"] },
  },
  args: {
    tone: "neutral",
    variant: "subtle",
    dismissible: false,
    children: "Your changes have been saved.",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A polite status.
 *
 * `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. The last one matters more than it
 * looks: without it, replacing "3 items failed" with "3 items failed, 1 recovered" announces
 * "1 recovered" with no context at all.
 */
export const Default: Story = {};

/**
 * A danger alert.
 *
 * The one tone that means "this will cost you" is the only one that justifies interrupting a screen
 * reader mid-sentence, and the urgency is *derived* from the tone — reaching for `tone` gets the
 * right announcement without reaching for a second prop.
 */
export const Danger: Story = {
  args: { tone: "danger", children: "Your card was declined." },
};

/** Every tone, which is the whole set. Note the absence of a warning tone. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Alert
          key={tone}
          {...args}
          tone={tone}
          title={tone === "neutral" ? undefined : `${tone} alert`}
          children={
            tone === "danger"
              ? "Your card was declined. Check the number and try again."
              : tone === "positive"
                ? "Deployment finished in 42 seconds."
                : tone === "accent"
                  ? "A new version is available. Restart to pick it up."
                  : "Your changes have been saved."
          }
        />
      ))}
    </div>
  ),
};

/**
 * Every variant.
 *
 * A page of solid alerts is a page of stop signs, so `solid` is for the one thing that is actually
 * wrong and `subtle` is for everything else.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <Alert
          key={variant}
          {...args}
          variant={variant}
          tone={variant === "solid" ? "danger" : "accent"}
          title={`${variant} variant`}
        />
      ))}
    </div>
  ),
};

/** Every tone in every variant, which is the matrix worth eyeballing once. */
export const Matrix: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) =>
        (["neutral", "accent", "positive", "danger"] as const).map((tone) => (
          <Alert
            key={`${variant}-${tone}`}
            {...args}
            variant={variant}
            tone={tone}
            title={`${tone} · ${variant}`}
          />
        ))
      )}
    </div>
  ),
};

/**
 * With a title.
 *
 * A real `<h3>`, so the alert appears in a screen reader's heading list — which is how a user skips
 * past it to the content they came for.
 */
export const WithTitle: Story = {
  args: {
    tone: "danger",
    title: "Payment failed",
    children: "We could not charge your card ending 4242.",
  },
};

/** A custom title level, for an alert inside a page whose outline starts higher. */
export const CustomTitleLevel: Story = {
  args: { title: "Session expired", titleLevel: "h2", children: "Sign in again to continue." },
};

/**
 * With an action.
 *
 * The action lives inside the alert rather than beside it, so the button and the message it acts on
 * are one thing to a screen reader moving through the page.
 */
export const WithAction: Story = {
  args: {
    tone: "accent",
    title: "A new version is available",
    children: "Restart to pick it up. Your drafts are saved.",
    action: (
      <button
        type="button"
        style={{
          background: "var(--uir-accent)",
          border: 0,
          borderRadius: "var(--uir-control-radius)",
          color: "var(--uir-accent-contrast)",
          cursor: "pointer",
          font: "inherit",
          padding: "0.4rem 0.75rem",
        }}
      >
        Restart
      </button>
    ),
  },
};

/**
 * Dismissible.
 *
 * The component reports and **stays**. An alert that dismisses itself is a message the user can lose,
 * and an alert is almost always information they need to still have.
 */
export const Dismissible: Story = {
  args: { dismissible: true, tone: "accent", title: "Draft saved", dismissLabel: "Dismiss" },
};

/** A custom dismiss label, which is what a list of alerts needs. */
export const CustomDismissLabel: Story = {
  args: {
    dismissible: true,
    tone: "accent",
    title: "Draft saved",
    dismissLabel: "Dismiss the saved-draft notice",
  },
};

/**
 * A custom icon.
 *
 * `aria-hidden`, because a glyph beside a message that already says what happened is decoration. Pass
 * your own when the built-in marks do not fit your product's vocabulary.
 */
export const CustomIcon: Story = {
  args: {
    tone: "positive",
    icon: (
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          inlineSize: "1.25rem",
          blockSize: "1.25rem",
          borderRadius: "50%",
          background: "currentcolor",
          color: "var(--uir-success)",
          fontSize: "0.7rem",
          fontWeight: 700,
        }}
      >
        ✓
      </span>
    ),
    title: "Imported",
    children: "42 records were added.",
  },
};

/** The contradictory combination, which warns in development and is documented in the README. */
export const ContradictoryUrgency: Story = {
  args: {
    tone: "danger",
    role: "status",
    urgency: "assertive",
    children: "This warns in the console: role and urgency disagree.",
  },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Alert
          key={tone}
          {...args}
          tone={tone}
          variant="outlined"
          title="فشل الدفع"
          children="لم نتمكن من الخصم من بطاقتك."
          dismissible
          dismissLabel="إغلاق"
        />
      ))}
    </div>
  ),
};
