/**
 * Alert.
 *
 * A persistent message in the page: a validation summary, a failed upload, a billing warning.
 *
 * The one thing that distinguishes it from `Snackbar` is that it does not go away on its own and it
 * lives in the document flow where the user can scroll back to it. Everything else — role, urgency, the
 * tone glyph, the dismiss control — is shared vocabulary between the two.
 */

import { forwardRef, useEffect } from "react";
import { composeHandlers, cx } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./alert.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { AlertProps } from "./alert.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  const {
    children,
    role: roleProp,
    urgency: urgencyProp,
    tone = "neutral",
    variant = "subtle",
    title,
    titleLevel = "h3",
    action,
    dismissible = false,
    dismissLabel,
    onDismiss,
    icon,
    className,
    style,
    onClick,
    ...rest
  } = props;

  /*
   * Urgency from tone, unless stated.
   *
   * `danger` is the only tone that means "this will cost you", and it is the only one that justifies
   * interrupting a screen reader mid-sentence. Deriving it means a consumer who reaches for `tone`
   * gets the right announcement without reaching for a second prop.
   */
  const urgency = urgencyProp ?? (tone === "danger" ? "assertive" : "polite");

  /*
   * The role follows the urgency, and is not independently settable.
   *
   * `role="alert"` is an implicit `aria-live="assertive"` and `role="status"` is `polite`, so the two
   * are the same fact. Letting them disagree would produce an error banner that waits its turn to be
   * read, or an info banner that shouts. `role` stays in the props as a way to *state* the derived
   * value explicitly, and it is validated against `urgency` in development.
   */
  const role = roleProp ?? (urgency === "assertive" ? "alert" : "status");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (roleProp === undefined) return;

    const expected = urgency === "assertive" ? "alert" : "status";
    if (roleProp === expected) return;

    console.warn(
      `Alert: \`role="${roleProp}"\` with \`urgency="${urgency}"\` is contradictory. ` +
        `role="${expected}"` +
        (expected === "alert" ? " is implicitly assertive and " : " is implicitly polite and ") +
        "the two always say the same thing. Ignoring `role`."
    );
  }, [roleProp, urgency]);

  const dismissName = dismissLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.close");

  const Title = titleLevel;

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-alert", className)}
      style={style}
      role={role}
      /*
       * `aria-live` stated even though the role implies it.
       *
       * `aria-atomic="true"` is the half that is not implied and is the half that matters: without it
       * a screen reader announces only the *changed* part, so replacing "3 items failed" with "3 items
       * failed, 1 recovered" announces "1 recovered" with no context.
       */
      aria-live={urgency}
      aria-atomic="true"
      data-tone={tone}
      data-variant={variant}
      data-urgency={urgency}
      data-dismissible={dismissible ? "" : undefined}
      data-has-title={isRenderable(title) ? "" : undefined}
      data-has-action={isRenderable(action) ? "" : undefined}
      /*
       * The root's own click, for clicks on the body rather than on the control.
       *
       * The dismiss button stops propagation and composes this handler in directly, so a click on the
       * button is handled exactly once — and by the same ordering as a click on the body.
       */
      onClick={onClick}
    >
      {isRenderable(icon) ? (
        <span className="uir-alert__icon" aria-hidden="true">
          {icon}
        </span>
      ) : tone === "neutral" ? null : (
        /*
         * The tone glyph.
         *
         * `aria-hidden`, because the tone is not something a screen reader can usefully relay and the
         * message text already carries the meaning. Suppressed for `neutral`: an information mark
         * beside text that says nothing is decoration.
         */
        <span className="uir-alert__glyph" data-tone={tone} aria-hidden="true" />
      )}

      <div className="uir-alert__body">
        {isRenderable(title) ? (
          /*
           * A real heading.
           *
           * So the alert appears in a screen reader's heading list, which is how a user skips past it
           * to the content they came for. A bold `<div>` is not in that list.
           */
          <Title className="uir-alert__title">{title}</Title>
        ) : null}

        <div className="uir-alert__message">{children}</div>

        {isRenderable(action) ? <div className="uir-alert__action">{action}</div> : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          className="uir-alert__dismiss"
          aria-label={dismissName}
          onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(
            (event) => {
              event.stopPropagation();
              onDismiss?.();
            },
            /*
             * The consumer's own `onClick`, composed onto the control rather than left to bubble.
             *
             * The root is an ancestor of this button, so it could run two ways: by bubbling to a root
             * handler, or by being passed here. `stopPropagation` above rules out the first, and
             * passing it here is what makes the library-wide ordering hold — consumer first, with
             * `preventDefault()` as the opt-out. Without it the consumer's handler would run *after*
             * the dismissal, which is the one order that makes `preventDefault()` meaningless.
             *
             * Wrapped rather than cast: `onClick` is typed for the root's `<div>`, and React's event
             * types are not covariant, so a handler taking `MouseEvent<HTMLDivElement>` cannot be
             * handed a `MouseEvent<HTMLButtonElement>`. The cast is inside the wrapper, at the one
             * place the two element types genuinely meet — a click on a control that is inside the
             * alert — rather than spread across the prop's own signature.
             */
            onClick === undefined
              ? undefined
              : (event: React.MouseEvent<HTMLButtonElement>): void => {
                  onClick(event as unknown as React.MouseEvent<HTMLDivElement>);
                }
          )}
        >
          {/* Two rotated bars, so the cross is `currentcolor` and needs nothing in forced colours. */}
          <span className="uir-alert__dismiss-glyph" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});
