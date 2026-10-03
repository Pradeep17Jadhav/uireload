/**
 * Prop types for Accordion.
 *
 * Provenance for this component — the counterpart consulted in each reference
 * library and the symbol behind each non-obvious choice — is recorded in
 * `docs/references.md`. It is not repeated here, because these comments ship as
 * the published `.d.ts`.
 */

import type { HTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone } from "../../foundations";

/** One expandable section. */
export interface AccordionItem {
  /**
   * Stable identity for this item.
   *
   * Used for `value`, `aria-controls` and the generated element ids, so it must
   * be unique among the items and stable across renders — an id that changes
   * would break the header-to-panel relationship for assistive technology.
   */
  id: string;

  /** The header's label. Not a tooltip: this is the visible, focusable text. */
  title: ReactNode;

  /** The panel's content. Omit for a panel that is empty until it matters. */
  children?: ReactNode | undefined;

  /** This item cannot be toggled. Rendered as the native `disabled` attribute. */
  disabled?: boolean | undefined;

  /** Colour for this item's header. Inherits the accordion's tone when omitted. */
  tone?: Tone | undefined;
}

/** Whether one panel at a time may be open, or several. */
export type AccordionSelectionMode = "single" | "multiple";

/**
 * Heading level for the header elements.
 *
 * `1` is excluded deliberately: the document already has exactly one `h1`, and an
 * accordion is a section of a page rather than the page itself.
 */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionOwnPropsBase {
  /** The sections to render, in order. */
  items: readonly AccordionItem[];

  /**
   * Whether one panel at a time may be open, or several.
   *
   * @default "single"
   *
   * Declared **only** on the two selection branches below, never here. A discriminant that also appears in
   * the shared base intersects with itself, and the result stops narrowing when the props are spread into a
   * component — which is exactly what a Storybook args object or a consumer's wrapper does. The wrong
   * combination then fails at the point of use instead of at the call site.
   *
   * The practical effect of getting this wrong is that `<Accordion {...args} />` stops compiling, so this is
   * a real constraint on the type, not a stylistic one.
   */

  /**
   * May the open panel be closed, leaving nothing open?
   *
   * @default true
   *
   * Only meaningful in `"single"` mode. Set it to `false` for a wizard-style
   * accordion where exactly one panel is always open; the open header then
   * reports `aria-disabled` rather than becoming inert, so it stays focusable and
   * keeps its place in the tab sequence.
   */
  allowAllClosed?: boolean | undefined;

  /**
   * Heading level for the header elements.
   *
   * @default 3
   *
   * The header must be a heading so the panel structure is navigable by heading.
   * The level is a prop because the correct value depends on the page's outline,
   * which the library cannot know.
   */
  headingLevel?: AccordionHeadingLevel | undefined;

  /** Visual style. @default "outlined" */
  variant?: "outlined" | "plain" | undefined;

  /** Control size, matching the ladder every other control uses. @default "md" */
  size?: Size | undefined;

  /**
   * Render a panel's content only once it has been opened at least once.
   *
   * @default false
   *
   * Collapsed panels already cost nothing in the tab sequence or the
   * accessibility tree. This is about render cost for expensive content — a chart
   * per panel — not about hiding.
   */
  lazy?: boolean | undefined;

  /** Disables every item. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto a header. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: React.CSSProperties | undefined;

  /** Forwarded to the root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface AccordionSingleSelectionProps {
  selectionMode?: "single" | undefined;

  /**
   * The open item's id, or `null` for none.
   *
   * `undefined` means uncontrolled; `null` means controlled-and-all-closed. Those
   * are different states and the distinction is load-bearing.
   */
  value?: string | null | undefined;

  /** Initial open item when uncontrolled. */
  defaultValue?: string | null | undefined;

  /** Called with the newly open item's id, or `null` when everything closes. */
  onExpandedChange?: ((id: string | null) => void) | undefined;
}

export interface AccordionMultipleSelectionProps {
  selectionMode: "multiple";

  /** The open items' ids. `undefined` means uncontrolled. */
  value?: readonly string[] | undefined;

  /** Initial open items when uncontrolled. */
  defaultValue?: readonly string[] | undefined;

  /** Called with the full new set of open ids, on every toggle. */
  onExpandedChange?: ((ids: readonly string[]) => void) | undefined;
}

export type AccordionProps = AccordionOwnPropsBase &
  (AccordionSingleSelectionProps | AccordionMultipleSelectionProps) &
  Omit<HTMLAttributes<HTMLDivElement>, keyof AccordionOwnPropsBase | "children">;
