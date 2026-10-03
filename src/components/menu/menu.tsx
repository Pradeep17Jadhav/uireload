/**
 * Menu.
 *
 * A `role="menu"` of actions: the widget you reach for when the choices are
 * commands rather than values. That distinction is the whole reason it is not a
 * `Select` — a listbox commits a *value*, a menu runs an *action* — and it is why
 * this is not built on the popover component despite the shared plumbing.
 *
 * A popover is `role="dialog"`, and the pattern says the element displaying the
 * items has `role="menu"`. Wrapping a menu in a dialog would make a screen
 * reader announce "dialog" the moment the menu opened, which is the wrong
 * announcement for a list of commands. So the surface, the portal, the dismissal
 * and the positioning are assembled from the same internal primitives the
 * tooltip uses, and no `role="dialog"` is ever rendered.
 *
 * Focus is managed with **roving tabindex**, not `aria-activedescendant`. The
 * pattern accepts either; roving is used here because it matches the rest of the
 * library, and because it puts real DOM focus on the row, which is what every
 * assistive technology already agrees about.
 *
 * The trigger is the consumer's own button. The pattern requires
 * `aria-haspopup="menu"` and `aria-expanded` on it, and the menu knows its anchor,
 * so it writes both — see the component README for why that is not something to
 * leave to a copy-paste.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  composeHandlers,
  composeRefs,
  computeOverlayPosition,
  cx,
  Portal,
  readDirection,
  useControllableState,
  useDismiss,
  useIsomorphicLayoutEffect,
  useRovingFocus,
  type PositionedOverlay,
} from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

import type { MenuEntry, MenuInitialFocus, MenuItem, MenuProps } from "./menu.types";

/**
 * Every row that can hold focus.
 *
 * Selected by role rather than by a marker attribute, because the items already
 * carry the role that makes them menu items and adding `data-*` purely so a focus
 * helper could find them would be a second source of truth for the same thing.
 *
 * The attribute selector also picks up `menuitemcheckbox` and `menuitemradio`,
 * which is what makes a single roving group cover all three item roles.
 */
const ITEM_SELECTOR = '[role^="menuitem"]';

const isSeparator = (entry: MenuEntry): entry is Extract<MenuEntry, { type: "separator" }> =>
  "type" in entry && entry.type === "separator";

