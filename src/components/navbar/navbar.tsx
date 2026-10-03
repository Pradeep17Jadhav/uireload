/**
 * Navbar.
 *
 * A `navigation` landmark holding the primary destinations of a page or application.
 *
 * This is deliberately the least clever component in the library. It has no widget
 * pattern, because none exists: the WAI-ARIA authoring practices define no keyboard
 * contract for navigation, and inventing one — arrow keys between links, say — would
 * turn a list of links into a toolbar and make `Tab` mean something different here
 * than everywhere else on the page.
 *
 * The whole accessibility contract is three things, and they are what this component
 * exists to get right:
 *
 *  1. **A named landmark.** A `<nav>` with no accessible name is announced as
 *     "navigation" and nothing else, so a page with a primary and a secondary bar
 *     gives the user no way to tell them apart.
 *  2. **`aria-current="page"`** on exactly one item, so "where am I?" is answerable
 *     without reading every link.
 *  3. **An honest element per item.** A destination is an `<a href>`; an action is a
 *     `<button>`. Rendering "Sign out" as a link is a claim the browser will try to
 *     follow, and it cannot be middle-clicked or copied.
 *
 * The item list is a `<ul>`, because a navigation bar is a list of places and a screen
 * reader user navigating by list is the fastest route through it.
 */

import { forwardRef, type MouseEventHandler } from "react";
import { composeHandlers, cx } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

import type { NavbarItem, NavbarProps } from "./navbar.types";

export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar(
  {
    items,
    label,
    current,
    onNavigate,
    orientation = "horizontal",
    position = "static",
    brand,
    actions,
    size = "md",
    disabled = false,
    className,
    style,
    onClick,
    ...rest
  },
  ref
) {
  const accessibleName = label ?? resolveMessage(undefined, BASE_MESSAGES, "common.mainNavigation");

  return (
    <nav
      {...rest}
      ref={ref}
      className={cx("uir-navbar", className)}
      style={style}
      /*
       * `aria-label` rather than `aria-labelledby`: a navigation bar has no visible heading of its own, and
       * the product name beside it names the *site*, not this list of destinations.
       */
      aria-label={accessibleName}
      data-orientation={orientation}
      data-position={position}
      data-size={size}
    >
      {brand !== undefined ? <div className="uir-navbar__brand">{brand}</div> : null}

      <ul className="uir-navbar__list">
        {items.map((item) => (
          <NavbarEntry
            key={item.id}
            item={item}
            current={current === undefined ? item.current === true : current === item.id}
            disabled={disabled}
            onNavigate={onNavigate}
            onClick={onClick}
          />
        ))}
      </ul>

      {actions !== undefined ? <div className="uir-navbar__actions">{actions}</div> : null}
    </nav>
  );
});

/*
 * One destination.
 *
 * Split out so the element choice and the ARIA decision sit in one readable place rather than being spread
 * through the parent's map callback — an `<a>` and a `<button>` differ in more than their tag name, and the
 * differences are the interesting part.
 */
function NavbarEntry({
  item,
  current,
  disabled,
  onNavigate,
  onClick,
}: {
  item: NavbarItem;
  current: boolean;
  disabled: boolean;
  onNavigate: ((id: string) => void) | undefined;
  onClick: MouseEventHandler<HTMLElement> | undefined;
}) {
  const isDisabled = disabled || item.disabled === true;
  const label = (
    <>
      {item.icon !== undefined ? (
        <span className="uir-navbar__icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className="uir-navbar__label">{item.label}</span>
      {item.description !== undefined ? (
        <span className="uir-navbar__description">{item.description}</span>
      ) : null}
    </>
  );

  /*
   * Quoted keys, and that is not optional.
   *
   * JSX lets an attribute name contain a hyphen — `data-current={...}` in markup is fine — but a key in a
   * plain object literal does not. `{ data-current: x }` is a syntax error in every JavaScript engine: the
   * parser reads `data`, then finds a `-` where it expected `,`. So the two spellings have to differ here,
   * and this is the one place in the component where they do.
   */
  const shared = {
    className: "uir-navbar__link",
    "aria-current": current ? ("page" as const) : undefined,
    "aria-disabled": isDisabled || undefined,
    "data-current": current ? "" : undefined,
    "data-disabled": isDisabled ? "" : undefined,
  };

  /*
   * A destination is a link, an action is a button, and a label with neither is a `<span>`.
   *
   * The third case exists because a navbar sometimes carries a section name that is not yet a page. Rendering
   * it as a link with no `href` would put a focusable, activatable element on the page that does nothing, and
   * rendering it as a button would announce a control that performs no action.
   */
  if (item.href !== undefined) {
    return (
      <li className="uir-navbar__item">
        <a
          {...shared}
          /*
           * The `href` stays, even when the item is disabled.
           *
           * An `<a>` with no `href` has no implicit link role, so dropping it would take the item out of the
           * accessibility tree altogether rather than marking it unavailable — a screen reader user would not
           * hear that the entry exists at all. `aria-disabled` is what says "present but not now", and it
           * keeps the item focusable, which matters because the tab sequence is how this bar is walked.
           *
           * Navigation is stopped by calling `preventDefault()` below rather than by removing the
           * destination, which to assistive technology is indistinguishable from "there is nowhere to go".
           */
          href={item.href}
          onClick={composeHandlers((event) => {
            if (!isDisabled) {
              onNavigate?.(item.id);
              return;
            }
            event.preventDefault();
          }, onClick)}
        >
          {label}
        </a>
      </li>
    );
  }

  if (item.onSelect !== undefined || onNavigate !== undefined) {
    return (
      <li className="uir-navbar__item">
        <button
          {...shared}
          type="button"
          /*
           * Native `disabled`, not `aria-disabled`: a button has the attribute, and using it removes the
           * control from the tab sequence — which is right for a control that cannot be used, unlike the link
           * case above where the alternative was a silently missing entry.
           */
          disabled={isDisabled}
          onClick={composeHandlers(() => {
            if (isDisabled) return;
            item.onSelect?.();
            onNavigate?.(item.id);
          }, onClick)}
        >
          {label}
        </button>
      </li>
    );
  }

  return (
    <li className="uir-navbar__item">
      <span {...shared} className="uir-navbar__link uir-navbar__link--static">
        {label}
      </span>
    </li>
  );
}
