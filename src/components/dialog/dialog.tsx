/**
 * Dialog.
 *
 * A modal surface that interrupts the page: a confirmation, a form, a message that has to be
 * dealt with before anything else.
 *
 * It deliberately does not compose `Popover`. A dialog is viewport-centred rather than anchored,
 * has no arrow and no placement, and its dismissal rules are not optional in the way a popover's
 * are. Forcing it into `Popover` with a `centre` placement would be reuse for its own sake. What it
 * does share is the infrastructure: `Portal`, `useScrollLock`, `useFocusTrap` and `useDismiss`
 * from `src/internal/overlay.ts` and `src/internal/focus.ts`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Portal,
  cx,
  useControllableState,
  useDismiss,
  useFocusTrap,
  useScrollLock,
} from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./dialog.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`. Importing
 * it from JavaScript would make the package non-tree-shakeable and would duplicate the rules in
 * every consumer bundle.
 */

import type { DialogCloseReason, DialogProps } from "./dialog.types";

/**
 * Whether a slot has anything to render. `0` and `""` count as renderable; only `undefined`,
 * `null` and `false` mean "not supplied".
 */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * A modal surface.
 *
 * ```html
 * <div class="uir-dialog__backdrop" aria-hidden="true"></div>
 * <div class="uir-dialog" role="dialog" aria-modal="true" aria-labelledby>
 *   <div class="uir-dialog__header">
 *     <h2 class="uir-dialog__title" id>…</h2>
 *     <button class="uir-dialog__close">…</button>
 *   </div>
 *   <div class="uir-dialog__content">…</div>
 *   <div class="uir-dialog__footer">…</div>
 * </div>
 * ```
 */
