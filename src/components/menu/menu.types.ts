/**
 * Prop types for Menu.
 *
 * Provenance for this component — the counterpart consulted in each reference
 * library and the symbol behind each non-obvious choice — is recorded in
 * `docs/references.md`. It is not repeated here, because these comments ship as
 * the published `.d.ts`.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref, RefObject } from "react";
import type { OverlayPlacement } from "../../internal";

/**
 * Item semantics.
 *
 * `menuitem` is a plain action. `menuitemcheckbox` and `menuitemradio` carry
 * `aria-checked` and are the reason this is a menu rather than a list of buttons.
 */
export type MenuItemRole = "menuitem" | "menuitemcheckbox" | "menuitemradio";

/** One row. */
export interface MenuItem {
  /** Stable identity, reported by `onAction`. */
  id: string;

  /** The item's text. Also the text typeahead matches against. */
  label: ReactNode;

  /**
   * Item semantics.
   *
   * @default "menuitem"
   *
   * A plain `menuitem` closes the menu when activated. The two checkable roles
   * do not, because toggling one setting and being thrown out of the menu is not
   * what someone adjusting several switches meant.
   */
  role?: MenuItemRole | undefined;

  /**
   * The checked state, for the two checkable roles.
   *
   * Controlled by the caller: the menu reports the activation and never changes
   * this itself, so a checkbox item in a menu behaves exactly like a checkbox
   * outside one.
   */
  checked?: boolean | undefined;

  /**
   * Not activatable, but still reachable with the arrow keys.
   *
   * The pattern requires a disabled item to remain focusable, so it is announced
   * as unavailable rather than skipped — a gap in the list the user cannot
   * account for is worse than a row they can see and cannot use.
   */
  disabled?: boolean | undefined;

  /** Leading adornment. Decorative by default; give it an `aria-hidden` icon. */
  icon?: ReactNode | undefined;

  /** Secondary text under or beside the label. */
  description?: ReactNode | undefined;

  /**
   * Whether activating closes the menu.
   *
   * Defaults to `true` for `menuitem` and `false` for the checkable roles. Set
   * it to override the default in either direction.
   */
  closeOnSelect?: boolean | undefined;

  /** Called when this item is activated, before `onAction`. */
  onSelect?: (() => void) | undefined;
}

/** A divider between groups of items. */
export interface MenuSeparator {
  type: "separator";

  /** Optional id, for keying. */
  id?: string | undefined;
}

/** Anything that can appear in `Menu`'s `items`. */
export type MenuEntry = MenuItem | MenuSeparator;

/** Where the surface sits relative to its anchor, in logical terms. */
export type MenuPlacement = OverlayPlacement;

/** Which item receives focus when the menu opens. */
export type MenuInitialFocus = "first" | "last";

export interface MenuOwnProps {
  /** The rows to render, in order. Interleave {@link MenuSeparator}s freely. */
  items: readonly MenuEntry[];

  /**
   * The element the menu is positioned against, and the node focus returns to
   * on Escape.
   *
   * Also where the trigger's `aria-haspopup` and `aria-expanded` belong — see
   * the component README, because a menu button without `aria-expanded` is the
   * single most common way to get this pattern wrong.
   */
  anchor: Element | RefObject<Element | null> | null;

  /** Controlled open state. `undefined` means uncontrolled. */
  open?: boolean | undefined;

  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean | undefined;

  /** Called with the new open state, controlled or not. */
  onOpenChange?: ((open: boolean) => void) | undefined;

  /**
   * The menu's accessible name.
   *
   * Defaults to the catalogue's "Menu". A `role="menu"` with no name is
   * announced as "menu" and nothing else, which tells a screen reader user
   * nothing about what they have just opened.
   */
  label?: string | undefined;

  /** Reported when an item is activated. */
  onAction?: ((id: string) => void) | undefined;

  /**
   * Which item is focused when the menu opens.
   *
   * @default "first"
   *
   * `"last"` is what a trigger opened with the Up Arrow key should pass, since
   * that key means "the end of the list".
   */
  initialFocus?: MenuInitialFocus | undefined;

  /** Where the surface sits relative to the anchor. @default "bottom" */
  placement?: MenuPlacement | undefined;

  /** Gap between the anchor and the surface, in pixels. @default 4 */
  offset?: number | undefined;

  /** Close when Escape is pressed. @default true */
  closeOnEscape?: boolean | undefined;

  /** Close when a press lands outside both the menu and the anchor. @default true */
  closeOnOutsidePress?: boolean | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type MenuProps = MenuOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MenuOwnProps | "children">;
