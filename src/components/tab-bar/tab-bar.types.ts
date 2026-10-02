/**
 * Tab bar prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/** One tab. */
export interface TabItem {
  /**
   * The value reported by `onValueChange`. Required and stable, and it must be unique within the bar.
   */
  value: string;

  /** What the user reads. */
  label: ReactNode;

  /**
   * Not selectable.
   *
   * A disabled tab is skipped by the arrow keys and by `Home` / `End`. It stays rendered and stays
   * visible — a tab strip with a gap in it is a tab strip whose positions move, and one with a tab
   * missing entirely is a tab strip that lies about what the section contains.
   */
  disabled?: boolean | undefined;

  /**
   * Small text beside the label, for a count or a unit.
   *
   * Rendered inside the tab's label, so it is part of the accessible name. A count inside a tab that
   * a screen reader does not announce is a count only sighted users see.
   */
  badge?: ReactNode | undefined;

  /**
   * Advisory intent of the selected tab's underline.
   *
   * Per-tab rather than per-bar, because a tab strip routinely mixes states — a "3 errors" tab
   * beside a normal one — and a single bar-wide tone cannot express it.
   */
  tone?: Tone | undefined;

  /**
   * Announced name for the tab, when `label` is not plain text.
   *
   * Required only when `label` contains elements or images: a tab's accessible name comes from its
   * content, and arbitrary content often yields nothing useful.
   */
  textValue?: string | undefined;

  /**
   * The panel this tab reveals.
   *
   * Rendered inside a `tabpanel` this component owns, with `role="tabpanel"` and
   * `aria-labelledby` pointing back at the tab. Passing the panel rather than a render prop means the
   * component controls the association, which is the part that is easy to get wrong by hand.
   *
   * When omitted, the tab renders without a panel and the consumer renders their own — see the README,
   * because that case has real requirements the component cannot satisfy alone.
   */
  panel?: ReactNode | undefined;
}

export interface TabBarOwnProps {
  /** Accessible name for the whole tab bar. */
  label?: string | undefined;

  /** The tabs. */
  items: readonly TabItem[];

  /**
   * Controlled selected value. `undefined` means uncontrolled.
   *
   * `null` is not accepted. A tab bar with nothing selected has no correct state: a `tablist` must
   * have exactly one selected tab for the association to mean anything, and representing "none" would
   * produce a bar whose panels are all `aria-hidden`.
   */
  value?: string | undefined;

  /** Initial selection when uncontrolled. The first selectable item when omitted. */
  defaultValue?: string | undefined;

  /** Called with the newly selected value. */
  onValueChange?: ((value: string) => void) | undefined;

  /**
   * Whether the panels are rendered only for the selected tab.
   *
   * @default false
   *
   * Off by default. Hiding a panel removes it from the accessibility tree and from find-in-page, so a
   * user searching the page for text they can see in another tab cannot find it. Mounting every panel
   * costs the consumer's own code; the choice is theirs.
   */
  lazy?: boolean | undefined;

  /**
   * Layout direction.
   *
   * Also selects the arrow-key axis: `horizontal` responds to Left/Right, `vertical` to Up/Down.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical" | undefined;

  /**
   * Which edge the selection indicator sits on.
   *
   * @default "block-end"
   *
   * Automatic by default and named in logical terms, so a `vertical` bar puts it on the inline-end
   * edge — the indicator has to be on the edge the tabs advance toward, and that edge is not the same
   * one in both orientations.
   */
  indicatorPosition?: "auto" | "block-end" | "block-start" | "inline-end" | undefined;

  /**
   * Whether the strip scrolls horizontally when the tabs do not fit.
   *
   * @default true
   *
   * On by default, because a tab strip that wraps puts two tabs on one line and stops being a strip.
   * Overflowing tabs move out of reach entirely, and hidden tabs are not discoverable.
   */
  scrollable?: boolean | undefined;

  /**
   * Which way the activation key moves selection.
   *
   * @default "automatic"
   *
   * `automatic` follows the platform: on a horizontal bar Enter or Space activates the focused tab,
   * on a vertical one ArrowUp/ArrowDown do. Set either explicitly when a design insists, which
   * `Select` does — typing commits there, because a listbox has no concept of activation.
   */
  activation?: "automatic" | "automatic-activation" | "manual" | undefined;

  /** Not actionable. Every tab leaves the tab order. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto a tab. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the `<div role="tablist">`. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type TabBarProps = TabBarOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof TabBarOwnProps | "children">;