export function Dialog(props: DialogProps) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    urgency = "normal",
    title,
    label,
    tone = "neutral",
    size = "md",
    initialFocus = "auto",
    restoreFocus = true,
    closeOnEscape = true,
    closeOnBackdropPress = true,
    header,
    footer,
    showCloseButton = false,
    closeButtonLabel,
    className,
    style,
    children,
    id,
    ref,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  /*
   * Whether the surface node exists *yet*.
   *
   * `Portal` renders nothing on its first pass, because it must or the server and the client would
   * disagree. The surface therefore arrives one commit after `open` flips, so anything keyed off
   * `open` alone runs against a container that is not there yet — and `useFocusTrap` keys its
   * effect off ref identity, so it never looks again. This is the same trap `Popover` fell into.
   */
  const [surfaceNode, setSurfaceNode] = useState<HTMLDivElement | null>(null);

  const attachSurface = useCallback((node: HTMLDivElement | null) => {
    setSurfaceNode(node);
  }, []);

  /*
   * A ref object built from `surfaceNode` rather than a mutable one, so `useFocusTrap`'s effect
   * re-runs when the node appears. Its dependency is the ref *identity*, and a ref whose `.current`
   * changes in place produces no new identity — so a `useRef` here would leave the trap activated
   * against a container that does not exist yet, and it would never look again.
   *
   * `useMemo` rather than a literal: a fresh object on every render would re-run the trap's effect
   * on every render of an open dialog, stealing focus back to its first element each time.
   */
  const trapContainerRef = useMemo<React.RefObject<HTMLDivElement | null>>(
    () => ({ current: surfaceNode }),
    [surfaceNode]
  );

  /* ---- Modality ------------------------------------------------------ */

  /*
   * A dialog is always modal. That is its entire definition: it interrupts the page, and the rest
   * of the page cannot be interacted with until it is answered. `aria-modal` is therefore not
   * configurable even though it is configurable elsewhere in the ecosystem, because a non-modal
   * `dialog` role is a contradiction; there is no `modal` prop here because there is no non-modal
   * mode.
   */
  useScrollLock(open);
  useDismiss({
    active: open,
    onDismiss: (reason) => {
      /*
       * `useDismiss` reports `"outside-press"`, but a dialog has no meaningful outside: the
       * backdrop covers the page, so its press is the backdrop's press, reported below. Mapping the
       * one case that is not Escape onto the backdrop reason keeps the type honest — a dialog is
       * never dismissed by clicking "somewhere else", only by clicking *the backdrop*.
       */
      setOpen(false);
      onClose?.(reason === "escape" ? "escape" : "backdrop-press");
    },
    containerRef: trapContainerRef,
    escape: closeOnEscape,
    outsidePress: false,
  });

  useFocusTrap({
    active: open && surfaceNode !== null,
    containerRef: trapContainerRef,
    initialFocus: initialFocus === "container" ? trapContainerRef : undefined,
    restoreFocus,
  });

  /*
   * A dialog with no name is announced as "dialog" and nothing else, which is not enough to tell
   * a user what they have just been interrupted by. Warns in development, never throws, because a
   * consumer who labelled it with their own `aria-label` has satisfied a requirement this cannot
   * see. Same rule as `Popover`, `Textbox` and `ToggleButtonGroup`.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !open) return;
    if (isRenderable(title) || label !== undefined) return;

    console.warn(
      "Dialog: no accessible name. Pass `title` (rendered as a visible heading) or `label`. " +
        'A `role="dialog"` with no name is announced as "dialog" and nothing else.'
    );
  }, [label, open, title]);

  if (!open) return null;

  const hasTitle = isRenderable(title);
  const titleId = hasTitle && id !== undefined ? `${id}-title` : undefined;

  /*
   * The surface's accessible name.
   *
   * `aria-label` is written after `{...rest}` in the JSX, because it must not be emitted when a
   * heading exists — a dangling `aria-labelledby` makes assistive technology fall back to nothing
   * and suppress the `aria-label` with it. But "written after the spread" also means it would
   * overwrite a consumer's own `aria-label`, dropping the name and leaving an unnamed
   * `role="dialog"`. So the consumer's value is read out of `rest` and used as the fallback.
   *
   * The same reasoning, and the same fix, as `Popover`.
   */
  const consumerAriaLabel = rest["aria-label"];
  const consumerAriaLabelledBy = rest["aria-labelledby"];
  const accessibleName = label ?? consumerAriaLabel;
  const labelledBy = titleId ?? consumerAriaLabelledBy;

  const closeLabel = closeButtonLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.close");

  const close = (reason: DialogCloseReason): void => {
    setOpen(false);
    onClose?.(reason);
  };

  return (
    <Portal>
      {/*
        `aria-hidden` rather than an interactive element: the backdrop is not a control, and the
        Escape and backdrop-press paths are handled by `useDismiss` and the click below. Giving
        it `aria-hidden` keeps it out of the accessibility tree, where an unnamed, unlabelled
        button would be an axe violation and a tab stop nobody can name.
      */}
      <div
        className="uir-dialog__backdrop"
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdropPress) close("backdrop-press");
        }}
      />

      <div
        {...rest}
        ref={mergeRefs(attachSurface, ref)}
        id={id}
        className={cx("uir-dialog", className)}
        style={style}
        /*
         * `alertdialog` when `urgency="alert"`, because an `alertdialog` is an assertive live
         * region: assistive technology announces the dialog as soon as it appears rather than
         * waiting to be read. That is exactly right for a destructive confirmation the user must
         * not miss, and wrong for anything routine.
         */
        role={urgency === "alert" ? "alertdialog" : "dialog"}
        /*
         * `tabindex="-1"` so the surface is programmatically focusable but not a tab stop.
         *
         * Required for `initialFocus="container"` — a `<div>` without it is not focusable at all,
         * so `element.focus()` silently does nothing and focus stays on `<body>`, outside the dialog
         * the user is supposed to be inside. `useFocusTrap` sets the same attribute for an empty
         * dialog; setting it here covers both paths from the markup.
         */
        tabIndex={-1}
        aria-modal="true"
        aria-label={labelledBy === undefined ? accessibleName : undefined}
        aria-labelledby={labelledBy}
        data-size={size}
        data-tone={tone}
        data-urgency={urgency}
      >
        {(isRenderable(header) || hasTitle || showCloseButton) && (
          <div className="uir-dialog__header">
            {isRenderable(header) ? (
              <div className="uir-dialog__header-content">{header}</div>
            ) : null}

            {hasTitle ? (
              <h2 className="uir-dialog__title" id={titleId}>
                {title}
              </h2>
            ) : null}

            {showCloseButton ? (
              <button
                type="button"
                className="uir-dialog__close"
                aria-label={closeLabel}
                onClick={() => close("escape")}
              >
                {/* A typographic glyph, decorative by construction: the button's name is the label. */}
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>
        )}

        <div className="uir-dialog__content">{children}</div>

        {isRenderable(footer) ? <div className="uir-dialog__footer">{footer}</div> : null}
      </div>
    </Portal>
  );
}

/**
 * Merge the callback ref and the consumer's ref.
 *
 * Written out rather than using `composeRefs`, because `useCallback` on the consumer's side is not
 * something this component controls and `composeRefs` already handles the `undefined` case — the
 * only reason to inline it here would have been brevity, and brevity is not worth a second
 * identity to reason about when the ref object must be rebuilt on every render.
 */
function mergeRefs(
  attach: (node: HTMLDivElement | null) => void,
  consumer: React.Ref<HTMLDivElement> | undefined
): (node: HTMLDivElement | null) => void {
  return (node: HTMLDivElement | null) => {
    attach(node);
    if (typeof consumer === "function") consumer(node);
    else if (consumer !== null && consumer !== undefined) {
      (consumer as { current: HTMLDivElement | null }).current = node;
    }
  };
}
