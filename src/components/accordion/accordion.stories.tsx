/**
 * Accordion stories.
 *
 * The states that matter are the two selection modes and `allowAllClosed`, because those are the three
 * things a consumer has to decide and each has a visible consequence. The `region` proliferation note in
 * the README is also shown here, since it is a question about item count.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Accordion, type AccordionItem } from "uireload/components/accordion";

const FAQ: readonly AccordionItem[] = [
  {
    id: "included",
    title: "What is included in the base plan?",
    children: (
      <p>
        Unlimited projects, 20 GB of storage, and email support with a four-hour first-response
        target.
      </p>
    ),
  },
  {
    id: "cancel",
    title: "Can I cancel at any time?",
    children: (
      <p>
        Yes. Cancelling takes effect at the end of the current billing period and your data stays
        readable for 30 days afterwards.
      </p>
    ),
  },
  {
    id: "refunds",
    title: "Do you offer refunds?",
    children: (
      <p>
        Within 30 days of the first charge, no questions asked. Write to support and it is processed
        the same working day.
      </p>
    ),
  },
  {
    id: "migrate",
    title: "Can I migrate from another service?",
    children: (
      <p>
        There is a guided importer for the common formats. For anything else, our support team can
        run the migration for you.
      </p>
    ),
  },
  {
    id: "sso",
    title: "Do you support single sign-on?",
    children: (
      <p>
        SAML and OIDC are available on the Business plan. Contact support to have an identity
        provider registered.
      </p>
    ),
  },
];

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { layout: "padded" },
  argTypes: {
    selectionMode: { control: "inline-radio", options: ["single", "multiple"] },
    allowAllClosed: { control: "boolean" },
    headingLevel: { control: "inline-radio", options: [2, 3, 4, 5, 6] },
    variant: { control: "inline-radio", options: ["outlined", "plain"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    lazy: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: { items: FAQ, selectionMode: "single" },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * Why some stories below do not spread `args`.
 *
 * `selectionMode` is a TypeScript discriminator, so Storybook infers a story's `args` from the *first* branch
 * of the union — the `single` one — and `args.value` is therefore `string | null | undefined`. Spreading that
 * into a `<Accordion selectionMode="multiple">` asks TypeScript to satisfy both branches at once, and it
 * correctly refuses: a `string | null` value is not a `readonly string[]`.
 *
 * The alternative — widening the prop to `string | null | readonly string[]` and casting inside the
 * component — would push that cast onto every consumer, which is the cost this API shape exists to avoid.
 * So the few stories that change the mode pass their props explicitly. The trade is a little repetition in a
 * story file in exchange for a prop type that cannot be misused.
 */

/**
 * The default: a FAQ list, one panel open.
 *
 * `role="region"` on each panel, named by its own header, so the list is navigable by landmark. The chevron
 * is CSS-drawn and `aria-hidden` — "collapsed" is already carried by `aria-expanded`, and saying it twice
 * is noise.
 */
export const Default: Story = {
  args: { defaultValue: "included" },
};

/**
 * Several panels open at once.
 *
 * A FAQ where the answers are independent and the reader may want three of them side by side. Compare with
 * `Default`: same component, one prop, and the value type changes from `string | null` to `readonly string[]`.
 */
export const Multiple: Story = {
  args: { selectionMode: "multiple", defaultValue: ["included", "cancel", "refunds"] },
};

/**
 * One panel that cannot be closed.
 *
 * `allowAllClosed={false}` for a wizard-style list. The open header reports `aria-disabled` rather than
 * becoming inert, so it stays focusable and keeps its place in the tab sequence — a step you can see but
 * never return to is a trap.
 */
export const OneAlwaysOpen: Story = {
  args: { selectionMode: "single", defaultValue: "included", allowAllClosed: false },
};

/**
 * Uncontrolled, starting with everything collapsed. The most common state.
 *
 * Written as an empty args object rather than `defaultValue: null`, because Storybook merges a story's args
 * as the union of both selection branches and `null` belongs only to the `single` one. "Nothing open" is
 * already the uncontrolled default, so saying so is clearer than fighting the inference.
 */
export const AllCollapsed: Story = {};

/**
 * Controlled from outside.
 *
 * The buttons report the requested change without applying it; the accordion only re-renders when `value`
 * changes. Watch the "requested" line lag behind the panel on the first click — that is the controlled
 * contract, not a bug.
 */
export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [value, setValue] = useState<string | null>("included");
    const [requested, setRequested] = useState<string | null>("included");

    return (
      <div style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "44rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space-xs)" }}>
          {FAQ.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRequested(item.id);
                setValue(item.id);
              }}
              style={{
                background: "var(--uir-surface)",
                border: "1px solid var(--uir-border)",
                borderRadius: "var(--uir-radius-md)",
                color: "inherit",
                cursor: "pointer",
                font: "inherit",
                padding: "0.375rem 0.75rem",
              }}
            >
              Open {item.id}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setRequested(null);
              setValue(null);
            }}
            style={{
              background: "var(--uir-surface)",
              border: "1px solid var(--uir-border)",
              borderRadius: "var(--uir-radius-md)",
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              padding: "0.375rem 0.75rem",
            }}
          >
            Close all
          </button>
        </div>

        <p style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem", margin: 0 }}>
          requested: <code>{requested ?? "null"}</code> &middot; applied:{" "}
          <code>{value ?? "null"}</code>
        </p>

        <Accordion
          items={args.items}
          value={value}
          headingLevel={args.headingLevel}
          variant={args.variant}
          size={args.size}
          lazy={args.lazy}
          onExpandedChange={setValue}
        />
      </div>
    );
  },
};

