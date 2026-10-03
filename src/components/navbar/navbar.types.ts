/**
 * Prop types for Navbar.
 *
 * Provenance for this component — the counterpart consulted in each reference
 * library and the symbol behind each non-obvious choice — is recorded in
 * `docs/references.md`. It is not repeated here, because these comments ship as
 * the published `.d.ts`.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Size } from "../../foundations";

/** One destination in the bar. */
export interface NavbarItem {
  /** Stable identity, reported by `onNavigate` and matched by `current`. */
  id: string;

  /** The link's text. */
  label: ReactNode;

  /**
   * Where it goes.
   *
   * A destination makes the item a real `<a href>`, so it can be middle-clicked,
   * copied, and crawled. An item with no `href` but an `onSelect` becomes a
   * `<button>` instead, because it performs an action rather than navigating —
   * "Sign out" is not a link, and rendering it as one is a lie the browser will
   * try to follow.
   */
  href?: string | undefined;

  /** Called when an item with no `href` is activated. */
  onSelect?: (() => void) | undefined;

  /**
   * This is the current page.
   *
   * Set on the item, or centrally through the navbar's `current` prop. Rendered
   * as `aria-current="page"`, which is what lets a screen reader user answer
   * "where am I?" without reading every link.
   */
  current?: boolean | undefined;

  /** Not activatable. Rendered with `aria-disabled`; a link stays focusable. */
  disabled?: boolean | undefined;

  /** Leading adornment. Give it an `aria-hidden` icon — `label` is the name. */
  icon?: ReactNode | undefined;

  /** Secondary text, for a vertical bar where there is room for it. */
  description?: ReactNode | undefined;
}

export interface NavbarOwnProps {
  /** The destinations, in order. */
  items: readonly NavbarItem[];

  /**
   * The navigation landmark's name.
   *
   * Defaults to the catalogue's "Main". A `<nav>` with no name is announced as
   * "navigation" and nothing else, so a page with two of them gives the user no
   * way to tell them apart — pass a distinct name when there is more than one.
   */
  label?: string | undefined;

  /**
   * The current page's id.
   *
   * Overrides `item.current`, so a consumer holding one piece of state does not
   * have to copy it into every item on every render.
   */
  current?: string | undefined;

  /** Called with the activated item's id, whether it navigated or acted. */
  onNavigate?: ((id: string) => void) | undefined;

  /** Along the inline axis, or down the block axis. @default "horizontal" */
  orientation?: "horizontal" | "vertical" | undefined;

  /**
   * How the bar sits in the page.
   *
   * @default "static"
   *
   * `sticky` and `fixed` both take the bar out of normal flow; `fixed` also
   * removes its space from the document, so a consumer choosing it is
   * responsible for the padding that keeps content clear of the bar.
   */
  position?: "static" | "sticky" | "fixed" | undefined;

  /** Content before the items — a product name, a logo. */
  brand?: ReactNode | undefined;

  /** Content after the items — a sign-in button, a `Menu`. */
  actions?: ReactNode | undefined;

  /** Control size, matching the ladder every other control uses. @default "md" */
  size?: Size | undefined;

  /** Disables every item. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto a link. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the root. */
  ref?: Ref<HTMLElement | undefined> | undefined;
}

export type NavbarProps = NavbarOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof NavbarOwnProps | "children">;
