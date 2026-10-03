/**
 * Pagination stories.
 *
 * The state that matters is the window: which page numbers are shown, what the ellipsis stands for,
 * and the live region that announces the position — which is the part neither reference API has.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Pagination } from "uireload/components/pagination";
import { Text } from "uireload/components/text";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "fullWidth" },
  argTypes: {
    siblingCount: { control: "inline-radio", options: ["auto", "all", 1, 2, 3] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    showEdges: { control: "boolean" },
    announcePosition: { control: "boolean" },
    disabled: { control: "boolean" },
    page: { control: { type: "number", min: 0, max: 200 } },
    pageCount: { control: { type: "number", min: 0, max: 200 } },
  },
  args: {
    page: 6,
    pageCount: 20,
    siblingCount: "auto",
    size: "md",
    showEdges: true,
    announcePosition: true,
    disabled: false,
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * First and last are always present with a window around the current page between them, so the ends
 * of the collection are one click away — which is the thing a page-number row exists to prevent. The
 * gaps are `aria-hidden`: announcing "ellipsis" announces a piece of CSS, and a screen reader user
 * gets the page count from the status region instead.
 */
export const Default: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(args.page ?? 6);

    return (
      <div style={{ padding: "2rem" }}>
        <Pagination {...args} page={page} onPageChange={setPage} />
        <Text tone="muted" gutterBottom={false} style={{ marginBlockStart: "var(--uir-space)" }}>
          Showing page {page + 1}. The live region announces the position on every change.
        </Text>
      </div>
    );
  },
};

/**
 * A short collection.
 *
 * Below five pages nothing is compressed, so the window rule does not apply and every number shows.
 */
export const ShortCollection: Story = {
  args: { page: 1, pageCount: 4 },
};

/**
 * Every page.
 *
 * Right for a short list, wrong past about twenty — which is why `siblingCount` is an explicit
 * opt-out rather than a size-based guess: the point at which a row of numbers stops fitting is a
 * question about the container, and this component cannot measure it.
 */
export const AllPages: Story = {
  args: { siblingCount: "all", page: 6, pageCount: 20 },
};

/** The window at the start, where one end has no gap above it. */
export const AtTheStart: Story = {
  args: { page: 0, pageCount: 20 },
};

/** The window at the end, where the other end has none. */
export const AtTheEnd: Story = {
  args: { page: 19, pageCount: 20 },
};

/**
 * Without the edge controls.
 *
 * For a narrow container where first / previous / next / last would crowd out the numbers, which are
 * the part that carries the information.
 */
export const WithoutEdges: Story = {
  args: { showEdges: false },
};

/** More siblings, which widens the window at both ends. */
export const ThreeSiblings: Story = {
  args: { siblingCount: 3, page: 10, pageCount: 40 },
};

/**
 * One page.
 *
 * Renders nothing at all rather than one disabled button: a control taking space on screen with
 * nothing to say is worse than no control, and on a list of twenty tables it is twenty rows of dead
 * weight.
 */
export const SinglePage: Story = {
  args: { page: 0, pageCount: 1 },
};

/** No pages at all. */
export const NoPages: Story = {
  args: { page: 0, pageCount: 0 },
};

/**
 * Disabled.
 *
 * Every button is genuinely `disabled`, not just styled, so `Tab` skips the whole row. `page` is not
 * clamped for the announcement, so the status region still reports where the user is.
 */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Every size. Each target meets the 24px floor, including the edge controls. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Pagination key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/**
 * Custom labels, which is what a non-paged collection needs.
 *
 * "Page 7 of 20" is wrong for a table of specifications; "Side 7 of 20" is right.
 */
export const CustomLabels: Story = {
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Pagination
        {...args}
        pageLabel="Side"
        firstLabel="First side"
        previousLabel="Previous side"
        nextLabel="Next side"
        lastLabel="Last side"
      />
    </div>
  ),
};

/**
 * Without the status region.
 *
 * Only when the consumer announces the position themselves — a table whose own heading already says
 * "Rows 41 to 60", for instance.
 */
export const WithoutAnnouncement: Story = {
  args: { announcePosition: false },
};

/**
 * In a table footer, which is where pagination belongs.
 *
 * The point of the story is the relationship: the count in the heading and the position in the live
 * region agree, so a screen reader user pressing "next" hears where they have landed.
 */
export const InTableFooter: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(6);

    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: "1rem" }}>
          <Text overline>Deployments</Text>
          <Text tone="muted">
            Rows {(page + 1) * 20 - 19}–{Math.min((page + 1) * 20, 384)}
          </Text>
        </div>

        <Pagination {...args} page={page} pageCount={20} onPageChange={setPage} size="sm" />
      </div>
    );
  },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Pagination {...args} page={6} pageCount={20} />
    </div>
  ),
};