/** A disabled item, which is out of the tab sequence entirely. */
export const WithADisabledItem: Story = {
  args: {
    items: [
      ...FAQ.slice(0, 2),
      { ...FAQ[2]!, title: "Enterprise only", disabled: true },
      ...FAQ.slice(3),
    ],
  },
};

/** Per-item tone, for a list where one entry matters more than the rest. */
export const WithItemTones: Story = {
  args: {
    items: [
      FAQ[0]!,
      { ...FAQ[1]!, tone: "positive" },
      { ...FAQ[2]!, tone: "danger" },
      { ...FAQ[3]!, tone: "accent" },
    ],
  },
};

/**
 * Panel content with real controls in it.
 *
 * The important property: a collapsed panel's content is hidden with the `hidden` attribute, so Tab never
 * lands on a link inside a closed panel. Open one and its controls join the tab sequence.
 */
export const WithFormControls: Story = {
  args: {
    selectionMode: "multiple",
    defaultValue: ["billing"],
    items: [
      {
        id: "billing",
        title: "Billing details",
        children: (
          <div style={{ display: "grid", gap: "var(--uir-space-sm)", maxWidth: "20rem" }}>
            <label>
              Card number
              <input
                type="text"
                inputMode="numeric"
                style={{ display: "block", inlineSize: "100%", padding: "0.5rem" }}
              />
            </label>
            <label>
              Expiry
              <input
                type="text"
                style={{ display: "block", inlineSize: "100%", padding: "0.5rem" }}
              />
            </label>
            <a href="#invoice">Download the last invoice</a>
          </div>
        ),
      },
      {
        id: "address",
        title: "Billing address",
        children: (
          <p style={{ margin: 0 }}>
            Update your address from the account page, or contact support to have it changed for
            you.
          </p>
        ),
      },
    ],
  },
};

/**
 * `lazy`, for panels whose content is expensive to render.
 *
 * A collapsed panel's children are not mounted until it has been opened once. The panel element and its
 * `role="region"` still exist, so the header-to-panel relationship holds from the first render.
 */
export const Lazy: Story = {
  args: {
    lazy: true,
    items: [
      {
        id: "chart",
        title: "Expensive chart",
        children: <p>This paragraph is not in the DOM until the panel is opened once.</p>,
      },
      { ...FAQ[0]! },
      { ...FAQ[1]! },
    ],
  },
};

/**
 * Eight items.
 *
 * Included as a deliberate demonstration of the pattern's own warning: it advises against `role="region"`
 * in an accordion of more than about six simultaneously expandable panels, because a screen reader user
 * facing a list of eight identical landmarks has gained a navigation problem rather than lost one. The
 * component uses `region` because it is the more useful default, and the judgement is left to the page.
 */
export const ManyItems: Story = {
  args: {
    selectionMode: "multiple",
    items: [
      { id: "a", title: "First item", children: <p>Content of the first item.</p> },
      { id: "b", title: "Second item", children: <p>Content of the second item.</p> },
      { id: "c", title: "Third item", children: <p>Content of the third item.</p> },
      { id: "d", title: "Fourth item", children: <p>Content of the fourth item.</p> },
      { id: "e", title: "Fifth item", children: <p>Content of the fifth item.</p> },
      { id: "f", title: "Sixth item", children: <p>Content of the sixth item.</p> },
      { id: "g", title: "Seventh item", children: <p>Content of the seventh item.</p> },
      { id: "h", title: "Eighth item", children: <p>Content of the eighth item.</p> },
    ],
  },
};

/** Every size and variant, for checking the seams line up and the chevron stays centred. */
export const SizesAndVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space-xl)", maxWidth: "44rem" }}>
      {(["outlined", "plain"] as const).map((variant) =>
        (["sm", "md", "lg"] as const).map((size) => (
          <section key={`${variant}-${size}`} style={{ display: "grid", gap: "0.5rem" }}>
            <code style={{ color: "var(--uir-text-muted)", fontSize: "0.8125rem" }}>
              {variant} / {size}
            </code>
            <Accordion
              items={args.items}
              variant={variant}
              size={size}
              headingLevel={args.headingLevel}
              defaultValue="a"
            />
          </section>
        ))
      )}
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space-xl)", maxWidth: "44rem" }}>
      <Accordion items={FAQ} headingLevel={4} defaultValue="included" />
      <Accordion
        items={FAQ}
        variant="plain"
        size="sm"
        selectionMode="multiple"
        defaultValue={["cancel"]}
      />
    </div>
  ),
};