export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    items,
    anchor,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    label,
    onAction,
    initialFocus = "first",
    placement = "bottom",
    offset = 4,
    closeOnEscape = true,
    closeOnOutsidePress = true,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref
) {
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<Element | null>(null);
  const [position, setPosition] = useState<PositionedOverlay | null>(null);

  /* Resolve the anchor, which may be an element or a ref, into a node we can read. */
  const resolveAnchor = useCallback((): Element | null => {
    if (anchor === null || anchor === undefined) return null;
    if (anchor instanceof Element) return anchor;
    return anchor.current ?? null;
  }, [anchor]);

  useEffect(() => {
    anchorRef.current = resolveAnchor();
  }, [resolveAnchor]);

  /* ---- Positioning ---------------------------------------------------- */

  const measure = useCallback(() => {
    const surface = surfaceRef.current;
    const element = anchorRef.current;
    if (surface === null || element === null) return;

    const anchorRect = element.getBoundingClientRect();
    const box = surface.getBoundingClientRect();

    /*
     * The *owning* window, not the global one. A menu rendered inside an iframe measures against that
     * iframe's viewport; `window` would be the host's, and the menu would land outside the frame.
     */
    const view = surface.ownerDocument.defaultView ?? window;

    const next = computeOverlayPosition({
      anchorRect,
      surfaceWidth: box.width,
      surfaceHeight: box.height,
      viewportWidth: view.innerWidth,
      viewportHeight: view.innerHeight,
      placement,
      offset,
      viewportPadding: 8,
      /*
       * `align: "center"` centres the surface on the anchor across the cross axis.
       *
       * This is the default the pattern's own examples use, and the alternative - pinning the surface's
       * inline edge to the anchor's - is what `placement` already decides, since `start` and `end` are logical
       * sides rather than alignments. `stretch` is for a fill-width surface, which a menu of commands never is.
       */
      align: "center",
      direction: readDirection(element),
    });

    /*
     * State is set only when the result actually differs.
     *
     * `computeOverlayPosition` returns a fresh object every call, so an unconditional `setPosition` re-renders
     * even when the menu has not moved. That is harmless alone, but it combines with the ref callback below to
     * become fatal: a ref callback whose identity changes is detached and reattached on every render, which
     * re-measures, which sets state, which renders again - and React reports that as an infinite update loop
     * rather than as the duplicate work it is.
     *
     * Bailing on an identical result is the honest fix rather than a guard against the symptom: re-measuring to
     * the same coordinates is not a change, and a menu that has not moved should not re-render.
     */
    /*
     * The four geometry fields are compared rather than the object identity.
     *
     * `arrowStartPercent` is derived from the same inputs as the other three, so it cannot differ while they
     * match - and a menu draws no arrow, so it is not consumed here anyway.
     */
    setPosition((current) =>
      current !== null &&
      current.top === next.top &&
      current.left === next.left &&
      current.placement === next.placement &&
      current.shifted === next.shifted
        ? current
        : next
    );
  }, [offset, placement]);

  /*
   * Whether the surface node exists yet.
   *
   * A portal renders nothing on its first pass so that server and client markup agree, so at the moment `open`
   * flips there is no surface to measure or to move focus into. Rather than reaching for the node
   * optimistically, attachment is turned into state: the ref callback records it, and the effects that need a
   * real node depend on this flag.
   *
   * This is the difference between a menu that opens and a menu that opens *and* can be used with the keyboard.
   * Reading `surfaceRef.current` inside an effect that ran before the portal committed silently finds `null`,
   * and nothing retries.
   */
  const [hasSurface, setHasSurface] = useState(false);

  const attachSurface = useCallback((node: HTMLDivElement | null): void => {
    surfaceRef.current = node;
    setHasSurface(node !== null);
  }, []);

  /*
   * Memoised, because `composeRefs` returns a new function on every call.
   *
   * A ref callback that changes identity is detached and reattached on every render. That is not fatal on its
   * own, but combined with a `setState` inside it the result is a re-render, which changes the callback again,
   * which re-attaches - and React reports that as an infinite update loop rather than as the churn it is.
   */
  const surfaceRefCallback = useMemo(() => composeRefs(attachSurface, ref), [attachSurface, ref]);

  useIsomorphicLayoutEffect(() => {
    if (open && hasSurface) measure();
  }, [measure, open, hasSurface, items, label]);

  /* ---- Focus management ----------------------------------------------- */

  const itemEntries = useMemo(() => items.filter((entry) => !isSeparator(entry)), [items]);

  const { getItemProps, handleKeyDown } = useRovingFocus({
    orientation: "vertical",
    loop: true,
    itemSelector: ITEM_SELECTOR,
  });

  /**
   * Move focus to a row by index, skipping separators.
   *
   * `initialFocus` is read here rather than by setting `tabIndex`, because a roving group already keeps one
   * row at `tabIndex=0`; focusing it is what actually moves the caret, and that can only happen once the
   * surface is mounted.
   */
  const focusItem = useCallback((which: MenuInitialFocus) => {
    const surface = surfaceRef.current;
    if (surface === null) return;

    const rows = [...surface.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
    const target = which === "last" ? rows.at(-1) : rows[0];
    target?.focus();
  }, []);

  /*
   * Move focus into the menu as soon as there is something to move it into.
   *
   * The pattern puts this responsibility on the author, and it is the one step a menu is easy to get
   * silently wrong: a menu that opens with focus still on the trigger looks fine and is unusable, because
   * every arrow key lands on the page instead.
   *
   * `initialFocus` is deliberately not a dependency. It chooses *which* end to land on at the moment the menu
   * opens; re-running on a later change would yank focus back while the user was moving through the list.
   */
  useEffect(() => {
    if (open && hasSurface) focusItem(initialFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasSurface]);

  /* ---- Dismissal ------------------------------------------------------ */

  const close = useCallback(() => setOpen(false), [setOpen]);

  useDismiss({
    active: open,
    onDismiss: close,
    containerRef: surfaceRef,
    ignoreRef: anchorRef,
    escape: closeOnEscape,
    outsidePress: closeOnOutsidePress,
  });

  /**
   * Write the trigger's menu-button attributes onto the anchor.
   *
   * The pattern requires `aria-haspopup` and `aria-expanded` on the element that opens the menu, and
   * getting it wrong is silent: the menu works perfectly for a mouse user and a screen reader announces a
   * plain button that mysteriously reveals a list. Doing it here means a caller who passes an `anchor` gets
   * a correct trigger for free, and there is no copy-paste to get wrong.
   *
   * The previous values are restored on close, so a consumer's own `aria-expanded` on the trigger is not
   * overwritten permanently if they unmount the menu.
   */
  useEffect(() => {
    const element = anchorRef.current;
    if (element === null) return;

    const previousExpanded = element.getAttribute("aria-expanded");
    const previousHasPopup = element.getAttribute("aria-haspopup");

    element.setAttribute("aria-haspopup", "menu");
    element.setAttribute("aria-expanded", String(open));

    return () => {
      if (previousExpanded === null) element.removeAttribute("aria-expanded");
      else element.setAttribute("aria-expanded", previousExpanded);

      if (previousHasPopup === null) element.removeAttribute("aria-haspopup");
      else element.setAttribute("aria-haspopup", previousHasPopup);
    };
  }, [open]);

  /* ---- Activation ----------------------------------------------------- */

  const activate = useCallback(
    (item: MenuItem) => {
      if (item.disabled === true) return;

      item.onSelect?.();
      onAction?.(item.id);

      /*
       * A checkable item stays open.
       *
       * The pattern makes "close on activation" the rule for `menuitem` and explicitly carves out the two
       * checkable roles, because someone adjusting three switches expects to adjust three switches and
       * not to be thrown out of the menu after each one.
       */
      const shouldClose =
        (item.closeOnSelect ?? item.role === undefined) || item.role === "menuitem";
      if (shouldClose) close();
    },
    [close, onAction]
  );

  /* ---- Typeahead ------------------------------------------------------ */

  /**
   * Printable-character typeahead.
   *
   * The pattern's "any key corresponding to a printable character" rule. The buffer is reset on a 500ms
   * timer so `m` then `a` finds "Ma…" rather than requiring the letters to be typed inside one window —
   * without it, cycling through items that start with the same letter is impossible.
   */
  const bufferRef = useRef("");
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (bufferTimerRef.current !== undefined) clearTimeout(bufferTimerRef.current);
    },
    []
  );

  const typeahead = useCallback((character: string) => {
    const surface = surfaceRef.current;
    if (surface === null) return;

    const rows = [...surface.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];

    const wasEmpty = bufferRef.current === "";

    if (bufferTimerRef.current !== undefined) clearTimeout(bufferTimerRef.current);
    bufferRef.current += character.toLowerCase();
    bufferTimerRef.current = setTimeout(() => {
      bufferRef.current = "";
    }, 500);

    /*
     * `textContent` rather than a `label` field, because `label` is a `ReactNode` and could be an element, a
     * fragment or an icon. What a screen reader would read is the row's text, so that is what is matched.
     */
    const query = bufferRef.current;

    /*
     * A fresh buffer searches from the top; a repeat continues from the focused row.
     *
     * This is what makes repeated characters cycle. Searching from the focused row on the *first* press
     * would skip the very first match, and typing `s` three times over "Save / Share / Sign out" would
     * reach Share first and never come back to Save without cycling round.
     */
    const from = wasEmpty ? 0 : rows.indexOf(document.activeElement as HTMLElement) + 1;
    const ordered = [...rows.slice(from), ...rows.slice(0, from)];

    /*
     * A multi-character buffer that matches nothing falls back to the single character, so a mistyped prefix
     * does not leave the user with a dead keyboard until the buffer times out.
     */
    const match =
      ordered.find((row) => (row.textContent ?? "").trim().toLowerCase().startsWith(query)) ??
      (query.length > 1
        ? ordered.find((row) =>
            (row.textContent ?? "").trim().toLowerCase().startsWith(character.toLowerCase())
          )
        : undefined);

    match?.focus();
  }, []);

  /* ---- Keyboard ------------------------------------------------------- */

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    /*
     * Tab closes rather than moving between rows.
     *
     * A menu is a composite widget: the arrow keys move between items and Tab leaves. Letting Tab walk the
     * rows would put the user in a list they then have to Tab *out* of one row at a time, which is not what
     * Tab means anywhere else on the page.
     */
    if (event.key === "Tab") {
      close();
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      const focused = document.activeElement as HTMLElement | null;
      const entry = itemEntries.find((candidate) => candidate.id === focused?.dataset.menuId);

      if (entry !== undefined && !isSeparator(entry)) {
        // Space on a row scrolls the page unless it is prevented; Enter and Space are the activation keys.
        event.preventDefault();
        activate(entry);
        return;
      }
    }

    /*
     * A single printable character, and not a modifier combination. `event.key.length === 1` is the test the
     * pattern describes and it correctly rejects "ArrowDown", "Enter", "Shift" and "F5" in one comparison.
     */
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeahead(event.key);
      return;
    }

    /*
     * Handled last, and only what is left over.
     *
     * Arrow keys, Home and End were already consumed by the row's own handler and called `preventDefault`, so
     * everything arriving here is either Enter, Space, a printable character or something irrelevant. Calling
     * the consumer's `onKeyDown` here as well would run it twice for every arrow key.
     */
  };

  const accessibleName = label ?? resolveMessage(undefined, BASE_MESSAGES, "common.menu");

  /*
   * Nothing is rendered when closed — not `display: none`, not an empty portal. A menu left in the DOM is
   * still reachable by Tab in some assistive technology and still leaves a `role="menu"` in the tree.
   */
  if (!open) return null;

  let rowIndex = 0;

  return (
    <Portal>
      <div
        {...rest}
        ref={surfaceRefCallback}
        className={cx("uir-menu", className)}
        style={style}
        /*
         * `role="menu"` with a name, per the pattern. `aria-label` rather than `aria-labelledby` because the
         * menu has no visible heading of its own; the trigger's own text would be the better label, and a
         * consumer who wants that passes `label` explicitly.
         */
        role="menu"
        aria-label={accessibleName}
        data-placement={position?.placement ?? placement}
        onKeyDown={composeHandlers(onMenuKeyDown, onKeyDown)}
      >
        {items.map((entry, entryIndex) => {
          if (isSeparator(entry)) {
            /*
             * `role="separator"`, no tab stop and no interactivity. A focusable divider is a row the user
             * can land on and cannot use, which is worse than not being able to reach it.
             */
            return (
              <div
                key={entry.id ?? `separator-${entryIndex}`}
                className="uir-menu__separator"
                role="separator"
              />
            );
          }

          const checkable = entry.role !== undefined && entry.role !== "menuitem";
          const checked = checkable && entry.checked === true;
          const current = rowIndex;
          rowIndex += 1;

          return (
            <div
              key={entry.id}
              {...getItemProps(current)}
              className="uir-menu__item"
              /*
               * Roving navigation is attached to each *row*, not to the surface.
               *
               * The hook derives both the group and the current row from `event.currentTarget` and that
               * target's parent, which is the only way it can work without being told what the group is. On
               * the surface, `currentTarget` would be the surface itself, `indexOf` would find nothing, and
               * every arrow key would be silently ignored.
               *
               * Arrow keys and Home/End are handled here and stopped; printable characters and Enter/Space
               * fall through to bubble to the surface, which is where activation and typeahead belong.
               *
               * A modified arrow key is declined here rather than in the shared hook. `Ctrl`/`Cmd` + Arrow is
               * the conventional "open the submenu" chord and `Alt` + Arrow is a browser navigation chord, so
               * treating either as "next item" would steal a shortcut the page may legitimately own. The hook
               * stays generic and each component decides whether a modified arrow belongs to it.
               */
              onKeyDown={(event) => {
                if (event.ctrlKey || event.metaKey || event.altKey) return;
                handleKeyDown(event);
              }}
              /*
               * The id is mirrored onto a data attribute purely so the keyboard handler can map the focused
               * element back to its entry. `aria-*` and `role` already say what the row *is*; this says which
               * one it is, which the DOM cannot otherwise express.
               */
              data-menu-id={entry.id}
              role={entry.role ?? "menuitem"}
              /*
               * `aria-checked` is **required** on `menuitemcheckbox` and `menuitemradio`, so it is emitted for
               * them unconditionally - defaulting to `"false"` rather than being omitted when the caller
               * passes no `checked`. Omitting it leaves a menu item with an incomplete role, which assistive
               * technology reports as a critical failure rather than as "off".
               *
               * A plain `menuitem` must **not** carry the attribute at all: `aria-checked` is not valid for
               * that role, and a state on a role that has no states is worse than no state.
               */
              aria-checked={checkable ? checked : undefined}
              aria-disabled={entry.disabled === true ? true : undefined}
              data-checked={checked ? "" : undefined}
              data-disabled={entry.disabled === true ? "" : undefined}
              onClick={(event) => {
                if (entry.disabled === true) {
                  event.preventDefault();
                  return;
                }
                activate(entry);
              }}
            >
              {entry.icon !== undefined ? (
                <span className="uir-menu__icon" aria-hidden="true">
                  {entry.icon}
                </span>
              ) : null}

              <span className="uir-menu__label">{entry.label}</span>

              {entry.description !== undefined ? (
                <span className="uir-menu__description">{entry.description}</span>
              ) : null}

              {/*
               * The check mark is decorative. `aria-checked` on the row is what a screen reader reports,
               * and a tick read as a character on top of that is the same fact twice.
               */}
              {checked ? <span className="uir-menu__check" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
    </Portal>
  );
});
