/**
 * Drawer.
 *
 * A panel that slides in from an edge. Modal or not — and the default is **not** modal, which is the
 * component's most consequential decision and the one worth arguing for.
 *
 * Modal is a focus trap and a scroll lock. Both are real costs to impose on a page, and for the most
 * common drawer there is none — a navigation drawer. A navigation drawer that traps focus is *worse*
 * than one that does not, because the user cannot reach the navigation item they opened it to change.
 */

import { useCallback, useEffect, useId, useRef } from "react";
import {
  composeHandlers,
  composeRefs,
  cx,
  Portal,
  useControllableState,
  useFocusTrap,
  useScrollLock,
} from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./drawer.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import { IconButton } from "../icon-button";

import type { DrawerProps, DrawerCloseReason } from "./drawer.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export function Drawer(props: DrawerProps) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onClose,
    onDismiss,
    placement = "inline-start",
    modal = false,
    size,
    title,
    showClose = true,
    closeLabel,
    header,
    footer,
    dismissOnBackdropClick = true,
    disabled = false,
    initialFocus = "first",
    className,
    style,
    ref,
    onKeyDown,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
  });

  const baseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `${baseId}-title`;

  /*
   * Focus the panel when it attaches, if the drawer is not modal.
   *
   * A callback ref rather than an effect, and the reason is `Portal`: it renders `null` on its first
   * pass so the server and client markup match, which means `panelRef.current` is still `null` when
   * every layout effect on mount runs. An effect keyed on `[modal, open]` would fire once against an
   * empty ref and never fire again — the drawer would open with focus still on the page behind it, and
   * a keyboard user could not get in. A callback ref fires when the node actually arrives.
   *
   * The modal path is the focus trap's job, and is deliberately skipped here: focusing the panel
   * *and* trapping would fight over the same element.
   */
  const attachPanel = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      if (node === null || modal) return;

      const previouslyFocused = document.activeElement as HTMLElement | null;
      node.focus({ preventScroll: true });
      restoreFocusTo.current = previouslyFocused;
    },
    [modal]
  );

  /** Where focus goes when the drawer closes, if the drawer moved it. */
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      restoreFocusTo.current?.focus?.({ preventScroll: true });
      restoreFocusTo.current = null;
    };
  }, [open]);

  /*
   * Ask to close, once.
   *
   * The `closed` ref is what makes Escape and a backdrop press landing in the same tick safe: a
   * consumer that navigates on `onDismiss` would otherwise navigate twice.
   */
  const closed = useRef(false);

  useEffect(() => {
    closed.current = false;
  }, [open]);

  const requestClose = useCallback(
    (reason: DrawerCloseReason) => {
      if (closed.current) return;
      closed.current = true;

      onClose?.(reason);
      /*
       * A controlled drawer does not close itself. The consumer decides, exactly as with `Dialog` —
       * and `programmatic` is the reason for a consumer-driven close, so a consumer can tell its own
       * reset apart from a user's dismissal.
       */
      if (openProp === undefined) setOpen(false);
      onDismiss?.(reason);
    },
    [onClose, onDismiss, openProp, setOpen]
  );

  /* ---- Modal behaviour ----------------------------------------------- */

  useScrollLock(modal && open);

  useFocusTrap({
    active: modal && open,
    containerRef: panelRef,
    /*
     * `container` focuses the panel itself.
     *
     * The alternative — the first tabbable descendant — is the close control in every drawer that has
     * one, which means the user opens a drawer and their first action is to close it. `none` leaves
     * focus where it was, which is the consumer's problem and their choice.
     */
    initialFocus:
      initialFocus === "none"
        ? () => null
        : initialFocus === "container"
          ? () => panelRef.current
          : undefined,
  });

  /*
   * Focus the panel when it is **not** modal.
   *
   * Handled in `attachPanel` above rather than here, because `Portal` renders `null` on its first pass
   * and an effect would fire against an empty ref exactly once.
   */

  /* ---- Input --------------------------------------------------------- */

  const handleKeyDown = composeHandlers<React.KeyboardEvent<HTMLDivElement>>((event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    requestClose("escape");
  }, onKeyDown);

  const onBackdropClick = (): void => {
    if (!dismissOnBackdropClick) return;
    requestClose("dismiss");
  };

  const vertical = placement === "inline-start" || placement === "inline-end";

  /*
   * The accessible name.
   *
   * A visible `title` names the drawer through `aria-labelledby`; otherwise whatever the consumer
   * passed through the root props is used. Stated here rather than spread across two attributes,
   * because `aria-label` and `aria-labelledby` together produce a name whose precedence is
   * `aria-labelledby` first — so setting both when only one was given gets the wrong answer.
   */
  const labelledBy = isRenderable(title) ? titleId : rest["aria-labelledby"];
  const label = labelledBy === undefined ? rest["aria-label"] : undefined;

  return (
    <Portal>
      {open ? (
        <>
          {modal ? (
            /*
             * The backdrop.
             *
             * `aria-hidden`, because it is a presentation of "the rest of the page is unavailable" and
             * `aria-modal` on the panel already says that. A backdrop in the accessibility tree is a
             * focusable stop that goes nowhere.
             */
            <div
              className="uir-drawer__backdrop"
              onPointerDown={onBackdropClick}
              aria-hidden="true"
            />
          ) : null}

          <div
            {...rest}
            ref={composeRefs<HTMLDivElement>(attachPanel, panelRef, ref)}
            /*
             * `role="dialog"` whether or not it is modal.
             *
             * A non-modal drawer is still a dialog: it has a name, it can contain anything, and
             * `dialog` is what tells a screen reader it is a region to read rather than a part of the
             * page flow. What differs is `aria-modal`, which is a promise about the *rest* of the
             * page — and this component only makes it when it has trapped focus and locked scrolling
             * to keep it.
             */
            role="dialog"
            aria-modal={modal || undefined}
            aria-labelledby={labelledBy}
            aria-label={label}
            /*
             * `tabIndex={-1}` so the panel can receive focus programmatically.
             *
             * It is not a tab stop — the elements inside it are — but without this the non-modal
             * path above cannot focus the panel at all.
             */
            tabIndex={-1}
            className={cx("uir-drawer", className)}
            style={{
              ...style,
              ...(size === undefined ? {} : vertical ? { inlineSize: size } : { blockSize: size }),
            }}
            data-placement={placement}
            data-modal={modal ? "" : undefined}
            data-disabled={disabled ? "" : undefined}
            data-vertical={vertical ? "" : undefined}
            onKeyDown={handleKeyDown}
          >
            {isRenderable(header) ? <div className="uir-drawer__header">{header}</div> : null}

            {isRenderable(title) || showClose ? (
              <div className="uir-drawer__titlebar">
                {isRenderable(title) ? (
                  /*
                   * An `<h2>`.
                   *
                   * Fixed rather than configurable: the drawer's heading is a level in the document's
                   * outline, and a consumer who needs a different level can put their own heading in
                   * `header`. One level in the component, rather than a prop every caller has to
                   * think about.
                   */
                  <h2 className="uir-drawer__title" id={titleId}>
                    {title}
                  </h2>
                ) : (
                  <span />
                )}

                {showClose ? (
                  /*
                   * An `IconButton`, not a bare `<button>`.
                   *
                   * The drawer's close control is the same object as every other icon-only control in
                   * the library — square, one control height, the library's hover and focus ring — and
                   * hand-rolling it here is how it ended up with an up-arrow glyph and a glyph that was
                   * not centred inside its own button. Composing the shared component makes both of
                   * those impossible rather than merely fixed.
                   */
                  <IconButton
                    className="uir-drawer__close"
                    aria-label={closeLabel ?? "Close"}
                    onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(() => {
                      requestClose("dismiss");
                    }, undefined)}
                  >
                    {
                      /*
                       * Two crossed bars, drawn from `::before` and `::after` on one span.
                       *
                       * An `X` needs four arms and the previous version drew two: a square with a
                       * block-start and an inline-start border, rotated 45°, which is one arm of the
                       * cross and reads as an up-arrow. A box with all four borders and a
                       * background-coloured patch over the middle would draw a cross, but the patch is
                       * the *page's* colour, which is what makes it wrong over a translucent backdrop and
                       * on a scrollbar. Two bars need nothing but `currentColor`.
                       */
                      <span className="uir-drawer__close-glyph" aria-hidden="true" />
                    }
                  </IconButton>
                ) : null}
              </div>
            ) : null}

            <div className="uir-drawer__body">{children}</div>

            {isRenderable(footer) ? <div className="uir-drawer__footer">{footer}</div> : null}
          </div>
        </>
      ) : null}
    </Portal>
  );
}
